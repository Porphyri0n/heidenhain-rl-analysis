/* =====================================================================
   analysis.js — DALIŞ / BAĞLANTI HAREKETLERİ ve DR TARAMASI
   analysis.js — PLUNGE / LINK MOVES and DR SWEEP

   Model: program CAM'in bastığı takım merkez yoludur, DR bir "pay bırakma
   kadranı"dır. Etkin yarıçap r = R_tablo + DR kadar RL yönünde kaydırılan
   merkez yolu, fiziksel yarıçap Rf ile süpürülünce işlenmiş alanı verir:
        S(r) = { x : dist(x, merkezYolu(r)) <= Rf }
   Düzeltme kapalı hareketler (dalış, çıkış, ara konumlama) DR ile YERİNDE
   KALIR. O hareketin süpürdüğü kapsül S(r)'nin dışına taşarsa, o taşma
   nihai duvarda kalıcı hasardır. DR büyüdükçe S(r) daralır, taşma artar.

   Model: the program is the tool centre path posted by CAM and DR is a
   "stock dial". The centre path shifted by the effective radius r = R_table + DR
   toward RL, swept with the physical radius Rf, gives the machined area:
        S(r) = { x : dist(x, centrePath(r)) <= Rf }
   Moves with compensation off (plunge, exit, positioning) STAY PUT as DR
   changes. Wherever the capsule swept by such a move breaks out of S(r), that
   break-out is permanent damage on the final wall. As DR grows S(r) shrinks
   and the break-out grows.
   ===================================================================== */
function segDist(P, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  if (L2 < 1e-18) return Math.hypot(P.x - a.x, P.y - a.y);
  let t = ((P.x - a.x) * dx + (P.y - a.y) * dy) / L2;
  t = t < 0 ? 0 : (t > 1 ? 1 : t);
  return Math.hypot(P.x - a.x - t * dx, P.y - a.y - t * dy);
}

function buildIdx(segs, cell) {
  if (!segs.length) return null;
  let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18;
  for (const s of segs) {
    x0 = Math.min(x0, s.a.x, s.b.x); x1 = Math.max(x1, s.a.x, s.b.x);
    y0 = Math.min(y0, s.a.y, s.b.y); y1 = Math.max(y1, s.a.y, s.b.y);
  }
  cell = cell || 0.5;
  // hücre yoğunluğa göre küçülsün, ama halka taraması patlamasın diye tabanı var
  // shrink the cell with density, but keep a floor so the ring scan does not blow up
  const area = Math.max(1e-6, (x1 - x0 + cell) * (y1 - y0 + cell));
  cell = Math.max(cell / 6, Math.min(cell, Math.sqrt(area / Math.max(1, segs.length)) * 2.5));
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell) + 1);
  const ny = Math.max(1, Math.ceil((y1 - y0) / cell) + 1);
  const buckets = new Array(nx * ny);
  segs.forEach((s, k) => {
    const i0 = Math.floor((Math.min(s.a.x, s.b.x) - x0) / cell), i1 = Math.floor((Math.max(s.a.x, s.b.x) - x0) / cell);
    const j0 = Math.floor((Math.min(s.a.y, s.b.y) - y0) / cell), j1 = Math.floor((Math.max(s.a.y, s.b.y) - y0) / cell);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      if (i < 0 || j < 0 || i >= nx || j >= ny) continue;
      const id = j * nx + i; (buckets[id] || (buckets[id] = [])).push(k);
    }
  });
  return { segs, x0, y0, nx, ny, cell, buckets };
}

function idxDist(ix, P, cap) {
  if (!ix) return cap;
  let best = cap;
  const ci = Math.floor((P.x - ix.x0) / ix.cell), cj = Math.floor((P.y - ix.y0) / ix.cell);
  const maxR = Math.ceil(cap / ix.cell) + 1;
  for (let r = 0; r <= maxR; r++) {
    if (r > 0 && (r - 1) * ix.cell > best) break;
    for (let i = ci - r; i <= ci + r; i++) {
      if (i < 0 || i >= ix.nx) continue;
      for (let j = cj - r; j <= cj + r; j++) {
        if (r > 0 && Math.abs(i - ci) !== r && Math.abs(j - cj) !== r) continue;
        if (j < 0 || j >= ix.ny) continue;
        const b = ix.buckets[j * ix.nx + i]; if (!b) continue;
        for (let q = 0; q < b.length; q++) {
          const s = ix.segs[b[q]], d = segDist(P, s.a, s.b);
          if (d < best) best = d;
        }
      }
    }
  }
  return best;
}

