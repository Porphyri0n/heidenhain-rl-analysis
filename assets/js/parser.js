/* =====================================================================
   parser.js — AYRIŞTIRICI (Klartext + basit ISO)
   parser.js — PARSER (Klartext + simple ISO)

   Uyarılar dile bağlı olmasın diye {k, p} biçiminde biriktirilir:
   k = çeviri anahtarı, p = yer tutucu değerleri. Metne çevirmek arayüzün işi.
   Warnings are collected as {k, p} so they stay language independent;
   the UI turns them into text.
   ===================================================================== */
function warn(k, p) { return { k: k, p: p || {} }; }

function coordOf(s, key) {
  let m = s.match(new RegExp('(?:^|\\s)' + key + '\\s?([+-]?\\d*\\.?\\d+)', 'i'));
  if (m) return { val: parseFloat(m[1]), inc: false };
  m = s.match(new RegExp('(?:^|\\s)I' + key + '\\s?([+-]?\\d*\\.?\\d+)', 'i'));
  if (m) return { val: parseFloat(m[1]), inc: true };
  return null;
}
function radiusOf(s) {
  let m = s.match(/(?:^|\s)R([+-]\d*\.?\d+)/i); if (m) return parseFloat(m[1]);
  m = s.match(/(?:^|\s)R(\d*\.?\d+)/i);
  if (m && !/^\s*R0(\s|$)/i.test(' ' + m[0].trim())) return parseFloat(m[1]);
  return null;
}
function drOf(s) { const m = s.match(/(?:^|\s)DR\s?([+-])/i); return m ? (m[1] === '+') : null; }

function parseProgram(text) {
  const klartext = /BEGIN\s+PGM/i.test(text) || /(^|\n)\s*\d+\s+(L|CC|CR|CT|APPR|TOOL\s+CALL)\b/i.test(text);
  return klartext ? parseKlartext(text) : parseISO(text);
}

