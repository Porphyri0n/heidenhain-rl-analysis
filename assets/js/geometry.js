/* =====================================================================
   geometry.js — GEOMETRİ ÇEKİRDEĞİ / GEOMETRY CORE

   Elemanlar / elements:
     {type:'line', p0:{x,y}, p1:{x,y}, block}
     {type:'arc',  c:{x,y}, r, a0, sweep, block}   sweep>0 => CCW
   ===================================================================== */
const TAU = Math.PI * 2;
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a, k) => ({ x: a.x * k, y: a.y * k });
const len = a => Math.hypot(a.x, a.y);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const dot = (a, b) => a.x * b.x + a.y * b.y;
const crs = (a, b) => a.x * b.y - a.y * b.x;
const perp = a => ({ x: -a.y, y: a.x });               // +90° (CCW) = sol normal / left normal
const nrm = a => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
const rhat = t => ({ x: Math.cos(t), y: Math.sin(t) });
const rnd = (v, n = 3) => Math.round(v * Math.pow(10, n)) / Math.pow(10, n);

function angDelta(a0, a1, ccw) {
  let d = a1 - a0;
  if (ccw) { while (d <= 1e-12) d += TAU; while (d > TAU + 1e-12) d -= TAU; }
  else { while (d >= -1e-12) d -= TAU; while (d < -TAU - 1e-12) d += TAU; }
  return d;
}
function elStart(e) { return e.type === 'line' ? e.p0 : add(e.c, mul(rhat(e.a0), e.r)); }
function elEnd(e) { return e.type === 'line' ? e.p1 : add(e.c, mul(rhat(e.a0 + e.sweep), e.r)); }
function elStartDir(e) {
  if (e.type === 'line') return nrm(sub(e.p1, e.p0));
  const t = perp(rhat(e.a0)); return e.sweep > 0 ? t : mul(t, -1);
}
function elEndDir(e) {
  if (e.type === 'line') return nrm(sub(e.p1, e.p0));
  const t = perp(rhat(e.a0 + e.sweep)); return e.sweep > 0 ? t : mul(t, -1);
}
function elLength(e) { return e.type === 'line' ? dist(e.p0, e.p1) : Math.abs(e.sweep) * e.r; }
function elMid(e) {
  if (e.type === 'line') return mul(add(e.p0, e.p1), 0.5);
  return add(e.c, mul(rhat(e.a0 + e.sweep / 2), e.r));
}