/* yay örneklemesi — sehim toleransına göre, mesafe alanı için yeterli
   arc sampling — by sagitta tolerance, good enough for the distance field */
function primSampleTol(o, out, sag) {
  if (o.kind === 'line') { out.push(primStart(o)); out.push(primEnd(o)); return; }
  const span = Math.abs(o.t1 - o.t0);
  const st = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - sag / Math.max(o.r, 1e-6))));
  const n = Math.max(1, Math.min(400, Math.ceil(span / Math.max(st, 0.02))));
  for (let i = 0; i <= n; i++) out.push(primPtArc(o, o.t0 + (o.t1 - o.t0) * i / n));
}

/* Bağlantı hareketlerinin çevresindeki ilgi alanları — indeksi buna daraltırız.
   Hiçbir konturla Z'de kesişmeyen hareket zaten değerlendirilmez; onu alma,
   yoksa parçayı boydan boya geçen Z10 konumlamaları tüm konturu içeri sokar.

   Regions of interest around the link moves — the index is narrowed to these.
   A move that overlaps no contour in Z is not evaluated anyway; leaving it out
   keeps a Z10 traverse across the whole part from dragging in the entire contour. */
function linkROIs(A, pad) {
  const out = [];
  const zs = A.results.map(R => R.zr).filter(Boolean);
  for (const lk of (A.links || [])) {
    if (lk.unsure) continue;
    const z0 = Math.min(lk.z0, lk.z1), z1 = Math.max(lk.z0, lk.z1);
    if (zs.length && !zs.some(z => z.z1 >= z0 - 1e-6 && z1 >= z.z0 - 1e-6)) continue;
    out.push({
      x0: Math.min(lk.p0.x, lk.p1.x) - pad, x1: Math.max(lk.p0.x, lk.p1.x) + pad,
      y0: Math.min(lk.p0.y, lk.p1.y) - pad, y1: Math.max(lk.p0.y, lk.p1.y) + pad
    });
  }
  return out;
}
function roiHitsBox(rois, bb) {
  for (const r of rois) if (!(bb.x1 < r.x0 || r.x1 < bb.x0 || bb.y1 < r.y0 || r.y1 < bb.y0)) return true;
  return false;
}
function inROI(rois, a, b) {
  return roiHitsBox(rois, {
    x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x),
    y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y)
  });
}

/* r etkin yarıçapında her konturun düzeltilmiş merkez yolu + uzaysal indeks
   compensated centre path of every contour at effective radius r + spatial index */
function machinedIndex(results, r, rois) {
  return results.map(R => {
    const off = offsetPath(R.els, R.side, r, true, false);
    if (!off.path || !off.path.length) return null;
    const segs = [];
    for (const o of off.path) {
      if (rois && !roiHitsBox(rois, primBBox(o))) continue;   // uzaktaki elemanı hiç örnekleme / skip distant elements
      const pts = []; primSampleTol(o, pts, 0.0015);
      for (let i = 1; i < pts.length; i++) {
        if (rois && !inROI(rois, pts[i - 1], pts[i])) continue;
        segs.push({ a: pts[i - 1], b: pts[i] });
      }
    }
    let last = null;
    for (let i = off.path.length - 1; i >= 0; i--) if (!off.path[i].link) { last = off.path[i]; break; }
    return {
      ix: buildIdx(segs), zr: R.zr,
      start: primStart(off.path[0]), end: last ? primEnd(last) : null, ok: off.ok
    };
  });
}

/* Kapsülün (a–b ekseni, Rf yarıçap) her indeks grubundan en uzak noktası.
   Sonuç Rf'yi aşarsa aradaki fark, o duvara giren taşma miktarıdır.
   Aynı örnek noktalar birden çok gruba karşı ölçülür (nominal / güncel).

   Farthest point of the capsule (axis a–b, radius Rf) from each index group.
   Where the result exceeds Rf, the difference is how far it breaks into the wall.
   The same sample points are measured against several groups (nominal / current). */