function parseKlartext(text) {
  const warnings = [], contours = [], links = []; let stock = null, toolCall = null;
  let cur = null, pos = { x: 0, y: 0, z: 0 }, cc = null, lastDR = null, prevEl = null;
  let badXY = true, badZ = true, cid = 0;      // program başında konum bilinmiyor / position unknown at start
  const push = (el) => { if (cur) { cur.raw.push(el); if (el.type !== 'corner') prevEl = el; } };
  const closeContour = () => { if (cur) { if (cur.raw.some(e => e.type !== 'corner')) contours.push(cur); cur = null; prevEl = null; } };

  for (const rawLine of text.split(/\r?\n/)) {
    let s = rawLine; const ci = s.indexOf(';'); if (ci >= 0) s = s.slice(0, ci);
    s = s.trim(); if (!s) continue;
    let block = null; const bm = s.match(/^(\d+)\s+(.*)$/);
    if (bm) { block = parseInt(bm[1], 10); s = bm[2].trim(); }
    if (!s || s.startsWith('*')) continue;
    const U = s.toUpperCase();
    const t0 = U.split(/\s+/)[0];

    if (/^BLK\s+FORM/i.test(U)) {
      const cx = coordOf(U, 'X'), cy = coordOf(U, 'Y'), cz = coordOf(U, 'Z');
      if (cx && cy) {
        stock = stock || { x1: cx.val, y1: cy.val, x2: cx.val, y2: cy.val };
        stock.x1 = Math.min(stock.x1, cx.val); stock.y1 = Math.min(stock.y1, cy.val);
        stock.x2 = Math.max(stock.x2, cx.val); stock.y2 = Math.max(stock.y2, cy.val);
      }
      if (cz) {
        if (!stock) stock = {};
        stock.z1 = (stock.z1 === undefined) ? cz.val : Math.min(stock.z1, cz.val);
        stock.z2 = (stock.z2 === undefined) ? cz.val : Math.max(stock.z2, cz.val);
      }
      continue;
    }
    if (/^(BEGIN|END)\s+PGM/i.test(U)) { closeContour(); continue; }
    if (/\bM(2|30)\b/.test(U)) { /* devam et, aşağıda kapanır / keep going, closed below */ }

    // konumu belirsizleştiren komutlar: makine koordinatı, sınıra çekilme, düzlem çevirme
    // commands that make the position uncertain: machine coords, retract to limit, plane tilt
    if (/\bM9[12]\b/.test(U)) { badXY = true; badZ = true; }
    if (/\bM14\d\b/.test(U)) badZ = true;
    if (/^PLANE\b/.test(U) && /\b(TURN|MOVE)\b/.test(U)) { badXY = true; badZ = true; }
    if (/^(CYCL\s+CALL|CALL\s+LBL|L\s+CYCL)/.test(U)) { badXY = true; badZ = true; }

    const hasRL = /(?:^|\s)RL(?:\s|$)/.test(U), hasRR = /(?:^|\s)RR(?:\s|$)/.test(U);
    const hasR0 = /(?:^|\s)R0(?:\s|$)/.test(U);
    const isMotion = ['L', 'C', 'CR', 'CT', 'CC'].includes(t0) || t0.startsWith('APPR') || t0.startsWith('DEP');
    const isCorner = t0 === 'RND' || t0 === 'CHF';

    if (!isMotion && !isCorner) {
      if (/^TOOL\s+CALL/i.test(U) && !toolCall) {
        const tm = U.match(/^TOOL\s+CALL\s+(\S+)/);
        const dm = s.match(/(?:^|\s)DR\s?([+-]?\d*\.?\d+)/i);
        toolCall = { tool: tm ? tm[1] : null, dr: dm ? parseFloat(dm[1]) : null, block };
      }
      if (/\bM(2|30)\b/.test(U)) closeContour();
      continue;                                   // TOOL CALL, CYCL, LBL, FN, PLANE ...
    }

    // ---- CC : daire merkezi / circle centre
    if (t0 === 'CC') {
      const cx = coordOf(s, 'X'), cy = coordOf(s, 'Y');
      const nc = {
        x: cx ? (cx.inc ? pos.x + cx.val : cx.val) : pos.x,
        y: cy ? (cy.inc ? pos.y + cy.val : cy.val) : pos.y
      };
      cc = nc; continue;
    }
    // ---- köşe elemanları / corner elements
    if (isCorner) {
      const v = t0 === 'RND' ? radiusOf(s) : (s.match(/(?:^|\s)CHF\s?([+-]?\d*\.?\d+)/i) || [])[1];
      const val = parseFloat(v);
      if (cur && isFinite(val) && val > 0) push({ type: 'corner', kind: t0, val, block });
      continue;
    }

    const startP = { x: pos.x, y: pos.y };
    const cxv = coordOf(s, 'X'), cyv = coordOf(s, 'Y'), czv = coordOf(s, 'Z');
    const endP = {
      x: cxv ? (cxv.inc ? pos.x + cxv.val : cxv.val) : pos.x,
      y: cyv ? (cyv.inc ? pos.y + cyv.val : cyv.val) : pos.y
    };
    const newZ = czv ? (czv.inc ? pos.z + czv.val : czv.val) : pos.z;

    // düzeltme kapalıyken yapılan her hareket bir "bağlantı": dalış, çıkış, ara konumlama.
    // Bunlar takım merkezine göre programlanır, DR ile yer değiştirmez.
    // every move made with compensation off is a "link": plunge, exit, intermediate positioning.
    // They are programmed on the tool centre and do not shift with DR.
    const wasBadXY = badXY, wasBadZ = badZ;
    if (cxv && cyv) badXY = false;
    if (czv) badZ = false;
    const mkLink = (kind, extra) => {
      if (dist(startP, endP) < 1e-9 && Math.abs(newZ - pos.z) < 1e-9) return;
      links.push(Object.assign({
        kind, block, p0: { x: startP.x, y: startP.y }, p1: { x: endP.x, y: endP.y },
        z0: pos.z, z1: newZ, unsure: wasBadXY || wasBadZ
      }, extra || {}));
    };

    // ---- düzeltme aç / compensation on
    if ((hasRL || hasRR) && !cur) {
      const id = cid++;
      mkLink('on', { cid: id });
      cur = {
        id, side: hasRL ? 1 : -1, sideName: hasRL ? 'RL' : 'RR', raw: [], startBlock: block,
        apprLen: dist(startP, { x: endP.x, y: endP.y }),
        apprFrom: { x: startP.x, y: startP.y }, apprTo: { x: endP.x, y: endP.y }, apprZ: newZ
      };
      pos = { x: endP.x, y: endP.y, z: newZ }; cc = null; prevEl = null; continue;
    }
    // ---- düzeltme kapat / compensation off
    if (hasR0 || t0.startsWith('DEP')) {
      if (cur) {
        cur.depLen = dist(startP, { x: endP.x, y: endP.y }); cur.depBlock = block;
        cur.depFrom = { x: startP.x, y: startP.y }; cur.depZ = pos.z;
        mkLink('off', { cid: cur.id });
      } else mkLink('link');
      closeContour(); pos = { x: endP.x, y: endP.y, z: newZ }; cc = null; continue;
    }
    if (!cur) { mkLink('link'); pos = { x: endP.x, y: endP.y, z: newZ }; continue; }
    if (t0.startsWith('APPR')) { pos = { x: endP.x, y: endP.y, z: newZ }; continue; }

    const moved = dist(startP, endP) > 1e-7;
    if (t0 === 'L') {
      if (moved) push({ type: 'line', p0: startP, p1: { x: endP.x, y: endP.y }, block, z0: pos.z, z1: newZ });
    } else if (t0 === 'C') {
      const dr = drOf(s); if (dr !== null) lastDR = dr;
      if (!cc) {
        warnings.push(warn('warn.noCC', { block }));
        if (moved) push({ type: 'line', p0: startP, p1: endP, block, z0: pos.z, z1: newZ });
      }
      else push(Object.assign(makeArcFromCenter(startP, endP, cc, lastDR === null ? true : lastDR, block), { z0: pos.z, z1: newZ }));
    } else if (t0 === 'CR') {
      const R = radiusOf(s), dr = drOf(s); if (dr !== null) lastDR = dr;
      const c2 = (R !== null) ? centerFromCR(startP, endP, R, lastDR === null ? true : lastDR) : null;
      if (!c2) {
        warnings.push(warn('warn.crChord', { block }));
        if (moved) push({ type: 'line', p0: startP, p1: endP, block, z0: pos.z, z1: newZ });
      }
      else { cc = c2; push(Object.assign(makeArcFromCenter(startP, endP, c2, lastDR === null ? true : lastDR, block), { z0: pos.z, z1: newZ })); }
    } else if (t0 === 'CT') {
      const d0 = prevEl ? elEndDir(prevEl) : null;
      if (!d0) { if (moved) push({ type: 'line', p0: startP, p1: endP, block, z0: pos.z, z1: newZ }); }
      else {
        const n = perp(d0), v = sub(startP, endP), dn = dot(n, v);
        if (Math.abs(dn) < 1e-9) { if (moved) push({ type: 'line', p0: startP, p1: endP, block, z0: pos.z, z1: newZ }); }
        else {
          const k = -dot(v, v) / (2 * dn), c2 = add(startP, mul(n, k));
          const ccw = k > 0;
          cc = c2; push(Object.assign(makeArcFromCenter(startP, endP, c2, ccw, block), { z0: pos.z, z1: newZ }));
        }
      }
    }
    pos = { x: endP.x, y: endP.y, z: newZ };
    if (/\bM(2|30)\b/.test(U)) closeContour();
  }
  closeContour();
  return finalize(contours, warnings, stock, toolCall, links);
}

