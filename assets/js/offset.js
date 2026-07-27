/* =====================================================================
   offset.js — OFSET, tam analitik (poligonlaştırma yok)
   offset.js — OFFSET, fully analytic (no polygonisation)

   prim: {kind:'line', s0,d,L,t0,t1} | {kind:'arc', c,r,oa0,orig,sign,t0,t1}
   ===================================================================== */
const CLOSE_TOL = 0.02;
const TANG_SIN = 0.0087;   // ~0.5°: bu açının altındaki dönüşler teğet sayılır / turns below this count as tangent

function primPtLine(o, t) { return add(o.s0, mul(o.d, t)); }
function primPtArc(o, t) { return add(o.c, mul(rhat(o.oa0 + o.sign * t), o.r)); }
function primStart(o) { return o.kind === 'line' ? primPtLine(o, o.t0) : primPtArc(o, o.t0); }
function primEnd(o) { return o.kind === 'line' ? primPtLine(o, o.t1) : primPtArc(o, o.t1); }
function spanPos(o, th) {
  let q = o.sign > 0 ? (th - o.oa0) : (o.oa0 - th);
  q = ((q % TAU) + TAU) % TAU;
  if (q > o.orig + Math.PI) q -= TAU;
  return q;
}
function primPos(o, X) {
  return o.kind === 'line' ? dot(sub(X, o.s0), o.d)
    : spanPos(o, Math.atan2(X.y - o.c.y, X.x - o.c.x));
}
function primGeom(o) { return o.kind === 'line' ? { kind: 'line', p: o.s0, d: o.d } : { kind: 'circle', c: o.c, r: o.r }; }
function primMax(o) { return o.kind === 'line' ? o.L : o.orig; }
function primBad(o, tol) {
  return !(o.t0 >= -tol && o.t1 <= primMax(o) + tol && o.t1 >= o.t0 - tol * 0.001);
}
function primSample(o, out, tol) {
  if (o.kind === 'line') { out.push(primPtLine(o, o.t0)); out.push(primPtLine(o, o.t1)); return; }
  const span = Math.abs(o.t1 - o.t0);
  const n = Math.max(1, Math.min(360, Math.ceil(span / 0.035)));
  for (let i = 0; i <= n; i++) out.push(primPtArc(o, o.t0 + (o.t1 - o.t0) * i / n));
}
function primPt(o, t) { return o.kind === 'line' ? primPtLine(o, t) : primPtArc(o, t); }
function primBBox(o) {
  if (o.kind === 'line') {
    const a = primStart(o), b = primEnd(o);
    return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) };
  }
  return { x0: o.c.x - o.r, x1: o.c.x + o.r, y0: o.c.y - o.r, y1: o.c.y + o.r };
}
function pathPolyline(path) {
  const out = [];
  for (const o of path) primSample(o, out);
  return out;
}

function buildPrims(els, side, r) {
  const prims = [];
  for (const e of els) {
    if (e.type === 'line') {
      const d = nrm(sub(e.p1, e.p0)), L = dist(e.p0, e.p1), nv = mul(perp(d), side);
      prims.push({ kind: 'line', s0: add(e.p0, mul(nv, r)), d, L, t0: 0, t1: L, block: e.block, z0: e.z0, z1: e.z1 });
    } else {
      const rr = e.r + side * (e.sweep > 0 ? -1 : 1) * r;
      if (rr <= 1e-9) return { flip: { block: e.block, p: elStart(e) } };
      prims.push({
        kind: 'arc', c: e.c, r: rr, oa0: e.a0, orig: Math.abs(e.sweep),
        sign: e.sweep > 0 ? 1 : -1, t0: 0, t1: Math.abs(e.sweep), block: e.block, z0: e.z0, z1: e.z1
      });
    }
  }
  return { prims };
}

/* --- ofset yolunu kur; ok=false ise yarıçap çok büyük ---
   r < 0  =>  dış ofset: yol konturun öbür tarafına kayar, kanal büyür.
   Geometrik olarak "side'a r kadar ofset" ile "-side'a |r| kadar ofset" aynı
   şeydir; işareti burada bir kez normalize edince aşağıdaki içbükey/dışbükey
   ayrımı, köşe yuvarlama yarıçapı ve yay ters dönme testi olduğu gibi çalışır.

   --- build the offset path; ok=false means the radius is too large ---
   r < 0  =>  outward offset: the path moves to the other side of the contour
   and the slot grows. Normalising the sign once here keeps the concave/convex
   split, the corner rounding radius and the arc-reversal test intact. */