function capsuleMax(a, b, Rf, groups, cap) {
  const L = dist(a, b);
  const d = L > 1e-9 ? nrm(sub(b, a)) : { x: 1, y: 0 };
  const n = perp(d);
  const G = groups.length;
  const best = new Array(G).fill(-Infinity), at = new Array(G).fill(a);
  const probe = (P) => {
    for (let g = 0; g < G; g++) {
      const ixs = groups[g];
      let m = cap;
      for (let k = 0; k < ixs.length; k++) { const v = idxDist(ixs[k], P, m); if (v < m) m = v; }
      if (m > best[g]) { best[g] = m; at[g] = P; }
    }
  };
  const step = Math.max(0.003, Rf / 45);
  const nl = Math.max(1, Math.min(2000, Math.ceil(L / step)));
  for (let s = -1; s <= 1; s += 2)
    for (let i = 0; i <= nl; i++) probe(add(add(a, mul(d, L * i / nl)), mul(n, s * Rf)));
  const nc = Math.max(12, Math.min(360, Math.ceil(Math.PI * Rf / step)));
  const th0 = Math.atan2(n.y, n.x);
  for (let i = 0; i <= nc; i++) {
    probe(add(b, mul(rhat(th0 - Math.PI * i / nc), Rf)));
    probe(add(a, mul(rhat(th0 + Math.PI * i / nc), Rf)));
  }
  // iç ızgara: pasolar arasında sırt kalıyorsa yakalasın / inner grid: catch ridges left between passes
  for (let i = 0; i <= nl; i++) {
    const c0 = add(a, mul(d, L * i / nl));
    for (let k = -4; k <= 4; k++) if (k) probe(add(c0, mul(n, k * Rf / 5)));
  }
  return { d: best, at };
}

function linkKindOf(lk) {
  if (lk.kind !== 'link') return lk.kind;
  if (dist(lk.p0, lk.p1) > 1e-6) return 'link';
  return lk.z1 < lk.z0 ? 'plunge' : 'retract';
}

/* Bir etkin yarıçapta bağlantı hareketlerinin iki ölçütü:
     over    — o DR'de oluşacak duvarın ötesine taşma  (offset kaybı)
     overRef — nominal (referans DR) duvarın ötesine taşma (kalıcı hasar)

   Two measures for the link moves at one effective radius:
     over    — break-out past the wall produced at that DR (stock loss)
     overRef — break-out past the nominal (reference DR) wall (permanent damage) */
function linkProbe(A, idxCur, idxRef, Rf, cap, skip) {
  const out = [];
  for (const lk of (A.links || [])) {
    if (lk.unsure) continue;
    if (skip && skip.has(lk.block + '|' + lk.kind)) continue;   // referansta boşta / idle at reference
    let a = lk.p0, b = lk.p1;
    const m = (lk.ci !== undefined) ? idxCur[lk.ci] : null;
    if (lk.kind === 'on' && m && m.start) b = m.start;
    if (lk.kind === 'off' && m && m.end) a = m.end;
    const z0 = Math.min(lk.z0, lk.z1), z1 = Math.max(lk.z0, lk.z1);
    const pick = (idx) => {
      const ixs = [];
      for (const q of idx) {
        if (!q || !q.ix) continue;
        if (q.zr && !(q.zr.z1 >= z0 - 1e-6 && z1 >= q.zr.z0 - 1e-6)) continue;
        ixs.push(q.ix);
      }
      return ixs;
    };
    const gCur = pick(idxCur), gRef = idxRef ? pick(idxRef) : gCur;
    if (!gCur.length) continue;
    const cis = [];
    idxCur.forEach((q, i) => {
      if (!q || !q.ix) return;
      if (q.zr && !(q.zr.z1 >= z0 - 1e-6 && z1 >= q.zr.z0 - 1e-6)) return;
      cis.push(i);
    });
    const res = capsuleMax(a, b, Rf, [gCur, gRef], cap);
    out.push({
      key: lk.block + '|' + lk.kind, block: lk.block, kind: linkKindOf(lk),
      ci: lk.ci !== undefined ? lk.ci : (cis.length ? cis[0] : undefined), cis,
      a, b, z0, z1,
      over: Math.max(0, res.d[0] - Rf), overRef: Math.max(0, res.d[1] - Rf),
      at: res.at[0], atRef: res.at[1], cap
    });
  }
  return out;
}

/* DR taraması.
   kalıcı hasar = hareket nominal duvarın ötesine kesiyor  -> parça hurda riski
   offset kaybı = o noktada bırakılmak istenen pay tutmuyor -> yerel form hatası
   Referansta zaten boşta olan hareketler (kütük durumu bilinmiyor) elenir.

   DR sweep.
   permanent damage = the move cuts past the nominal wall -> scrap risk
   stock loss       = the stock meant to stay there does not hold -> local form error
   Moves already idle at the reference (blank condition unknown) are dropped. */