function parseISO(text) {
  const warnings = [], contours = [], links = []; let stock = null;
  let cur = null, pos = { x: 0, y: 0, z: 0 }, motion = 0, comp = 0, prevEl = null, abs = true;
  let cid = 0;
  const closeContour = () => { if (cur) { if (cur.raw.some(e => e.type !== 'corner')) contours.push(cur); cur = null; prevEl = null; } };
  const val = (s, k) => { const m = s.match(new RegExp(k + '\\s?([+-]?\\d*\\.?\\d+)', 'i')); return m ? parseFloat(m[1]) : null; };

  for (const rawLine of text.split(/\r?\n/)) {
    let s = rawLine.replace(/\(.*?\)/g, '');
    const ci = s.indexOf(';'); if (ci >= 0) s = s.slice(0, ci);
    s = s.trim(); if (!s) continue;
    let block = null; const bm = s.match(/^N\s?(\d+)\s*(.*)$/i);
    if (bm) { block = parseInt(bm[1], 10); s = bm[2]; }
    const U = s.toUpperCase();
    const gs = [...U.matchAll(/G\s?(\d+)/g)].map(m => parseInt(m[1], 10));
    for (const g of gs) {
      if ([0, 1, 2, 3].includes(g)) motion = g;
      if (g === 40) { closeContour(); comp = 0; }
      if (g === 41) comp = 1;
      if (g === 42) comp = -1;
      if (g === 90) abs = true;
      if (g === 91) abs = false;
    }
    const X = val(U, 'X'), Y = val(U, 'Y'), Z = val(U, 'Z');
    if (X === null && Y === null && Z === null) { if (/M0?(2|30)/.test(U)) closeContour(); continue; }
    const startP = { x: pos.x, y: pos.y };
    const endP = { x: X === null ? pos.x : (abs ? X : pos.x + X), y: Y === null ? pos.y : (abs ? Y : pos.y + Y) };
    const newZ = Z === null ? pos.z : (abs ? Z : pos.z + Z);

    const zr = { z0: pos.z, z1: newZ };
    const mkLink = (kind, extra) => {
      if (dist(startP, endP) < 1e-9 && Math.abs(newZ - pos.z) < 1e-9) return;
      links.push(Object.assign({
        kind, block, p0: { x: startP.x, y: startP.y }, p1: { x: endP.x, y: endP.y },
        z0: pos.z, z1: newZ, unsure: false
      }, extra || {}));
    };

    if (comp !== 0 && !cur) {
      const id = cid++;
      mkLink('on', { cid: id });
      cur = { id, side: comp, sideName: comp === 1 ? 'G41' : 'G42', raw: [], startBlock: block };
      pos = { x: endP.x, y: endP.y, z: newZ }; continue;
    }
    if (cur) {
      const moved = dist(startP, endP) > 1e-7;
      if (motion === 2 || motion === 3) {
        const I = val(U, 'I'), J = val(U, 'J'), R = val(U, 'R');
        const ccw = (motion === 3);
        let c2 = null;
        if (I !== null || J !== null) c2 = { x: startP.x + (I || 0), y: startP.y + (J || 0) };
        else if (R !== null) c2 = centerFromCR(startP, endP, R, ccw);
        if (c2) { const el = Object.assign(makeArcFromCenter(startP, endP, c2, ccw, block), zr); cur.raw.push(el); prevEl = el; }
        else if (moved) { const el = Object.assign({ type: 'line', p0: startP, p1: endP, block }, zr); cur.raw.push(el); prevEl = el; }
      } else if (moved) {
        const el = Object.assign({ type: 'line', p0: startP, p1: endP, block }, zr); cur.raw.push(el); prevEl = el;
      }
    } else mkLink('link');
    pos = { x: endP.x, y: endP.y, z: newZ };
  }
  closeContour();
  return finalize(contours, warnings, stock, null, links);
}