function offsetPath(els, side, r, collect, gouge) {
  if (r < 0) { side = -side; r = -r; }
  const bp = buildPrims(els, side, r);
  if (bp.flip) return { ok: false, fails: [{ block: bp.flip.block, kind: 'arcflip', p: bp.flip.p }], path: null };
  const off = bp.prims, n = off.length;
  const scale = Math.max(1, r);
  const tol = 1e-7 * scale;
  const closed = n > 2 && dist(elStart(els[0]), elEnd(els[n - 1])) < CLOSE_TOL;
  const joins = n - 1 + (closed ? 1 : 0);
  const kinds = new Array(joins).fill(0);   // 0 teğet, 1 içbükey, -1 dışbükey / tangent, concave, convex
  const fails = [];

  for (let k = 0; k < joins; k++) {
    const i = k, j = (k + 1) % n;
    const A = els[i], B = els[j];
    const c = crs(elEndDir(A), elStartDir(B)), dp = dot(elEndDir(A), elStartDir(B));
    if (Math.abs(c) < TANG_SIN && dp > 0) { kinds[k] = 0; continue; }   // teğet / tangent (CAM rounding tolerance)
    if (side * c > 0) {
      kinds[k] = 1;
      const cands = geomInt(primGeom(off[i]), primGeom(off[j]));
      if (!cands.length) {
        fails.push({ block: B.block, kind: 'nojoin', p: elEnd(A) });
        if (!collect) return { ok: false, fails, path: null };
        continue;
      }
      const e0 = primEnd(off[i]), s1 = primStart(off[j]);
      const hiI = primMax(off[i]), loJ = off[j].t0, hiJ = off[j].t1;
      let X = null, best = Infinity;
      for (const q of cands) {
        const ta = primPos(off[i], q), tb = primPos(off[j], q);
        const pen = Math.max(0, off[i].t0 - ta) + Math.max(0, ta - hiI)
          + Math.max(0, loJ - tb) + Math.max(0, tb - hiJ);
        const sc = pen * 1e3 + dist(q, e0) + dist(q, s1);
        if (sc < best) { best = sc; X = q; }
      }
      off[i].t1 = primPos(off[i], X);
      off[j].t0 = primPos(off[j], X);
    } else kinds[k] = -1;
  }

  for (let oi = 0; oi < off.length; oi++) {           // off[i] <-> els[i] birebir / one to one
    if (primBad(off[oi], tol)) {
      fails.push({ block: off[oi].block, kind: 'reversal', p: elMid(els[oi]) });
      if (!collect) return { ok: false, fails, path: null };
    }
  }

  // dışbükey köşelerde takım yuvarlanma yayı / tool roll-around arc at convex corners
  const path = [];
  for (let k = 0; k < n; k++) {
    path.push(off[k]);
    const jk = (k < joins) ? k : -1;
    if (jk >= 0 && kinds[jk] === -1) {
      const V = elEnd(els[k]), P0 = primEnd(off[k]), P1 = primStart(off[(k + 1) % n]);
      const a0 = Math.atan2(P0.y - V.y, P0.x - V.x), a1 = Math.atan2(P1.y - V.y, P1.x - V.x);
      const sign = -side;
      const lk = {
        kind: 'arc', c: V, r, oa0: a0, orig: TAU, sign, t0: 0, t1: 0, block: els[k].block, link: true,
        z0: els[k].z1, z1: els[k].z1
      };
      lk.t1 = spanPos(lk, a1); if (lk.t1 > Math.PI * 1.9) lk.t1 = 0; lk.orig = lk.t1;
      path.push(lk);
    }
  }
  if (fails.length && !collect) return { ok: false, fails, path };
  if (gouge === false) return { ok: fails.length === 0, fails, path, closed };

  // uzaktaki parçalarla çakışma (dar boğaz) — yalnız aynı Z seviyesinde
  // clash with distant parts (narrow throat) — only at the same Z level
  const m = path.length;
  const bb = path.map(o => primBBox(o));
  for (let a = 0; a < m; a++) {
    for (let b = a + 2; b < m; b++) {
      if (closed && a === 0 && b === m - 1) continue;
      if (!zOverlap(path[a], path[b])) continue;
      if (bb[a].x1 < bb[b].x0 - tol || bb[b].x1 < bb[a].x0 - tol || bb[a].y1 < bb[b].y0 - tol || bb[b].y1 < bb[a].y0 - tol) continue;
      const cands = geomInt(primGeom(path[a]), primGeom(path[b]));
      for (const X of cands) {
        const ta = primPos(path[a], X), tb = primPos(path[b], X);
        const ea = 1e-6 * scale;
        if (ta > path[a].t0 + ea && ta < path[a].t1 - ea && tb > path[b].t0 + ea && tb < path[b].t1 - ea) {
          fails.push({
            block: path[a].block, kind: 'overlap', p: X,
            b2: path[b].block, ia: a, ib: b, ta, tb
          });
          if (!collect) return { ok: false, fails, path };
        }
      }
    }
  }
  return { ok: fails.length === 0, fails, path, closed };
}