function damageWindow(A, o) {
  const Rt = o.rtab, Rf = o.rphys, drRef = o.drRef;
  /* Tarama yalnız pay bırakma bölgesindedir: DR = −R altında bırakılacak pay
     zaten yoktur, orada kayıp ölçmenin anlamı yok. Dış ofset burada sadece
     ROI'leri genişletir, ki seçili DR eksiye inince yol indeksin dışına düşmesin.

     The sweep covers only the stock-leaving zone: below DR = −R there is no
     stock to leave, so measuring loss there is meaningless. The outward offset
     only widens the ROIs here, so the path does not fall outside the index when
     the selected DR goes negative. */
  const nom = -Rt;
  const drMin = nom;
  const outRoom = Math.max(0, o.outRoom || 0);
  const cap = Rf * 3 + 0.25;
  const eps = o.eps === undefined ? 0.001 : o.eps;
  const ctlTop = isFinite(A.rmax) ? A.rmax - Rt : nom + Math.max(0.5, Rt * 2);
  const top = Math.max(nom, Math.min(ctlTop, nom + (o.span || 1.0)));
  const reach = Math.max(Math.abs(Rt + top), outRoom, Math.abs(Rt + drRef));
  const rois = linkROIs(A, Rf + cap + reach + 0.05);

  const idxRef = machinedIndex(A.results, Rt + drRef, rois);
  const base = new Map(), idle = new Set();
  linkProbe(A, idxRef, idxRef, Rf, cap).forEach(l => {
    base.set(l.key, l.over);
    if (l.over > Rf * 0.6) idle.add(l.key);        // referansta boşta / idle at reference
  });

  const N = Math.max(6, o.steps || 24);
  const rows = [], perLink = new Map();
  for (let i = 0; i <= N; i++) {
    const dr = drMin + (top - drMin) * (N ? i / N : 0);
    const idxCur = machinedIndex(A.results, Rt + dr, rois);
    const ls = linkProbe(A, idxCur, idxRef, Rf, cap, idle);
    let loss = 0, lossWho = null, harm = 0, harmWho = null;
    for (const l of ls) {
      const b0 = base.has(l.key) ? base.get(l.key) : 0;
      const lo = Math.max(0, l.over - b0);
      if (!perLink.has(l.key)) perLink.set(l.key, { link: l, base: b0, pts: [] });
      const rec = perLink.get(l.key);
      rec.link = l; rec.pts.push({ dr, loss: lo, harm: l.overRef });
      if (lo > loss) { loss = lo; lossWho = l; }
      if (l.overRef > harm) { harm = l.overRef; harmWho = l; }
    }
    rows.push({ dr, loss, lossWho, harm, harmWho });
  }
  const cross = (pts, key) => {
    if (!pts.length) return null;
    if (pts[0][key] > eps) return pts[0].dr;      // en alt DR'de bile aşıyor / exceeds even at the lowest DR
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][key] > eps) {
        const p0 = pts[i - 1], p1 = pts[i];
        if (p1[key] === p0[key]) return p0.dr;
        return p0.dr + (p1.dr - p0.dr) * (eps - p0[key]) / (p1[key] - p0[key]);
      }
    }
    return null;
  };
  const links = [...perLink.values()].map(v => ({
    link: v.link, base: v.base, pts: v.pts,
    lossLimit: cross(v.pts, 'loss'), harmLimit: cross(v.pts, 'harm')
  }));
  links.sort((a, b) => (a.lossLimit === null ? 1e9 : a.lossLimit) - (b.lossLimit === null ? 1e9 : b.lossLimit));
  return {
    drMin, nom, ctlTop, top, rows, links, base, cap, rois, idxRef, drRef, rphys: Rf, rtab: Rt,
    evaluated: links.length,
    byKey: new Map(links.map(v => [v.link.key, v])),
    lossTop: cross(rows, 'loss'), harmTop: cross(rows, 'harm'),
    unlimitedCtl: !isFinite(A.rmax)
  };
}