/* ---- RND / CHF uygula / apply ---- */
function applyCorners(raw, warnings) {
  const out = [];
  for (const item of raw) {
    if (item.type !== 'corner') { out.push(item); continue; }
    out.push(item);                              // yer tutucu, ikinci geçişte / placeholder, second pass
  }
  const res = [];
  for (let i = 0; i < out.length; i++) {
    const it = out[i];
    if (it.type !== 'corner') { res.push(it); continue; }
    const A = res[res.length - 1];
    let jn = i + 1; while (jn < out.length && out[jn].type === 'corner') jn++;
    const B = out[jn];
    if (!A || !B) { continue; }
    if (it.kind === 'RND') {
      const f = makeFillet(A, B, it.val, it.block);
      if (f) res.push(f);
      else warnings.push(warn('warn.rnd', { block: it.block, v: it.val }));
    } else {
      const f = makeChamfer(A, B, it.val, it.block);
      if (f) res.push(f);
      else warnings.push(warn('warn.chf', { block: it.block, v: it.val }));
    }
  }
  return res;
}
function makeFillet(A, B, R, block) {
  const dA = elEndDir(A), dB = elStartDir(B), t = crs(dA, dB);
  if (Math.abs(t) < 1e-7) return null;
  const side = t > 0 ? 1 : -1;
  const cands = geomInt(offsetGeom(A, R, side), offsetGeom(B, R, side));
  if (!cands.length) return null;
  const V = elEnd(A);
  let c = cands[0]; for (const q of cands) if (dist(q, V) < dist(c, V)) c = q;
  if (dist(c, V) > R * 4 + 1e-6) return null;
  const tA = projOnEl(A, c), tB = projOnEl(B, c);
  trimEnd(A, tA); trimStart(B, tB);
  const a0 = Math.atan2(tA.y - c.y, tA.x - c.x), a1 = Math.atan2(tB.y - c.y, tB.x - c.x);
  return { type: 'arc', c, r: R, a0, sweep: angDelta(a0, a1, t > 0), block };
}
function makeChamfer(A, B, L, block) {
  if (A.type !== 'line' || B.type !== 'line') return null;
  const dA = elEndDir(A), dB = elStartDir(B);
  if (Math.abs(crs(dA, dB)) < 1e-7) return null;
  const V = elEnd(A);
  if (elLength(A) <= L || elLength(B) <= L) return null;
  const pA = sub(V, mul(dA, L)), pB = add(V, mul(dB, L));
  trimEnd(A, pA); trimStart(B, pB);
  return { type: 'line', p0: pA, p1: pB, block };
}

