/* =====================================================================
   app.js — ARAYÜZ / USER INTERFACE
   ===================================================================== */
if (typeof document !== 'undefined') {
  (function () {
    const $ = id => document.getElementById(id);
    const STD = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 25, 32, 40, 50, 63];
    let STATE = null, ACTIVE = 0, TESTR = 0, CRIT = [], CORN = [], LASTTEXT = null, DAMAGE = [], INFO = null, FNAME = 'program';
    let WIN = null, LINKS = [], LNKROWS = [], MACH = null, EPSD = 0.001;
    let DRFLOOR = null;                // DR ekseninin alt ucu: dış ofset kapalıysa −R / lower end of the DR axis
    let DETAILS_ON = false;            // "Ayrıntıları göster" durumu / details toggle state
    let LOADED = null;                 // yüklenen dosya adı / loaded file name

    const SAMPLE = `0 BEGIN PGM KOSE-TEST MM
1 BLK FORM 0.1 Z X-60 Y-45 Z-20
2 BLK FORM 0.2 X+60 Y+45 Z+0
3 TOOL CALL 4 Z S4500
4 L Z+100 R0 FMAX
5 L X-80 Y-60 R0 FMAX
6 L Z-12 F400
7 APPR LT X-45 Y-30 LEN12 RL F350
8 L X+45 Y-30
9 L X+45 Y+10
10 RND R6
11 L X+12 Y+10
12 L X+12 Y+30
13 L X-4 Y+30
14 L X-4 Y+10
15 L X-45 Y+10
16 L X-45 Y-30
17 DEP LT LEN12 R0 F800
18 L Z+100 FMAX M2
19 END PGM KOSE-TEST MM`;

    /* ---------- yardımcılar / helpers ---------- */
    function fmt(v, n = 3) { return (Math.round(v * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n).replace(/\.?0+$/, '') || '0'; }
    function fmtSigned(v) { return (v >= 0 ? '+' : '−') + fmt(Math.abs(v), 3); }
    function stdBelow(d) { let b = null; for (const s of STD) if (s <= d + 1e-9) b = s; return b; }
    function stdAbove(d) { for (const s of STD) if (s >= d - 1e-9) return s; return null; }
    function linkName(kind) { return I18N.opt('link.' + kind) || kind; }
    const TW0 = '<div class="tablewrap"><table>', TW1 = '</table></div>';

    /* ---------- çizim / plot ---------- */
    const cv = $('cv'), ctx = cv.getContext('2d');
    let view = { s: 1, ox: 0, oy: 0 }, needFit = true, FOCUS = null;
    function fitView(bbox, w, h) {
      const pad = 26;
      const sw = (bbox.maxx - bbox.minx) || 1, sh = (bbox.maxy - bbox.miny) || 1;
      const s = Math.min((w - 2 * pad) / sw, (h - 2 * pad) / sh);
      return { s, ox: (w - sw * s) / 2 - bbox.minx * s, oy: (h + sh * s) / 2 + bbox.miny * s };
    }
    const T = p => ({ x: p.x * view.s + view.ox, y: -p.y * view.s + view.oy });

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth, h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#fbfcfc'; ctx.fillRect(0, 0, w, h);
      if (!STATE || !STATE.results.length) {
        ctx.fillStyle = '#7d8b94'; ctx.font = '13px "IBM Plex Sans", sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(t('plot.empty'), w / 2, h / 2); return;
      }
      const R = STATE.results[ACTIVE]; if (!R) return;
      if (needFit) { view = fitView(R.bbox, w, h); needFit = false; }

      // ızgara / grid
      const step = niceStep(40 / view.s);
      ctx.strokeStyle = '#e3e8ea'; ctx.lineWidth = 1;
      const b = R.bbox, m = step * 3;
      ctx.beginPath();
      for (let x = Math.floor((b.minx - m) / step) * step; x <= b.maxx + m; x += step) {
        const p = T({ x, y: 0 }); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, h);
      }
      for (let y = Math.floor((b.miny - m) / step) * step; y <= b.maxy + m; y += step) {
        const p = T({ x: 0, y }); ctx.moveTo(0, p.y); ctx.lineTo(w, p.y);
      }
      ctx.stroke();

      // ofset yolu / offset path
      const off = offsetPath(R.els, R.side, TESTR, true, !!($('gouge') && $('gouge').checked));
      const poly = off.path ? pathPolyline(off.path) : [];

      // işlenen kanal alanı = merkez yolunun gerçek takım yarıçapıyla süpürdüğü şerit
      // machined slot area = band swept by the centre path with the actual tool radius
      const Rf = Math.max(0.0005, parseFloat($('rphys').value) || 0.0005);
      if (poly.length > 1 && Rf * view.s > 0.75) {
        ctx.save();
        ctx.strokeStyle = 'rgba(15,125,134,.15)';
        ctx.lineWidth = 2 * Rf * view.s;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        poly.forEach((p, i) => { const q = T(p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
        if (off.closed) ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      if (poly.length > 1) {
        ctx.strokeStyle = off.fails.length ? '#b32319' : '#14507e';
        ctx.lineWidth = 1.6; ctx.setLineDash(off.fails.length ? [5, 3] : []);
        ctx.beginPath();
        poly.forEach((p, i) => { const q = T(p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
        if (off.closed) ctx.closePath();
        ctx.stroke(); ctx.setLineDash([]);
      }

      // kontur / contour
      ctx.strokeStyle = '#0d1418'; ctx.lineWidth = 2.2;
      ctx.beginPath();
      R.pts.forEach((p, i) => { const q = T(p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
      ctx.stroke();

      // yön oku (başlangıç) / start marker
      const p0 = T(R.pts[0]);
      ctx.fillStyle = '#0d1418'; ctx.beginPath(); ctx.arc(p0.x, p0.y, 3.5, 0, TAU); ctx.fill();

      // takım çemberi: odaklanan yerde, yoksa en kritik noktada
      // tool circle: at the focus, otherwise at the most critical point
      const focus = FOCUS ? FOCUS.p : ((R.crit && R.crit.length) ? R.crit[0].p : null);
      if (focus && Math.abs(TESTR) > 1e-9) {
        const q = T(focus);
        ctx.strokeStyle = TESTR < 0 ? '#14507e' : '#0f7d86'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(q.x, q.y, Math.abs(TESTR) * view.s, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
      if (FOCUS) {
        const q = T(FOCUS.p);
        ctx.strokeStyle = '#b57405'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(q.x - 14, q.y); ctx.lineTo(q.x - 9, q.y);
        ctx.moveTo(q.x + 9, q.y); ctx.lineTo(q.x + 14, q.y);
        ctx.moveTo(q.x, q.y - 14); ctx.lineTo(q.x, q.y - 9);
        ctx.moveTo(q.x, q.y + 9); ctx.lineTo(q.x, q.y + 14); ctx.stroke();
        if (FOCUS.block !== undefined && FOCUS.block !== null) {
          ctx.fillStyle = '#b57405'; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
          ctx.fillText(t('plot.block', { block: FOCUS.block }), q.x + 16, q.y - 8);
        }
      }

      // hata işaretleri / failure markers
      if (off.fails.length) {
        const shown = new Set();
        for (const f of off.fails.slice(0, 60)) {
          const k = f.block + '|' + Math.round(f.p.x * 4) + ',' + Math.round(f.p.y * 4); if (shown.has(k)) continue; shown.add(k);
          const q = T(f.p);
          ctx.fillStyle = 'rgba(179,35,25,.9)';
          ctx.beginPath(); ctx.arc(q.x, q.y, 4.5, 0, TAU); ctx.fill();
          if (shown.size <= 8 && f.block !== undefined && f.block !== null) {
            ctx.fillStyle = '#b32319'; ctx.font = '11px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
            ctx.fillText(String(f.block), q.x + 7, q.y - 6);
          }
        }
      }
      // dalış / bağlantı hareketleri: takımın gerçekte süpürdüğü kapsül
      // plunge / link moves: the capsule the tool actually sweeps
      for (const l of LINKS) {
        if (idleLink(l)) continue;
        const loss = lossOf(l), harm = l.overRef;
        const A2 = T(l.a), B2 = T(l.b), rr = Rf * view.s;
        if (rr < 0.4) continue;
        const bad = harm > EPSD, warnv = loss > EPSD;
        ctx.save();
        ctx.strokeStyle = bad ? 'rgba(179,35,25,.28)' : (warnv ? 'rgba(181,116,5,.26)' : 'rgba(122,63,168,.22)');
        ctx.lineWidth = 2 * rr; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(A2.x, A2.y); ctx.lineTo(B2.x, B2.y); ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = bad ? '#b32319' : (warnv ? '#b57405' : '#7a3fa8');
        ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]);
        ctx.beginPath(); ctx.arc(A2.x, A2.y, rr, 0, TAU); ctx.stroke();
        if (Math.hypot(B2.x - A2.x, B2.y - A2.y) > 1) { ctx.beginPath(); ctx.arc(B2.x, B2.y, rr, 0, TAU); ctx.stroke(); }
        ctx.setLineDash([]);
        if ((warnv || bad) && l.at) {
          const wp = T(l.at);
          ctx.fillStyle = bad ? '#b32319' : '#b57405';
          ctx.beginPath(); ctx.arc(wp.x, wp.y, 3, 0, TAU); ctx.fill();
          if (rr > 12) {
            ctx.font = '600 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
            ctx.fillText(fmt(bad ? harm : loss, 4), wp.x + 5, wp.y - 4);
          }
        }
      }

      // parça bozulmaları / part damage
      for (const d of DAMAGE) {
        if (d.ci !== ACTIVE || !d.p) continue;
        const q = T(d.p);
        ctx.strokeStyle = '#b57405'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(q.x - 5, q.y - 5); ctx.lineTo(q.x + 5, q.y + 5);
        ctx.moveTo(q.x + 5, q.y - 5); ctx.lineTo(q.x - 5, q.y + 5); ctx.stroke();
      }

      // ölçek / scale
      ctx.fillStyle = '#7d8b94'; ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left'; ctx.fillText(t('plot.grid', { step: fmt(step) }), 10, h - 10);
    }
    function niceStep(target) {
      const p = Math.pow(10, Math.floor(Math.log10(Math.max(target, 1e-6))));
      const c = [1, 2, 5, 10]; for (const k of c) if (p * k >= target) return p * k; return p * 10;
    }
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resizeTimer = null; needFit = true; draw(); }, 120);
    });

    function focusOn(p, r) {
      const w = cv.clientWidth, h = cv.clientHeight;
      view.s = Math.min(w, h) / Math.max(r * 9, 1);
      view.ox = w / 2 - p.x * view.s; view.oy = h / 2 + p.y * view.s;
      needFit = false; draw();
    }

    /* ---------- gezinme: tekerlek, sürükleme, iki parmakla yakınlaştırma ----------
       navigation: wheel, drag, two-finger pinch */
    const canvasPt = e => { const rc = cv.getBoundingClientRect(); return { x: e.clientX - rc.left, y: e.clientY - rc.top }; };
    const PTRS = new Map();
    let dragFrom = null, pinch = null;
    const ptrList = () => [...PTRS.values()];

    cv.addEventListener('wheel', e => {
      if (!STATE) return;
      e.preventDefault();
      const p = canvasPt(e);
      const k = Math.exp(-e.deltaY * 0.0015);
      view.ox = p.x + (view.ox - p.x) * k; view.oy = p.y + (view.oy - p.y) * k; view.s *= k;
      needFit = false; draw();
    }, { passive: false });

    cv.addEventListener('pointerdown', e => {
      if (!STATE) return;
      PTRS.set(e.pointerId, canvasPt(e));
      if (cv.setPointerCapture) { try { cv.setPointerCapture(e.pointerId); } catch (_) { /* yakalanamadı */ } }
      if (PTRS.size >= 2) {
        const l = ptrList(), a = l[0], b = l[1];
        pinch = {
          d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
          ox: view.ox, oy: view.oy, s: view.s
        };
        dragFrom = null;
      } else {
        const p = canvasPt(e);
        dragFrom = { x: p.x, y: p.y, ox: view.ox, oy: view.oy };
        cv.style.cursor = 'grabbing';
      }
    });

    cv.addEventListener('pointermove', e => {
      if (!STATE) return;
      if (PTRS.has(e.pointerId)) PTRS.set(e.pointerId, canvasPt(e));
      if (PTRS.size >= 2 && pinch) {
        const l = ptrList(), a = l[0], b = l[1];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const k = d / pinch.d;
        view.s = pinch.s * k;
        view.ox = mx - (pinch.mx - pinch.ox) * k;
        view.oy = my - (pinch.my - pinch.oy) * k;
        needFit = false; draw();
        return;
      }
      if (!dragFrom) return;
      const p = canvasPt(e);
      view.ox = dragFrom.ox + (p.x - dragFrom.x); view.oy = dragFrom.oy + (p.y - dragFrom.y);
      needFit = false; draw();
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, e => {
      PTRS.delete(e.pointerId);
      if (PTRS.size < 2) pinch = null;
      if (!PTRS.size) { dragFrom = null; cv.style.cursor = 'grab'; }
      else { const p = ptrList()[0]; dragFrom = { x: p.x, y: p.y, ox: view.ox, oy: view.oy }; }
    }));
    cv.style.cursor = 'grab';
    $('fit').onclick = () => { FOCUS = null; needFit = true; draw(); };

    /* ---------- programa uyarı işleme / annotate the program ---------- */
    function ascii(s) {
      const m = {
        'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U',
        'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C', '−': '-'
      };
      return String(s).replace(/[ıİşŞğĞüÜöÖçÇ−]/g, ch => m[ch] || ch);
    }
    function num(v, n) { return (v < 0 ? '-' : '') + Math.abs(v).toFixed(n); }

    function buildAnnotated() {
      const text = $('src').value;
      if (!text.trim() || !STATE || !INFO) return null;
      const notes = new Map();
      const put = (b, msg) => {
        if (b === null || b === undefined) return;
        if (!notes.has(b)) notes.set(b, []);
        const a = notes.get(b); if (a.length < 2 && a.indexOf(msg) < 0) a.push(msg);
      };

      if (INFO.toolBlock !== null) {
        put(INFO.toolBlock, INFO.finite
          ? t('an.range', { a: num(INFO.drMin, 3), b: num(INFO.drMax, 3) })
          : t('an.rangeOpen', { a: num(INFO.drMin, 3) }));
        if (INFO.drForm !== null && INFO.drForm !== undefined)
          put(INFO.toolBlock, t('an.form', { v: num(INFO.drForm, 3) }));
        if (INFO.outRoom > 1e-9)
          put(INFO.toolBlock, t('an.outFloor', { v: num(INFO.drFloor, 3), mm: (2 * INFO.outRoom).toFixed(3) }));
      }
      // dalış / bağlantı hareketleri / plunge and link moves
      (LNKROWS || []).slice(0, 20).forEach(r => {
        if (r.idle) return;
        if (r.harm > EPSD)
          put(r.l.block, t('an.harm', { mm: r.harm.toFixed(4) }));
        else if (r.limit !== null)
          put(r.l.block, t('an.lossLimit', { v: num(r.limit, 3) }) +
            (r.loss > EPSD ? t('an.lossNow', { mm: r.loss.toFixed(4) }) : ''));
      });
      // sınırı belirleyen kütükler / blocks that set the limit
      let cnt = 0;
      STATE.results.forEach(R => {
        if (R.unlimited) return;
        R.crit.slice(0, 6).forEach(c => {
          if (cnt++ > 40) return;
          put(c.block, c.kind === 'arcflip'
            ? t('an.arcflip', { v: num(R.rmax, 3) })
            : t('an.swallow', { v: num(INFO.drMax, 3) }));
        });
      });
      // seçilen DR'deki bozulmalar / damage at the selected DR
      let dn = 0;
      DAMAGE.slice(0, 12).forEach(d => {
        const msg = d.kind === 'gouge'
          ? t('an.gouge', { v: num(INFO.drCur, 3), mm: d.depth.toFixed(3) })
          : t('an.arc', { v: num(INFO.drCur, 3) });
        if (d.kind === 'throat') return;
        if (d.kind === 'appr' || d.kind === 'dep') {
          put(d.block, t('an.apprShort', { mm: d.depth.toFixed(3) }));
          return;
        }
        if (d.kind === 'onIn' || d.kind === 'onOut') {
          put(d.block, t('an.compIn', {
            what: t(d.kind === 'onIn' ? 'an.compIn.on' : 'an.compIn.off'),
            dz: d.dz.toFixed(3), mm: d.depth.toFixed(3)
          }));
          return;
        }
        (d.blocks || [d.block]).forEach(b => { if (dn++ < 300) put(b, msg); });
      });
      if (!notes.size) return null;

      const crlf = text.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
      const out = text.split(/\r?\n/).map(line => {
        const m = line.match(/^\s*(\d+)\s/);
        if (!m) return line;
        const ns = notes.get(parseInt(m[1], 10));
        if (!ns) return line;
        const msg = ascii('!! ' + ns.join(' / '));
        const base = line.replace(/\s+$/, '');
        return base.indexOf(';') >= 0 ? base + ' / ' + msg : base + ' ; ' + msg;
      }).join(crlf);
      return { text: out, count: notes.size };
    }

    if ($('dl')) $('dl').onclick = () => {
      const r = buildAnnotated();
      if (!r) { setVerdict('warn', 'dl.nothing.tag', 'dl.nothing.txt'); return; }
      try {
        const blob = new Blob([r.text], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = FNAME.replace(/\.[^.]+$/, '') + t('dl.suffix');
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      } catch (e) { setVerdictRaw('bad', t('dl.fail.tag'), e.message); }
    };

    function syncDetails() {
      const els = document.querySelectorAll('.det');
      for (let i = 0; i < els.length; i++) els[i].style.display = DETAILS_ON ? '' : 'none';
      $('toggleDet').textContent = t(DETAILS_ON ? 'btn.detailsHide' : 'btn.detailsShow');
    }
    if ($('toggleDet')) $('toggleDet').onclick = () => { DETAILS_ON = !DETAILS_ON; syncDetails(); };

    /* ---------- analiz / analysis ---------- */
    function run() {
      const text = $('src').value;
      if (!text.trim()) { setVerdict('warn', 'vd.empty.tag', 'vd.empty.txt'); return; }
      const opt = {
        tol: Math.max(0.0005, parseFloat($('tol').value) || 0.002),
        gouge: !!($('gouge') && $('gouge').checked)
      };
      let A;
      try { A = analyseProgram(text, opt); }
      catch (err) { setVerdict('bad', 'vd.error.tag', 'vd.error.txt', { msg: err.message }); return; }
      STATE = A; ACTIVE = 0; FOCUS = null; needFit = true;

      // TOOL CALL'daki DR'yi bir kez otomatik al / pick up the DR from TOOL CALL once
      if (text !== LASTTEXT) {
        LASTTEXT = text;
        if (A.toolCall && A.toolCall.dr !== null && A.toolCall.dr !== undefined) {
          $('drcur').value = String(A.toolCall.dr);
          $('drref').value = String(A.toolCall.dr);      // nominal form = CAM'in çıkardığı hâl / as CAM posted it
        }
        $('rphys').value = $('rtab').value;              // aksi söylenene kadar takım tam ölçüsünde / assume nominal tool
      }

      const safety = Math.max(0, parseFloat($('safety').value) || 0);
      const Rt = Math.max(0, parseFloat($('rtab').value) || 0);
      const drCur = parseFloat($('drcur').value);
      const hasDr = isFinite(drCur);
      const Rf = Math.max(0.0005, parseFloat($('rphys').value) || Rt || 0.0005);
      const drRefIn = parseFloat($('drref').value);
      const drRef = isFinite(drRefIn) ? drRefIn : -Rt;

      const finite = isFinite(A.rmax);
      const rLim = finite ? A.rmax : Infinity;
      const rSafe = finite ? Math.max(0, rLim - safety) : Infinity;
      const drMin = -Rt;
      const drMax = finite ? rSafe - Rt : Infinity;

      // ---- dış ofset: DR ekseninin −R altına açılan bölümü / outward offset zone
      const outAllow = !!($('outAllow') && $('outAllow').checked);
      const outCap = Math.max(0, parseFloat($('outcap').value) || 0);
      const outFin = isFinite(A.routMax);
      const outGeo = outFin ? Math.max(0, A.routMax - safety) : Infinity;
      const outRoom = outAllow ? Math.max(0, Math.min(outCap, outGeo)) : 0;
      const outCapped = outAllow && outFin && outGeo < outCap - 1e-9;   // sınırı geometri koyuyor / geometry sets it
      const drFloor = drMin - outRoom;
      DRFLOOR = drFloor;
      /* Dış ofset kapalıyken kumanda −R altını hiç işlemez; o durumda ölçüyü ve
         çizimi nominale kenetle ki olmayacak bir yol gösterilmesin.
         With the outward offset off the control never runs below −R; clamp the
         measurement and the drawing to nominal so no impossible path is shown. */
      const rEffOf = d => outAllow ? Rt + d : Math.max(0, Rt + d);

      // ---- DR taraması: dalış / bağlantı hareketleri / DR sweep over plunge and link moves
      WIN = null; LINKS = [];
      if (A.results.length && A.links.length) {
        try {
          WIN = damageWindow(A, {
            rtab: Rt, rphys: Rf, drRef, eps: EPSD, outRoom,
            steps: 16, span: Math.max(1, Rt * 4)
          });
          if (hasDr) {
            const idxCur = machinedIndex(A.results, rEffOf(drCur), WIN.rois);
            MACH = idxCur;
            LINKS = linkProbe(A, idxCur, WIN.idxRef, Rf, WIN.cap);
          }
        } catch (e) { WIN = null; A.warnings.push({ k: 'warn.linkFail', p: { msg: e.message } }); }
      }
      const drForm = WIN ? WIN.lossTop : null;
      const outNow = hasDr && drCur < drMin - 1e-9;      // şu an dış ofsetteyiz / we are in the outward zone

      // ---- göstergeler / readouts
      $('kMin').textContent = t(outRoom > 0 ? 'dro.minOut' : 'dro.min');
      $('vMin').innerHTML = A.results.length ? fmtSigned(drFloor) : t('common.dash');
      $('vMin').className = 'v' + (A.results.length ? (outRoom > 0 ? ' warn' : ' ok') : '');
      $('sMin').textContent = !A.results.length ? t('dro.noContour')
        : outRoom > 0
          ? t('dro.minOutSub', { out: fmt(outRoom, 3), ch: fmt(2 * outRoom, 3) }) +
          t(outCapped ? 'dro.minOutGeo' : 'dro.minOutMach')
          : t('dro.minNomSub');
      $('cellMin').className = 'cell' + ((outNow && drCur < drFloor - 1e-9) ? ' warnbg' : '');

      if (!A.results.length) {
        $('vMax').innerHTML = t('common.dash'); $('vMax').className = 'v'; $('sMax').textContent = t('dro.noRLRR');
      } else if (!finite) {
        $('vMax').innerHTML = t('dro.maxFree'); $('vMax').className = 'v ok';
        $('sMax').textContent = t('dro.maxFreeSub');
      } else if (drMax < drMin) {
        $('vMax').innerHTML = fmtSigned(drMax); $('vMax').className = 'v bad';
        $('sMax').textContent = t('dro.maxTooTight', { r: fmt(rSafe, 3) });
      } else {
        $('vMax').innerHTML = fmtSigned(drMax); $('vMax').className = 'v warn';
        $('sMax').textContent = t('dro.maxSub', { r: fmt(rSafe, 3), s: fmt(safety, 3) });
      }
      $('cellMax').className = 'cell' + ((finite && hasDr && drCur > drMax) ? ' warnbg' : '');

      if (!A.results.length || !WIN || !WIN.evaluated) {
        $('vForm').innerHTML = t('common.dash'); $('vForm').className = 'v';
        $('sForm').textContent = !A.results.length ? t('dro.noRLRR')
          : (WIN && LINKS.length ? t('dro.formOutside') : t('dro.formNoLinks'));
      } else if (drForm === null) {
        $('vForm').innerHTML = finite ? fmtSigned(drMax) : t('dro.formNoLimit'); $('vForm').className = 'v ok';
        $('sForm').textContent = I18N.plural('dro.formOkSub', WIN.evaluated);
      } else if (drForm <= drMin + 2 * EPSD) {
        $('vForm').innerHTML = t('dro.formNone'); $('vForm').className = 'v bad';
        $('sForm').textContent = t('dro.formTightSub');
      } else {
        $('vForm').innerHTML = fmtSigned(drForm); $('vForm').className = 'v warn';
        $('sForm').textContent = t('dro.formSub');
      }
      $('cellForm').className = 'cell' + ((drForm !== null && hasDr && drCur > drForm + 1e-9) ? ' warnbg' : '');

      // ---- karar / verdict
      const devOf = d => (d - drRef) + (Rt - Rf);          // duvar sapması, + = kanal daralır / wall deviation
      const harmAny = WIN && WIN.harmTop !== null;
      if (!A.results.length) {
        setVerdict('warn', 'vd.noContour.tag', 'vd.noContour.txt');
      } else if (finite && drMax < drMin) {
        setVerdict('bad', 'vd.noRange.tag', 'vd.noRange.txt', { r: fmt(rSafe, 3), drMin: fmtSigned(drMin) });
      } else if (hasDr && drCur < drFloor - 1e-9 && !outAllow) {
        setVerdict('bad', 'vd.drNeg.tag', 'vd.drNeg.txt', { dr: fmtSigned(drCur), drMin: fmtSigned(drMin) });
      } else if (hasDr && drCur < drFloor - 1e-9) {
        setVerdict('bad', 'vd.outMuch.tag', 'vd.outMuch.txt', {
          dr: fmtSigned(drCur), out: fmt(-(Rt + drCur), 3), floor: fmtSigned(drFloor),
          room: fmt(outRoom, 3), why: t(outCapped ? 'vd.outMuch.geo' : 'vd.outMuch.mach')
        });
      } else if (finite && hasDr && drCur > drMax) {
        setVerdict('bad', 'vd.drMuch.tag', 'vd.drMuch.txt', {
          dr: fmtSigned(drCur), floor: fmtSigned(drFloor), drMax: fmtSigned(drMax)
        });
      } else if (outNow) {
        const d = devOf(drCur);
        const wh = WIN ? worstHarm() : null;
        setVerdict('warn', 'vd.outZone.tag', 'vd.outZone.txt', {
          dr: fmtSigned(drCur), out: fmt(-(Rt + drCur), 3), dev: fmtSigned(d), ch: fmtSigned(-2 * d),
          note: t(d < -1e-9 ? 'vd.outZone.cutting' : 'vd.outZone.safe'), floor: fmtSigned(drFloor),
          harm: wh ? t('vd.outZone.harm', { kind: linkName(wh.kind), block: wh.block, mm: fmt(wh.harm, 4) }) : ''
        });
      } else if (WIN && worstHarm()) {
        const wh = worstHarm();
        setVerdict('bad', 'vd.harm.tag', 'vd.harm.txt', {
          dr: fmtSigned(drCur), kind: linkName(wh.kind), block: wh.block, mm: fmt(wh.harm, 4),
          top: (harmAny && WIN.harmTop > drMin + EPSD) ? t('vd.harm.top', { v: fmtSigned(WIN.harmTop) }) : ''
        });
      } else if (drForm !== null && drForm <= drMin + 2 * EPSD) {
        const n = tangentCount(drMin);
        const dialed = hasDr && drCur > drMin + EPSD;
        const wl = dialed ? worstLoss() : null;
        const tail = I18N.plural('vd.tight.tail', n, { dia: fmt(2 * Rf, 3) });
        if (dialed) {
          setVerdict('warn', 'vd.tightDialed.tag', 'vd.tightDialed.txt', {
            dr: fmtSigned(drCur), dev: fmt(Math.abs(devOf(drCur)), 4), tail,
            worst: wl ? t('vd.tightDialed.worst', { block: wl.block, mm: fmt(wl.loss, 4) }) : ''
          });
        } else {
          setVerdict('ok', 'vd.tightNominal.tag', 'vd.tightNominal.txt', { drMax: fmtSigned(drMax), tail });
        }
      } else if (drForm !== null && hasDr && drCur > drForm + 1e-9) {
        const wl = LINKS.length ? worstLoss() : null;
        setVerdict('warn', 'vd.lossy.tag', 'vd.lossy.txt', {
          dr: fmtSigned(drCur), dev: fmt(Math.abs(devOf(drCur)), 4),
          lost: wl ? fmt(wl.loss, 4) + ' mm' : t('vd.lossy.some'),
          where: wl ? t('vd.lossy.whereBlock', { block: wl.block }) : t('vd.lossy.whereGeneric'),
          form: fmtSigned(drForm)
        });
      } else if (!finite) {
        setVerdict('ok', 'vd.free.tag', 'vd.free.txt', { drMin: fmtSigned(drMin) });
      } else {
        const eff = drForm !== null ? Math.min(drMax, drForm) : drMax;
        setVerdict('ok', 'vd.fine.tag', 'vd.fine.txt', {
          drMin: fmtSigned(drMin), eff: fmtSigned(eff),
          room: fmt(eff - drMin, 4), ch: fmt(2 * (eff - drMin), 4),
          cur: hasDr ? t('vd.fine.cur', { dr: fmtSigned(drCur) }) : '',
          out: outRoom > 0 ? t('vd.fine.out', { floor: fmtSigned(drFloor), ch: fmt(2 * outRoom, 3) }) : ''
        });
      }
      // ---- seçilen DR'de parça bozulmaları / part damage at the selected DR
      DAMAGE = [];
      if (A.results.length && hasDr) {
        const rEff = rEffOf(drCur);              // eksi = dış ofset / negative = outward offset
        A.results.forEach((R, ri) => {
          const d = damageAt(R.els, R.side, rEff, opt.gouge);
          d.gouges.forEach(g => DAMAGE.push({ ci: ri, con: R.index, kind: 'gouge', ...g }));
          d.arcs.forEach(g => DAMAGE.push({ ci: ri, con: R.index, kind: 'arc', depth: Infinity, ...g }));
          if (opt.gouge) d.throats.forEach(g => DAMAGE.push({ ci: ri, con: R.index, kind: 'throat', depth: NaN, ...g }));
        });
        // aynı XY noktası her Z seviyesinde tekrar eder -> konuma göre grupla
        // the same XY point repeats at every Z level -> group by position
        const grp = new Map();
        for (const d of DAMAGE) {
          const k = d.kind + '|' + Math.round(d.p.x * 100) + '|' + Math.round(d.p.y * 100);
          const g = grp.get(k);
          if (!g) grp.set(k, { ...d, n: 1, blocks: [d.block] });
          else {
            g.n++; if (g.blocks.length < 60) g.blocks.push(d.block);
            if ((d.depth || 0) > (g.depth || 0)) g.depth = d.depth;
          }
        }
        DAMAGE = [...grp.values()].sort((a, b) => (b.depth || 0) - (a.depth || 0));
        // Yaklaşma / uzaklaşma bloğu için kaba kontrol. Dalış analizi çalıştıysa
        // aynı soruyu gerçek geometriyle o cevaplıyor; burayı tekrar sayma.
        // Rough check for the approach / departure block. If the plunge analysis ran,
        // it answers the same question with real geometry — do not count it twice.
        if (!WIN) A.results.forEach((R, ri) => {
          const chk = (l, blk, kind) => {
            if (l === undefined || blk === undefined || blk === null) return;
            if (l >= rEff - 1e-9 || rEff <= 1e-9) return;
            DAMAGE.push({
              ci: ri, con: R.index, kind, block: blk, depth: rEff - l, n: 1, blocks: [blk],
              p: R.pts[kind === 'appr' ? 0 : R.pts.length - 1]
            });
          };
          chk(R.apprLen, R.startBlock, 'appr');
          chk(R.depLen, R.depBlock, 'dep');
          // düzeltme, takım kütüğün içindeyken devreye giriyor/çıkıyorsa yanal süpürme talaştır
          // if compensation switches while the tool is inside the blank, the sideways sweep is a cut
          const top = (A.stock && isFinite(A.stock.z2)) ? A.stock.z2 : null;
          if (top !== null && Math.abs(rEff) > 1e-9) {
            const sweep = (from, to, dir, blk, z, kind) => {
              if (!from || !to || z === undefined || z >= top - 1e-9) return;
              const nv = mul(perp(dir), R.side);
              const lat = Math.abs(dot(sub(add(to, mul(nv, rEff)), from), nv));
              if (lat <= 1e-6) return;
              DAMAGE.push({
                ci: ri, con: R.index, kind, block: blk, depth: lat, dz: top - z,
                n: 1, blocks: [blk], p: { ...to }
              });
            };
            sweep(R.apprFrom, R.apprTo, elStartDir(R.els[0]), R.startBlock, R.apprZ, 'onIn');
            const last = R.els[R.els.length - 1];
            sweep(R.depFrom, elEnd(last), elEndDir(last), R.depBlock, R.depZ, 'onOut');
          }
        });
      }
      {
        const rich = new Set(DAMAGE.filter(d => d.kind === 'onIn' || d.kind === 'onOut').map(d => d.block));
        DAMAGE = DAMAGE.filter(d => !((d.kind === 'appr' || d.kind === 'dep') && rich.has(d.block)));
        DAMAGE.sort((a, b) => (b.depth || 0) - (a.depth || 0));
      }
      renderDamage(hasDr ? drCur : null);
      if (DAMAGE.length) {
        const worst = DAMAGE[0];
        const txt = worst.kind === 'arc' ? t('vd.damageArc') : t('vd.damageGouge', { mm: fmt(worst.depth, 4) });
        $('verdict').innerHTML += `<br><span style="color:var(--red)">${I18N.plural('vd.damageLine', DAMAGE.length, { txt })}</span>`;
      }

      // ---- kontur seçici / contour picker
      const chips = $('conChips'); chips.innerHTML = '';
      A.results.forEach((r, i) => {
        const el = document.createElement('button');
        el.className = 'chip' + (i === 0 ? ' on' : '');
        el.textContent = t('plot.chip', {
          i: r.index, side: r.sideName, lim: r.unlimited ? '∞' : 'Ø' + fmt(r.rmax * 2, 2)
        });
        el.onclick = () => {
          ACTIVE = i; FOCUS = null; needFit = true;
          [...chips.children].forEach(c => c.classList.remove('on'));
          el.classList.add('on'); setupSlider(); draw();
        };
        chips.appendChild(el);
      });

      INFO = {
        drMin, drMax, drCur: hasDr ? drCur : null, Rt, Rf, drRef, finite, drForm,
        drFloor, outRoom, outCapped, outNow,
        harmTop: WIN ? WIN.harmTop : null, dev: hasDr ? devOf(drCur) : null,
        toolBlock: A.toolCall ? A.toolCall.block : null
      };
      renderWindow(drMin, drMax, drForm, hasDr ? drCur : null, devOf, finite, drFloor, outCapped);
      renderLinks(hasDr ? drCur : null);
      renderCrit(A, rSafe);
      renderCorners(A);
      renderContours(A, safety);
      renderWarnings(A);
      setupSlider();
      draw();
    }

    function setupSlider() {
      const R = STATE && STATE.results[ACTIVE];
      const rng = $('rng');
      if (!R) { rng.disabled = true; $('rngVal').textContent = t('common.dash'); return; }
      rng.disabled = false;
      const Rt = Math.max(0, parseFloat($('rtab').value) || 0);
      const top = R.unlimited ? Math.max(Rt * 2, 0.5) : Math.max(R.rmax * 1.6, Rt * 0.2 + 0.01);
      rng.min = Math.round((DRFLOOR === null ? -Rt : Math.min(DRFLOOR, -Rt)) * 1000);
      rng.max = Math.round((top - Rt) * 1000);
      const drCur = parseFloat($('drcur').value);
      rng.value = Math.max(rng.min, Math.min(rng.max, Math.round((isFinite(drCur) ? drCur : -Rt) * 1000)));
      applySlider();
    }
    let probeTimer = null;
    function applySlider() {
      const Rt = Math.max(0, parseFloat($('rtab').value) || 0);
      const dr = parseInt($('rng').value, 10) / 1000;
      TESTR = Rt + dr;                       // eksi = dış ofset / negative = outward offset
      $('rngVal').textContent = t('plot.val', { dr: fmtSigned(dr) });
      const R = STATE && STATE.results[ACTIVE];
      if (R) $('rngVal').style.color =
        ((!R.unlimited && TESTR > R.rmax) || (!R.outUnlimited && -TESTR > R.routMax)) ? '#b32319'
          : (TESTR < 0 ? '#14507e' : '#0d1418');
      draw();
      // kaydırıcı durunca dalış hareketlerini o DR'de yeniden ölç
      // when the slider settles, re-measure the plunge moves at that DR
      if (WIN && STATE) {
        if (probeTimer) clearTimeout(probeTimer);
        probeTimer = setTimeout(() => {
          probeTimer = null;
          try {
            const Rf = Math.max(0.0005, parseFloat($('rphys').value) || 0.0005);
            const idxCur = machinedIndex(STATE.results, TESTR, WIN.rois);
            MACH = idxCur;
            LINKS = linkProbe(STATE, idxCur, WIN.idxRef, Rf, WIN.cap);
            renderLinks(dr);
            draw();
          } catch (e) { /* çizim bozulmasın / keep the drawing alive */ }
        }, 140);
      }
    }
    $('rng').addEventListener('input', applySlider);

    function setVerdictRaw(cls, tag, txt) {
      const v = $('verdict'); v.className = 'verdict ' + cls;
      v.innerHTML = `<span class="tag">${tag}</span><span>${txt}</span>`;
    }
    function setVerdict(cls, tagKey, txtKey, params) {
      setVerdictRaw(cls, t(tagKey), t(txtKey, params));
    }

    function renderCrit(A, rSafe) {
      const box = $('critBox');
      const rows = [];
      CRIT = [];
      A.results.forEach((r, ri) => {
        if (r.unlimited) return;
        const seen = new Set(), blocks = new Set();
        r.crit.forEach(c => {
          const k = c.block + '/' + c.kind; if (seen.has(k)) return; seen.add(k); blocks.add(c.block);
          rows.push({ con: r.index, ci: ri, p: c.p, block: c.block, kind: c.kind, rmax: r.rmax });
        });
        r.concaveArcs.slice(0, 3).forEach(a => {
          if (blocks.has(a.block)) return;
          const e = r.els.find(x => x.block === a.block);
          rows.push({ con: r.index, ci: ri, p: e ? elMid(e) : null, block: a.block, kind: 'arc', val: a.r, rmax: a.r });
        });
      });
      if (!rows.length) { box.innerHTML = `<p class="empty">${t('crit.none')}</p>`; return; }
      rows.sort((a, b) => a.rmax - b.rmax);
      let html = TW0 + `<thead><tr><th>${t('crit.th.contour')}</th><th>${t('crit.th.block')}</th>` +
        `<th>${t('crit.th.what')}</th><th class="num">${t('crit.th.limit')}</th>` +
        `<th>${t('crit.th.sev')}</th></tr></thead><tbody>`;
      rows.slice(0, 14).forEach(r => {
        const sev = r.rmax <= rSafe ? 'hi' : (r.rmax <= rSafe * 1.3 ? 'md' : 'lo');
        const idx = CRIT.push(r) - 1;
        html += `<tr data-i="${idx}" class="crow"><td>${r.con}</td><td><span class="blk">${r.block ?? '—'}</span></td>` +
          `<td>${I18N.opt('crit.' + r.kind) || r.kind}${r.val !== undefined ? ` · R${fmt(r.val, 2)}` : ''}</td>` +
          `<td class="num">${fmt(r.rmax * 2, 2)}</td>` +
          `<td><span class="sev ${sev}">${t('crit.sev.' + sev)}</span></td></tr>`;
      });
      html += '</tbody>' + TW1;
      box.innerHTML = html;
      box.querySelectorAll('tr[data-i]').forEach(tr => {
        tr.onclick = () => {
          const r = CRIT[parseInt(tr.getAttribute('data-i'), 10)];
          if (!r || !r.p) return;
          if (r.ci !== ACTIVE) {
            ACTIVE = r.ci;
            const ch = $('conChips').children;
            for (let i = 0; i < ch.length; i++) ch[i].classList[i === ACTIVE ? 'add' : 'remove']('on');
            setupSlider();
          }
          FOCUS = { p: r.p, block: r.block };
          focusOn(r.p, Math.max(r.rmax, 1));
        };
      });
    }

    /* ---------- DR penceresi / DR window ---------- */
    function lossOf(l) {
      if (!WIN) return 0;
      const b = WIN.base.has(l.key) ? WIN.base.get(l.key) : 0;
      return Math.max(0, l.over - b);
    }
    function idleLink(l) {
      if (!WIN) return false;
      const b = WIN.base.has(l.key) ? WIN.base.get(l.key) : 0;
      return b > WIN.rphys * 0.6;
    }
    function worstLoss() {
      let w = null;
      for (const l of LINKS) {
        if (idleLink(l)) continue;
        const lo = lossOf(l);
        if (!w || lo > w.loss) w = { loss: lo, block: l.block, kind: l.kind, link: l };
      }
      return (w && w.loss > EPSD) ? w : null;
    }
    function worstHarm() {
      let w = null;
      for (const l of LINKS) {
        if (idleLink(l)) continue;
        if (!w || l.overRef > w.harm) w = { harm: l.overRef, block: l.block, kind: l.kind, link: l };
      }
      return (w && w.harm > EPSD) ? w : null;
    }
    /* nominal duvara teğet duran, yani DR ne olursa olsun payı kaçıran nokta sayısı
       how many points sit tangent to the nominal wall, i.e. lose the stock at any DR */
    function tangentCount(drMin) {
      if (!WIN) return 0;
      return WIN.links.filter(v => v.lossLimit !== null && v.lossLimit <= drMin + 2 * EPSD).length;
    }

    function renderWindow(drMin, drMax, drForm, drCur, devOf, finite, drFloor, outCapped) {
      const band = $('band'), axis = $('bandAxis'), txt = $('winTxt');
      band.innerHTML = ''; axis.innerHTML = '';
      if (drFloor === undefined || drFloor === null) drFloor = drMin;
      const outRoom = Math.max(0, drMin - drFloor);
      if ($('keyOut')) $('keyOut').style.display = outRoom > 1e-9 ? '' : 'none';
      if (!STATE || !STATE.results.length) {
        $('winNote').textContent = '';
        txt.innerHTML = `<p class="empty" style="padding:0">${t('window.placeholder')}</p>`;
        return;
      }
      const ctl = finite ? drMax : (WIN ? WIN.top : drMin + 0.5);
      const lo = drFloor;
      const hi = Math.max(ctl + Math.max(0.02, (ctl - lo) * 0.18), (drCur !== null ? drCur : ctl) + 0.01, lo + 0.02);
      const pct = v => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
      const green = drForm === null ? ctl : Math.max(drMin, Math.min(drForm, ctl));

      const seg = (cls, a, b) => {
        const w = pct(b) - pct(a); if (w <= 0.01) return;
        const d = document.createElement('div');
        d.className = 'seg ' + cls; d.style.width = w + '%';
        band.appendChild(d);
      };
      seg('o', lo, drMin);
      seg('g', drMin, green);
      seg('a', green, ctl);
      if (finite) seg('r', ctl, hi);

      if (drCur !== null) {
        const m = document.createElement('div');
        m.className = 'mark'; m.style.left = pct(drCur) + '%';
        band.appendChild(m);
      }
      const tick = (v, lab) => {
        const s = document.createElement('span');
        s.style.left = pct(v) + '%';
        s.innerHTML = `<b>${fmtSigned(v)}</b>${lab}`;
        axis.appendChild(s);
      };
      const tight = drForm !== null && drForm <= drMin + 2 * EPSD;
      if (outRoom > 1e-9) tick(lo, t('window.tickOut'));
      tick(drMin, t(outRoom > 1e-9 ? 'window.tickNominal' : 'window.tickNoRoom'));
      if (drForm !== null && !tight && drForm < ctl - (hi - lo) * 0.04) tick(drForm, t('window.tickForm'));
      if (finite) tick(ctl, t('window.tickCtl'));

      $('winNote').textContent = drCur === null ? '' : t('window.note', { dr: fmtSigned(drCur) });

      const eff = drForm !== null ? Math.min(ctl, drForm) : ctl;
      const room = Math.max(0, eff - drMin);
      const P = [];
      if (outRoom > 1e-9) {
        P.push(t('window.outP', {
          out: fmt(outRoom, 3), drMin: fmtSigned(drMin), ch: fmt(2 * outRoom, 3),
          who: outCapped ? t('window.outGeo', { floor: fmtSigned(drFloor) }) : t('window.outMach')
        }));
      }
      if (tight) {
        P.push(t('window.tightP1', {
          drMin: fmtSigned(drMin), ctl: fmtSigned(ctl),
          room: fmt(ctl - drMin, 4), ch: fmt(2 * (ctl - drMin), 4)
        }));
        P.push(I18N.plural('window.tightP2', tangentCount(drMin), {
          dia: fmt(2 * (WIN ? WIN.rphys : 0), 3)
        }));
      } else {
        P.push(t('window.roomP', {
          room: fmt(room, 4), drMin: fmtSigned(drMin), eff: fmtSigned(eff), ch: fmt(2 * room, 4)
        }));
        if (drForm !== null && drForm < ctl - 1e-4)
          P.push(t('window.lossyP', { form: fmtSigned(drForm), ctl: fmtSigned(ctl) }));
      }
      if (WIN && WIN.harmTop !== null)
        P.push(t('window.harmP', { dr: fmtSigned(WIN.harmTop) }));
      else if (WIN)
        P.push(t('window.safeP', {
          extra: outRoom > 1e-9 ? t('window.safeOutNote', { drMin: fmtSigned(drMin) }) : ''
        }));
      if (drCur !== null) {
        const d = devOf(drCur);
        const wear = WIN ? (WIN.rtab - WIN.rphys) : 0;
        P.push(t('window.curP', {
          dr: fmtSigned(drCur), dev: fmtSigned(d), ch: fmtSigned(-2 * d),
          wear: Math.abs(wear) > 1e-6 ? t('window.curWear', { wear: fmtSigned(wear) }) : ''
        }));
      }
      P.push(t(outRoom > 1e-9 ? 'window.tailOut' : 'window.tailIn', { drMin: fmtSigned(drMin) }));
      txt.innerHTML = P.join('');
    }

    /* ---------- dalış / bağlantı tablosu / plunge and link table ---------- */
    function renderLinks(dr) {
      const box = $('lnkBox');
      $('lnkAt').textContent = dr === null ? '' : t('common.at', { dr: fmtSigned(dr) });
      if (!STATE || !STATE.results.length) { box.innerHTML = `<p class="empty">${t('common.afterAnalysis')}</p>`; return; }
      if (!WIN) { box.innerHTML = `<p class="empty">${t('lnk.noWin')}</p>`; return; }
      if (!LINKS.length) { box.innerHTML = `<p class="empty">${t('lnk.noRows')}</p>`; return; }

      const rows = LINKS.map(l => {
        const w = WIN.byKey.get(l.key);
        return {
          l, idle: idleLink(l), loss: lossOf(l), harm: l.overRef,
          limit: w ? w.lossLimit : null, hlimit: w ? w.harmLimit : null
        };
      });
      rows.sort((a, b) => (a.idle - b.idle) || (b.harm - a.harm) || (b.loss - a.loss) ||
        ((a.limit === null ? 1e9 : a.limit) - (b.limit === null ? 1e9 : b.limit)));
      LNKROWS = rows;

      const nz = rows.filter(r => !r.idle && r.loss > EPSD).length;
      const nh = rows.filter(r => !r.idle && r.harm > EPSD).length;
      const outZone = dr !== null && dr < -WIN.rtab - 1e-9;
      let html = `<p class="hint" style="padding:10px 10px 0">` +
        I18N.plural('lnk.summary', rows.length, {
          harm: nh ? I18N.plural('lnk.summaryHarm', nh) : t('lnk.summaryNoHarm'),
          loss: nz ? I18N.plural('lnk.summaryLoss', nz) : t('lnk.summaryNoLoss')
        }) +
        (outZone ? t('lnk.outZone', { v: fmtSigned(-WIN.rtab) }) : '') + `</p>` +
        TW0 + `<thead><tr><th>${t('lnk.th.block')}</th><th>${t('lnk.th.move')}</th><th class="num">${t('lnk.th.z')}</th>` +
        `<th class="num">${t('lnk.th.harm')}</th><th class="num">${t('lnk.th.loss')}</th>` +
        `<th class="num">${t('lnk.th.limit')}</th></tr></thead><tbody>`;
      rows.slice(0, 18).forEach((r, i) => {
        const zs = Math.abs(r.l.z1 - r.l.z0) < 1e-6 ? fmt(r.l.z0, 2) : fmt(r.l.z0, 2) + '…' + fmt(r.l.z1, 2);
        const col = r.idle ? 'color:var(--ink-3)' : '';
        html += `<tr data-i="${i}" class="crow" style="${col}"><td><span class="blk">${r.l.block ?? '—'}</span></td>` +
          `<td>${linkName(r.l.kind)}${r.idle ? t('lnk.idle') : ''}</td>` +
          `<td class="num">${zs}</td>` +
          `<td class="num">${r.idle ? '—' : (r.harm > EPSD ? `<b style="color:var(--red)">${fmt(r.harm, 4)}</b>` : `<span style="color:var(--green)">${t('lnk.noHarm')}</span>`)}</td>` +
          `<td class="num">${r.idle ? '—' : (r.loss > EPSD ? fmt(r.loss, 4) : '—')}</td>` +
          `<td class="num">${r.idle ? '—' : (r.limit === null ? `<span style="color:var(--green)">${t('lnk.noLimit')}</span>` : fmtSigned(r.limit))}</td></tr>`;
      });
      html += '</tbody>' + TW1;
      if (rows.length > 18) html += `<p class="hint" style="padding:8px 10px">${I18N.plural('lnk.more', rows.length - 18)}</p>`;
      box.innerHTML = html;
      box.querySelectorAll('tr[data-i]').forEach(tr => {
        tr.onclick = () => {
          const r = LNKROWS[parseInt(tr.getAttribute('data-i'), 10)];
          if (!r) return;
          const ci = r.l.ci;
          if (ci !== undefined && ci !== ACTIVE && STATE.results[ci]) {
            ACTIVE = ci;
            const ch = $('conChips').children;
            for (let i = 0; i < ch.length; i++) ch[i].classList[i === ACTIVE ? 'add' : 'remove']('on');
            setupSlider();
          }
          FOCUS = { p: r.l.a, block: r.l.block };
          focusOn(r.l.a, Math.max(WIN.rphys * 2, 0.5));
        };
      });
    }

    function renderDamage(dr) {
      const box = $('dmgBox');
      $('dmgAt').textContent = dr === null ? '' : t('common.at', { dr: fmtSigned(dr) });
      if (!STATE || !STATE.results.length) { box.innerHTML = `<p class="empty">${t('common.afterAnalysis')}</p>`; return; }
      if (!DAMAGE.length) {
        box.innerHTML = `<p class="empty" style="color:var(--green)">${t('dmg.none')}</p>`; return;
      }
      const tot = DAMAGE.reduce((a, d) => a + (d.n || 1), 0);
      let html = `<p class="hint" style="padding:10px 10px 0">${t('dmg.summary', { places: DAMAGE.length, blocks: tot })}</p>` +
        TW0 + `<thead><tr><th>${t('dmg.th.contour')}</th><th>${t('dmg.th.block')}</th>` +
        `<th class="num">${t('dmg.th.level')}</th><th>${t('dmg.th.what')}</th>` +
        `<th class="num">${t('dmg.th.excess')}</th></tr></thead><tbody>`;
      DAMAGE.slice(0, 12).forEach((d, i) => {
        html += `<tr data-i="${i}" class="crow"><td>${d.con}</td>` +
          `<td><span class="blk">${d.block ?? '—'}</span></td>` +
          `<td class="num">${d.n > 1 ? '×' + d.n : '1'}</td>` +
          `<td>${I18N.opt('dmg.kind.' + d.kind) || d.kind}${d.dz !== undefined ? t('dmg.dz', { mm: fmt(d.dz, 3) }) : ''}</td>` +
          `<td class="num">${d.kind === 'arc' ? t('dmg.unmachinable') : (d.kind === 'throat' ? '—' : fmt(d.depth, 4) + ' mm')}</td></tr>`;
      });
      html += '</tbody>' + TW1;
      if (DAMAGE.length > 12) html += `<p class="hint" style="padding:8px 10px">${I18N.plural('dmg.more', DAMAGE.length - 12)}</p>`;
      box.innerHTML = html;
      box.querySelectorAll('tr[data-i]').forEach(tr => {
        tr.onclick = () => {
          const d = DAMAGE[parseInt(tr.getAttribute('data-i'), 10)];
          if (!d || !d.p) return;
          if (d.ci !== ACTIVE) {
            ACTIVE = d.ci;
            const ch = $('conChips').children;
            for (let i = 0; i < ch.length; i++) ch[i].classList[i === ACTIVE ? 'add' : 'remove']('on');
            setupSlider();
          }
          FOCUS = { p: d.p, block: d.block };
          focusOn(d.p, Math.max(Math.abs(TESTR), 0.5));
        };
      });
    }

    function renderCorners(A) {
      const box = $('cornBox');
      const rows = [];
      A.results.forEach((r, ri) => r.corners.forEach(c => rows.push({ ci: ri, con: r.index, ...c })));
      if (!rows.length) { box.innerHTML = `<p class="empty">${t('corn.none')}</p>`; return; }
      rows.sort((a, b) => a.inner - b.inner);
      CORN = [];
      let html = TW0 + `<thead><tr><th>${t('corn.th.contour')}</th><th>${t('corn.th.block')}</th>` +
        `<th class="num">${t('corn.th.angle')}</th><th class="num">${t('corn.th.edges')}</th>` +
        `<th>${t('corn.th.type')}</th></tr></thead><tbody>`;
      rows.slice(0, 12).forEach(c => {
        const i = CORN.push(c) - 1;
        const tip = t(c.inner < 45 ? 'corn.verySharp' : c.inner < 95 ? 'corn.sharp' : 'corn.blunt');
        html += `<tr data-i="${i}" class="crow"><td>${c.con}</td>` +
          `<td><span class="blk">${c.block ?? '—'}</span></td>` +
          `<td class="num">${fmt(c.inner, 1)}°</td>` +
          `<td class="num">${fmt(c.la, 1)} / ${fmt(c.lb, 1)}</td>` +
          `<td>${tip}</td></tr>`;
      });
      html += '</tbody>' + TW1;
      box.innerHTML = html;
      box.querySelectorAll('tr[data-i]').forEach(tr => {
        tr.onclick = () => {
          const c = CORN[parseInt(tr.getAttribute('data-i'), 10)];
          if (!c || !c.p) return;
          if (c.ci !== ACTIVE) {
            ACTIVE = c.ci;
            const ch = $('conChips').children;
            for (let i = 0; i < ch.length; i++) ch[i].classList[i === ACTIVE ? 'add' : 'remove']('on');
            setupSlider();
          }
          FOCUS = { p: c.p, block: c.block };
          focusOn(c.p, Math.max(Math.abs(TESTR), Math.min(c.la, c.lb) / 3, 1));
        };
      });
    }

    function renderContours(A, safety) {
      const box = $('conBox');
      if (!A.results.length) { box.innerHTML = `<p class="empty">${t('con.none')}</p>`; return; }
      let html = TW0 + `<thead><tr><th>${t('con.th.n')}</th><th>${t('con.th.comp')}</th>` +
        `<th class="num">${t('con.th.start')}</th><th class="num">${t('con.th.els')}</th>` +
        `<th class="num">${t('con.th.len')}</th><th class="num">${t('con.th.minArc')}</th>` +
        `<th class="num">${t('con.th.allowed')}</th><th class="num">${t('con.th.outLimit')}</th></tr></thead><tbody>`;
      A.results.forEach(r => {
        const ca = r.concaveArcs[0];
        html += `<tr><td>${r.index}</td><td><span class="blk">${r.sideName}</span></td>` +
          `<td class="num">${r.startBlock ?? '—'}</td><td class="num">${r.count}</td>` +
          `<td class="num">${fmt(r.length, 1)}</td>` +
          `<td class="num">${ca ? 'R' + fmt(ca.r, 2) : '—'}</td>` +
          `<td class="num">${r.unlimited ? '∞' : fmt(Math.max(0, r.rmax - safety) * 2, 2)}</td>` +
          `<td class="num">${r.outUnlimited ? '∞' : fmt(Math.max(0, r.routMax - safety), 3)}</td></tr>`;
      });
      html += '</tbody>' + TW1;
      box.innerHTML = html;
    }

    function renderWarnings(A) {
      const box = $('warnBox');
      if (!A.warnings.length) { box.innerHTML = `<p class="empty">${t('parse.clean')}</p>`; return; }
      box.innerHTML = '<div class="body" style="padding:12px"><ul class="notes">' +
        A.warnings.map(w => {
          const s = typeof w === 'string' ? w : t(w.k, w.p);
          return `<li>${s.replace(/</g, '&lt;')}</li>`;
        }).join('') + '</ul></div>';
    }

    /* ---------- çıktıları başlangıç durumuna al / reset the outputs ---------- */
    function resetOutputs() {
      const ph = `<p class="empty">${t('common.afterAnalysis')}</p>`;
      $('conChips').innerHTML = '';
      $('critBox').innerHTML = ph;
      $('conBox').innerHTML = ph;
      $('cornBox').innerHTML = ph;
      $('lnkBox').innerHTML = ph;
      $('dmgBox').innerHTML = ph; DAMAGE = [];
      $('warnBox').innerHTML = `<p class="empty">${t('common.dash')}</p>`;
      $('winTxt').innerHTML = `<p class="empty" style="padding:0">${t('window.placeholder')}</p>`;
      $('band').innerHTML = ''; $('bandAxis').innerHTML = '';
      $('winNote').textContent = ''; $('lnkAt').textContent = ''; $('dmgAt').textContent = '';
      ['vMax', 'vMin', 'vForm'].forEach(id => { $(id).innerHTML = t('common.dash'); $(id).className = 'v'; });
      ['sMax', 'sMin', 'sForm'].forEach(id => { $(id).textContent = t('dro.notYet'); });
      $('kMin').textContent = t('dro.min'); DRFLOOR = null;
      $('cellMin').className = 'cell'; $('cellMax').className = 'cell'; $('cellForm').className = 'cell';
      $('rng').disabled = true; $('rngVal').textContent = t('plot.noVal');
      setVerdict('idle', 'vd.idle.tag', 'vd.idle.txt');
    }

    /* ---------- olaylar / events ---------- */
    $('run').onclick = run;
    $('sample').onclick = () => { LOADED = null; FNAME = 'program'; $('drop').innerHTML = t('drop.idle'); $('src').value = SAMPLE; run(); };
    $('clear').onclick = () => {
      $('src').value = ''; STATE = null; ACTIVE = 0; INFO = null; WIN = null; LINKS = []; LNKROWS = [];
      LOADED = null; FNAME = 'program'; $('drop').innerHTML = t('drop.idle');
      FOCUS = null; needFit = true; LASTTEXT = null;
      resetOutputs(); draw();
    };

    ['rtab', 'drcur', 'safety', 'tol', 'gouge', 'outcap'].forEach(id => {
      $(id).addEventListener('change', () => { if (STATE) run(); });
    });
    $('outAllow').addEventListener('change', () => {
      $('outcap').disabled = !$('outAllow').checked;
      if (STATE) run();
    });

    const drop = $('drop'), file = $('file');
    drop.onclick = () => file.click();
    drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } };
    file.onchange = e => { const f = e.target.files[0]; if (f) readFile(f); };
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('hot'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('hot'); }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) readFile(f); });
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
    function readFile(f) {
      const rd = new FileReader();
      rd.onload = () => {
        FNAME = f.name; LOADED = f.name; $('src').value = String(rd.result);
        drop.innerHTML = t('drop.loaded', { name: f.name }); run();
      };
      rd.readAsText(f, 'utf-8');
    }

    /* ---------- dil / language ---------- */
    I18N.init();
    (function buildLangBar() {
      const bar = $('langbar'); if (!bar) return;
      bar.innerHTML = '';
      I18N.langs().forEach(m => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = m.label; b.title = m.name;
        b.setAttribute('data-lang', m.code);
        b.setAttribute('aria-pressed', String(m.code === I18N.lang));
        b.onclick = () => I18N.setLang(m.code);
        bar.appendChild(b);
      });
    })();
    I18N.onChange(() => {
      const bar = $('langbar');
      if (bar) [...bar.children].forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === I18N.lang)));
      syncDetails();
      if (LOADED) drop.innerHTML = t('drop.loaded', { name: LOADED });
      if (STATE) run(); else { resetOutputs(); draw(); }
    });

    syncDetails();
    $('outcap').disabled = !$('outAllow').checked;
    resetOutputs();
    draw();
  })();
}