function distToGeom(P, g) {
  if (!g) return Infinity;
  if (g.kind === 'line') return Math.abs(crs(g.d, sub(P, g.p)));
  return Math.abs(dist(P, g.c) - g.r);
}

function zOverlap(a, b) {
  if (a.z0 === undefined || b.z0 === undefined) return true;
  const a0 = Math.min(a.z0, a.z1), a1 = Math.max(a.z0, a.z1);
  const b0 = Math.min(b.z0, b.z1), b1 = Math.max(b.z0, b.z1);
  return a1 >= b0 - 1e-6 && b1 >= a0 - 1e-6;
}

/* Etkin yarıçap r'de parçada oluşacak bozulmalar.
   Bir kontur elemanı ofsette tamamen yutulduğunda kumanda ya durur (M120 yoksa)
   ya da elemanı atlayıp köşeyi keser. İkinci durumda yolun o yüzeyin içine
   girdiği miktar = gerçek talaş fazlası. Ölçtüğümüz bu.

   Damage produced on the part at effective radius r.
   When a contour element is fully swallowed by the offset the control either
   stops (no M120) or skips the element and cuts the corner. In the second case
   how far the path enters that surface is the real overcut. That is what we measure. */
function damageAt(els, side, r, withThroat) {
  const res = offsetPath(els, side, r, true, !!withThroat);
  const out = { gouges: [], throats: [], arcs: [] };
  if (!res.path) {
    (res.fails || []).forEach(f => { if (f.kind === 'arcflip') out.arcs.push({ block: f.block, p: f.p }); });
    return out;
  }
  const prims = res.path.filter(o => !o.link);
  const bad = new Set();
  res.fails.forEach(f => {
    if (f.kind === 'arcflip') out.arcs.push({ block: f.block, p: f.p });
    if (f.kind === 'overlap') out.throats.push({ block: f.block, b2: f.b2, p: f.p });
    if (f.kind === 'reversal') bad.add(f.block);
  });
  const idxOf = new Map(); prims.forEach((o, i) => idxOf.set(o.block, i));
  const n = prims.length;
  for (const blk of bad) {
    const k = idxOf.get(blk); if (k === undefined) continue;
    let i = k - 1, j = k + 1;
    while (i >= 0 && bad.has(prims[i].block)) i--;
    while (j < n && bad.has(prims[j].block)) j++;
    if (i < 0 || j >= n) continue;
    const cands = geomInt(primGeom(prims[i]), primGeom(prims[j]));
    if (!cands.length) continue;
    const ref = primPt(prims[k], (prims[k].t0 + prims[k].t1) / 2);
    let Y = cands[0]; for (const q of cands) if (dist(q, ref) < dist(Y, ref)) Y = q;
    const depth = distToGeom(Y, primGeom(prims[k]));
    if (isFinite(depth)) out.gouges.push({ block: blk, p: elMid(els[k]), depth, cut: Y });
  }
  out.gouges.sort((a, b) => b.depth - a.depth);
  return out;
}