function analyseContour(con, opt) {
  const els = con.els;
  const pts = discretize(els, opt.tol || 0.01);
  let minx = 1e18, miny = 1e18, maxx = -1e18, maxy = -1e18;
  for (const p of pts) { minx = Math.min(minx, p.x); miny = Math.min(miny, p.y); maxx = Math.max(maxx, p.x); maxy = Math.max(maxy, p.y); }
  const diag = Math.hypot(maxx - minx, maxy - miny) || 10;
  const hi = diag * 0.75 + 1;
  const valid = r => offsetPath(els, con.side, r, false, false).ok;      // sadece kumanda hatası / control error only

  let rmax, unlimited = false;
  if (valid(hi)) { rmax = hi; unlimited = true; }
  else {
    let lo = 0, h = hi;
    for (let i = 0; i < 48; i++) { const m = (lo + h) / 2; if (valid(m)) lo = m; else h = m; }
    rmax = lo;
  }
  const critAt = (r) => {
    const res = offsetPath(els, con.side, r, true, false);
    const seen = new Map();
    for (const f of res.fails) {
      const k = f.block + '/' + f.kind;
      if (!seen.has(k)) seen.set(k, { block: f.block, kind: f.kind, p: f.p, n: 0 });
      seen.get(k).n++;
    }
    return [...seen.values()].slice(0, 12);
  };
  let crit = [];
  if (!unlimited) crit = critAt(rmax + Math.max(1e-6, diag * 1e-7));

  /* Dış ofset sınırı: yolu konturun öbür tarafına kaydırdığında (etkin yarıçap
     eksi) form nerede bozuluyor. İçeri ofsette iç yaylar sıkıştırır; dışarı
     ofsette bu sefer dışbükey köşe yayları ters döner ve dar sırtlarda yol
     kendini keser.

     Outward offset limit: where the form breaks down once the path is pushed to
     the other side of the contour (negative effective radius). Offsetting inward
     is pinched by inside arcs; offsetting outward inverts the convex corner arcs
     and makes the path cut itself across narrow ridges. */
  const validOut = r => offsetPath(els, con.side, -r, false, false).ok;
  let routMax, outUnlimited = false;
  if (validOut(hi)) { routMax = hi; outUnlimited = true; }
  else {
    let lo = 0, h = hi;
    for (let i = 0; i < 48; i++) { const m = (lo + h) / 2; if (validOut(m)) lo = m; else h = m; }
    routMax = lo;
  }
  const outCrit = outUnlimited ? [] : critAt(-(routMax + Math.max(1e-6, diag * 1e-7)));
  const concaveArcs = [];
  for (const e of els) {
    if (e.type !== 'arc') continue;
    if (con.side * (e.sweep > 0 ? -1 : 1) < 0)
      concaveArcs.push({ block: e.block, r: e.r, deg: Math.abs(e.sweep) * 180 / Math.PI });
  }
  concaveArcs.sort((a, b) => a.r - b.r);
  const corners = [];
  const closedC = els.length > 2 && dist(elStart(els[0]), elEnd(els[els.length - 1])) < CLOSE_TOL;
  const nj = els.length - 1 + (closedC ? 1 : 0);
  for (let i = 0; i < nj; i++) {
    const A = els[i], B = els[(i + 1) % els.length];
    const c = crs(elEndDir(A), elStartDir(B));
    if (con.side * c > 1e-9) {
      const turn = Math.atan2(Math.abs(c), dot(elEndDir(A), elStartDir(B))) * 180 / Math.PI;
      corners.push({
        block: B.block, inner: 180 - turn, p: elEnd(A),
        la: elLength(A), lb: elLength(B)
      });
    }
  }
  corners.sort((a, b) => a.inner - b.inner);
  return {
    pts, bbox: { minx, miny, maxx, maxy }, rmax, unlimited, crit, concaveArcs, corners,
    routMax, outUnlimited, outCrit,
    length: els.reduce((s, e) => s + elLength(e), 0)
  };
}

function analyseProgram(text, opt) {
  const parsed = parseProgram(text);
  const results = parsed.contours.map((c, i) => {
    const a = analyseContour(c, opt);
    return Object.assign({
      index: i + 1, side: c.side, sideName: c.sideName, startBlock: c.startBlock,
      apprLen: c.apprLen, apprFrom: c.apprFrom, apprTo: c.apprTo, apprZ: c.apprZ,
      depLen: c.depLen, depBlock: c.depBlock, depFrom: c.depFrom, depZ: c.depZ,
      els: c.els, count: c.els.length, zr: c.zr
    }, a);
  });
  let rmax = Infinity, limiter = null;
  for (const r of results) if (!r.unlimited && r.rmax < rmax) { rmax = r.rmax; limiter = r; }
  let routMax = Infinity, outLimiter = null;
  for (const r of results) if (!r.outUnlimited && r.routMax < routMax) { routMax = r.routMax; outLimiter = r; }
  return {
    results, warnings: parsed.warnings, stock: parsed.stock, toolCall: parsed.toolCall,
    links: parsed.links || [], rmax, limiter, routMax, outLimiter
  };
}

if (typeof module !== 'undefined' && module.exports) module.exports = {
  analyseProgram, parseProgram, analyseContour, linkProbe, damageWindow, machinedIndex
};