/* ---- kesişimler / intersections ---- */
function lineLineInt(p1, d1, p2, d2) {
  const den = crs(d1, d2); if (Math.abs(den) < 1e-12) return null;
  const t = crs(sub(p2, p1), d2) / den; return add(p1, mul(d1, t));
}
function lineCircleInt(p, d, c, r) {
  const f = sub(p, c), a = dot(d, d), b = 2 * dot(f, d), cc = dot(f, f) - r * r;
  const disc = b * b - 4 * a * cc; if (disc < 0) return [];
  const s = Math.sqrt(disc);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)].map(t => add(p, mul(d, t)));
}
function circleCircleInt(c1, r1, c2, r2) {
  const dv = sub(c2, c1), d = len(dv);
  if (d < 1e-12) return [];
  if (d > r1 + r2 + 1e-7 || d < Math.abs(r1 - r2) - 1e-7) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const pm = add(c1, mul(dv, a / d)), pv = mul(perp(mul(dv, 1 / d)), h);
  return [add(pm, pv), sub(pm, pv)];
}
function offsetGeom(e, R, side) {          // side=+1 => yol yönünün soluna / left of travel
  if (e.type === 'line') {
    const d = nrm(sub(e.p1, e.p0));
    return { kind: 'line', p: add(e.p0, mul(perp(d), R * side)), d };
  }
  const rr = e.r + side * (e.sweep > 0 ? -1 : 1) * R;
  if (rr <= 1e-7) return null;
  return { kind: 'circle', c: e.c, r: rr };
}
function geomInt(g1, g2) {
  if (!g1 || !g2) return [];
  if (g1.kind === 'line' && g2.kind === 'line') { const x = lineLineInt(g1.p, g1.d, g2.p, g2.d); return x ? [x] : []; }
  if (g1.kind === 'line') return lineCircleInt(g1.p, g1.d, g2.c, g2.r);
  if (g2.kind === 'line') return lineCircleInt(g2.p, g2.d, g1.c, g1.r);
  return circleCircleInt(g1.c, g1.r, g2.c, g2.r);
}
function projOnEl(e, p) {
  if (e.type === 'line') {
    const d = nrm(sub(e.p1, e.p0));
    return add(e.p0, mul(d, dot(sub(p, e.p0), d)));
  }
  return add(e.c, mul(nrm(sub(p, e.c)), e.r));
}
function trimEnd(e, p) {
  if (e.type === 'line') { e.p1 = { x: p.x, y: p.y }; return; }
  const th = Math.atan2(p.y - e.c.y, p.x - e.c.x);
  let d = angDelta(e.a0, th, e.sweep > 0);
  if (Math.abs(d) > Math.abs(e.sweep)) d = e.sweep;
  e.sweep = d;
}
function trimStart(e, p) {
  if (e.type === 'line') { e.p0 = { x: p.x, y: p.y }; return; }
  const th = Math.atan2(p.y - e.c.y, p.x - e.c.x);
  let d = angDelta(e.a0, th, e.sweep > 0);
  if (Math.abs(d) > Math.abs(e.sweep)) d = 0;
  e.a0 = th; e.sweep = e.sweep - d;
}

/* ---- yay kurucular / arc constructors ---- */
function makeArcFromCenter(S, E, cc, ccw, block) {
  const r = dist(S, cc);
  const a0 = Math.atan2(S.y - cc.y, S.x - cc.x);
  const a1 = Math.atan2(E.y - cc.y, E.x - cc.x);
  const sweep = angDelta(a0, a1, ccw);
  return { type: 'arc', c: { x: cc.x, y: cc.y }, r, a0, sweep, block };
}
function centerFromCR(S, E, R, ccw) {
  const aR = Math.abs(R), d = dist(S, E);
  if (d < 1e-9 || d > 2 * aR + 1e-6) return null;
  const mid = mul(add(S, E), 0.5);
  const u = nrm(sub(E, S));
  const h = Math.sqrt(Math.max(0, aR * aR - (d / 2) * (d / 2)));
  const n = perp(u);
  const cands = [add(mid, mul(n, h)), sub(mid, mul(n, h))];
  const wantBig = R < 0;                     // R- => yay >180° / arc >180°
  for (const c of cands) {
    const a0 = Math.atan2(S.y - c.y, S.x - c.x), a1 = Math.atan2(E.y - c.y, E.x - c.x);
    const sw = Math.abs(angDelta(a0, a1, ccw));
    if (wantBig ? sw > Math.PI - 1e-6 : sw <= Math.PI + 1e-6) return c;
  }
  return cands[0];
}

/* --- görüntü için kontur poligonu / contour polygon for display --- */
function discretize(els, sag) {
  const pts = [];
  for (const e of els) {
    if (e.type === 'line') {
      if (!pts.length) pts.push({ x: e.p0.x, y: e.p0.y, block: e.block });
      pts.push({ x: e.p1.x, y: e.p1.y, block: e.block });
    } else {
      const step = Math.min(Math.PI / 90, 2 * Math.acos(Math.max(-1, Math.min(1, 1 - sag / Math.max(e.r, 1e-6)))) || 0.02);
      const n = Math.max(2, Math.min(720, Math.ceil(Math.abs(e.sweep) / Math.max(step, 1e-4))));
      if (!pts.length) { const q = elStart(e); pts.push({ x: q.x, y: q.y, block: e.block }); }
      for (let i = 1; i <= n; i++) {
        const a = e.a0 + e.sweep * (i / n);
        pts.push({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a), block: e.block });
      }
    }
  }
  return pts;
}