function finalize(contours, warnings, stock, toolCall, links) {
  const out = [], byId = new Map();
  for (const c of contours) {
    const els = applyCorners(c.raw, warnings).filter(e => elLength(e) > 1e-7);
    if (!els.length) continue;
    if (c.id !== undefined) byId.set(c.id, out.length);
    out.push({
      side: c.side, sideName: c.sideName, startBlock: c.startBlock, els, zr: elsZRange(els),
      apprLen: c.apprLen, apprFrom: c.apprFrom, apprTo: c.apprTo, apprZ: c.apprZ,
      depLen: c.depLen, depBlock: c.depBlock, depFrom: c.depFrom, depZ: c.depZ
    });
  }
  // bağlantı hareketlerini nihai kontur sırasına bağla / bind link moves to final contour order
  const lk = (links || []).map(l => {
    const ci = (l.cid !== undefined && byId.has(l.cid)) ? byId.get(l.cid) : undefined;
    return (l.kind !== 'link' && ci === undefined) ? Object.assign({}, l, { kind: 'link', ci }) : Object.assign({}, l, { ci });
  });
  if (!out.length) warnings.push(warn('warn.noContour'));
  return { contours: out, warnings, stock, toolCall: toolCall || null, links: lk };
}

function elsZRange(els) {
  let z0 = Infinity, z1 = -Infinity, any = false;
  for (const e of els) {
    if (e.z0 === undefined || e.z1 === undefined) continue;
    any = true; z0 = Math.min(z0, e.z0, e.z1); z1 = Math.max(z1, e.z0, e.z1);
  }
  return any ? { z0, z1 } : null;
}
