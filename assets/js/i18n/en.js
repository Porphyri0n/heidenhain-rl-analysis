/* =====================================================================
   en.js — English dictionary
   ===================================================================== */
I18N.register('en', { code: 'en', label: 'EN', name: 'English' }, {

  /* ---------- page shell ---------- */
  'app.title': 'Contour Radius Analysis — Heidenhain .H',
  'app.h1': 'Contour Radius Analysis',
  'app.lead': 'Reads a Heidenhain Klartext (<code>.H</code>) or ISO program. When you dial stock in with DR it ' +
    'finds the range you may stay in, from three separate limits: the control\'s “tool radius too large” error, ' +
    'plunge and retract moves breaking into the slot wall, and where the stock you left does not survive.',
  'app.stamp': 'XY plane only · mm · runs locally',
  'app.langAria': 'Language',
  'app.footer': 'All maths runs in your browser · the program is never uploaded · verify results on the machine before production',

  /* ---------- 1 · Program ---------- */
  'card.program': '1 · Program',
  'drop.idle': '<b>Drop a file</b> or click — .H, .HC, .I, .NC, .txt',
  'drop.loaded': '<b>{name}</b> loaded',
  'label.src': 'Program text',
  'ph.src': '0 BEGIN PGM PART MM\n1 BLK FORM 0.1 Z X-60 Y-40 Z-20\n...',
  'btn.run': 'Analyse',
  'btn.sample': 'Load sample',
  'btn.clear': 'Clear',

  /* ---------- 2 · Tool ---------- */
  'card.tool': '2 · Tool',
  'label.rtab': 'Tool table R (mm)',
  'label.drcur': 'DR in the program (mm)',
  'hint.eff': 'Effective radius = R + DR. If the post wrote DR = &minus;R the effective radius is zero and the ' +
    'machine runs the path as programmed. The DR field is filled automatically from the TOOL CALL in the program.',
  'label.rphys': 'Actual tool radius (mm)',
  'label.drref': 'DR of the nominal form',
  'hint.dev': 'This is the <b>actual</b> radius removing material; it is independent of the table R. The nominal DR ' +
    'is the value at which the form on the drawing appears &mdash; if CAM posted the tool centre path, that is the ' +
    'DR in the program.<br>' +
    'Wall deviation = (DR &minus; nominal DR) + (table R &minus; actual R). A positive value means more material ' +
    'left on the wall, i.e. the slot gets narrower.',
  'label.safety': 'Safety margin (mm)',
  'label.tol': 'Arc tolerance (mm)',
  'chk.gouge': 'Narrow-passage scan. Turn it on for real contour programs; on programs where CAM posted the tool ' +
    'centre path it mistakes neighbouring passes for errors.',
  'chk.outAllow': '<b>My machine can offset outward.</b> Turn this on if you can go below &minus;R to push the path ' +
    'to the other side of the contour and <b>widen</b> the slot. The DR axis then opens downward.',
  'label.outcap': 'Largest outward offset you can apply (mm)',
  'hint.outcap': 'The practical limit of your machine / control. If the geometric limit is tighter, the smaller one wins.',
  'hint.outoffset': 'Outward offset = the effective radius going negative: the tool centre crosses to the other side ' +
    'of the contour, the wall is cut <b>past nominal</b> everywhere and the slot gets twice that much wider. ' +
    'Remember this cannot be taken back &mdash; whatever you give away is gone for good.',

  /* ---------- How to read this ---------- */
  'card.howto': 'How to read this',
  'howto.1': '<b>DR = &minus;R</b> is the nominal baseline: effective radius zero, the machine runs the program as ' +
    'written. Above it you leave stock and the slot narrows.',
  'howto.2': '<b>DR minimum · outward</b>: below &minus;R, only possible with an <i>outward offset</i> &mdash; the ' +
    'tool centre crosses to the other side of the contour and the slot grows. If your control refuses a negative ' +
    'total radius this zone is closed; ticking “my machine can offset outward” opens it. Its limit is where convex ' +
    'corner arcs invert or the path starts to cut itself.',
  'howto.3': '<b>DR max · control</b>: past this value the offset swallows a contour element or stays larger than an ' +
    'inside arc. This is the moment the control says <i>“tool radius too large”</i>.',
  'howto.4': '<b>DR max · form holds</b>: plunge, retract and compensation on/off moves are programmed with <b>R0</b> ' +
    'and do not shift with DR. Above this value the tool cuts back the stock you wanted to leave at those points and ' +
    'holds the wall at nominal &mdash; the rest of the slot narrows while a local notch stays there.',
  'howto.5': '<b>Permanent damage</b> is measured separately: a move cutting past the <i>nominal</i> wall. Raising DR ' +
    'in the stock-leaving direction normally does not do this; if the program finds it, it warns you separately.',
  'howto.6': 'Because the blank condition is unknown, moves that are already in fresh air at the nominal DR (rapid ' +
    'plunges into a previously opened pocket, for example) are excluded and marked <i>idle</i> in the list.',
  'howto.7': 'Z bands are compared per contour: a move is measured only against the area opened by contours whose Z ' +
    'range overlaps it. On continuously descending (Z-level) paths the whole contour band is taken together.',
  'howto.8': '<b>Part damage</b>: when DR exceeds the limit and the control runs with M120, it does not stop — it ' +
    'skips the swallowed element and cuts the corner. The mm value in the list is how far the path enters that surface.',
  'howto.9': 'Zoom the plot with the wheel, pan by dragging. Sweep DR with the slider to watch the slot boundary ' +
    'close in and see when the plunge circles break out.',

  /* ---------- readouts ---------- */
  'dro.min': 'DR minimum',
  'dro.minOut': 'DR minimum · outward',
  'dro.maxCtl': 'DR max · control',
  'dro.maxForm': 'DR max · form holds',
  'dro.notYet': 'Not analysed yet',
  'dro.noContour': 'No compensated contour found',
  'dro.noRLRR': 'No RL / RR found',
  'dro.minOutSub': '{out} mm outward · slot grows {ch} mm',
  'dro.minOutGeo': ' · geometry sets the limit',
  'dro.minOutMach': ' · the machine sets the limit',
  'dro.minNomSub': 'Effective radius 0 · program runs as written',
  'dro.maxFree': 'unlimited',
  'dro.maxFreeSub': 'No geometry in the contours pinches the tool',
  'dro.maxTooTight': 'Even an effective radius of {r} mm is too much',
  'dro.maxSub': 'Effective radius at most {r} mm · includes {s} margin',
  'dro.formOutside': 'Plunge / link moves fall outside the contour area',
  'dro.formNoLinks': 'No plunge / link move overlaps a contour in Z',
  'dro.formNoLimit': 'no limit',
  'dro.formOkSub.one': '1 move checked · stock holds everywhere',
  'dro.formOkSub.other': '{n} moves checked · stock holds everywhere',
  'dro.formNone': 'none',
  'dro.formTightSub': 'Exit / plunge points touch the wall · stock is lost from the first micron',
  'dro.formSub': 'Up to this value the stock you leave holds everywhere',

  /* ---------- DR window ---------- */
  'card.window': 'DR window',
  'band.out': 'Outward offset · slot grows, cutting past nominal',
  'band.green': 'Stock holds fully',
  'band.amber': 'Stock partly lost · at plunge/exit points',
  'band.red': 'Control errors out',
  'window.placeholder': 'Summarised here after the analysis.',
  'window.note': '· DR is {dr} now',
  'window.tickOut': 'outward limit',
  'window.tickNominal': 'nominal',
  'window.tickNoRoom': 'no stock',
  'window.tickForm': 'stock holds',
  'window.tickCtl': 'control',
  'window.outP': '<p><b>Outward offset up to {out} mm</b> — the blue zone below DR {drMin}. ' +
    'There the tool centre crosses to the other side of the contour, the wall is cut past nominal and the slot ' +
    'grows by at most <b>{ch} mm</b>. {who}</p>',
  'window.outGeo': 'Geometry sets the limit: below {floor} convex corner arcs invert or the path cuts itself.',
  'window.outMach': 'The machine value you entered sets the limit; geometry would allow going lower.',
  'window.tightP1': '<p><b>The control accepts {drMin} … {ctl}</b> ({room} mm of stock, {ch} mm of narrowing across ' +
    'the slot width) and within this range the part takes <b>no permanent damage</b>.</p>',
  'window.tightP2.one': '<p>But 1 R0 point sits tangent to the nominal wall, which is why the whole band is amber: ' +
    'no matter how far you raise DR, the wall stays at nominal there. The rest of the slot narrows cleanly, only at ' +
    'that point a Ø{dia} mm local notch appears, as deep as the entire stock you left.</p>',
  'window.tightP2.other': '<p>But {n} R0 points sit tangent to the nominal wall, which is why the whole band is amber: ' +
    'no matter how far you raise DR, the wall stays at nominal there. The rest of the slot narrows cleanly, only at ' +
    'those points a Ø{dia} mm local notch appears, as deep as the entire stock you left.</p>',
  'window.roomP': '<p><b>Usable range {room} mm</b> — DR {drMin} to {eff}. ' +
    'Within it you leave at most {room} mm on the wall and the slot width narrows by {ch} mm.</p>',
  'window.lossyP': '<p>Above {form} the control still does not error out (up to {ctl}) and the part is not scrap, ' +
    'but the stock you leave is cut back at plunge / exit points. The table below shows in which block and by how much.</p>',
  'window.harmP': '<p style="color:var(--red)"><b>Careful:</b> above DR {dr} a move cuts past the nominal wall — ' +
    'that is permanent damage.</p>',
  'window.safeP': '<p style="color:var(--green)"><b>No permanent damage:</b> up to the control limit no plunge or ' +
    'link move cuts past the nominal wall. Raising DR does not shrink the part, it only leaves stock.{extra}</p>',
  'window.safeOutNote': ' <span style="color:var(--ink-2)">This holds above {drMin}; in the outward-offset zone the ' +
    'contour itself already cuts past nominal.</span>',
  'window.curP': '<p>Selected DR {dr} → wall deviation against nominal <b>{dev} mm</b>, slot width <b>{ch} mm</b>.{wear}</p>',
  'window.curWear': ' {wear} mm of that comes from the actual tool differing from the table size.',
  'window.tailOut': '<p style="color:var(--ink-2)">Above DR {drMin} you leave stock and narrow the slot; below it is ' +
    'the outward offset, which widens the slot. There is no stock to leave out there, the material is gone for good ' +
    '&mdash; do not sit exactly on the limit without verifying the size on the machine.</p>',
  'window.tailIn': '<p style="color:var(--ink-2)">With this setting DR only leaves stock: to <b>widen</b> the slot you ' +
    'must go below DR {drMin}, i.e. drive the effective radius negative. If your machine can offset outward, tick ' +
    '“my machine can offset outward”; if it cannot, lower the table R or change the nominal form.</p>',

  /* ---------- plot ---------- */
  'card.plot': 'Contour and tool path',
  'plot.testdr': 'Test DR',
  'plot.fit': 'Fit',
  'plot.noVal': '— mm',
  'plot.val': 'DR {dr}',
  'plot.empty': 'No contour',
  'plot.grid': 'grid {step} mm',
  'plot.block': 'block {block}',
  'legend.contour': 'Contour',
  'legend.center': 'Tool centre path',
  'legend.gouge': 'Collision / gouge',
  'legend.channel': 'Machined slot boundary',
  'legend.plunge': 'Plunge / link · tool circle',
  'legend.damage': 'Part damage / focus',
  'plot.chip': 'Contour {i} · {side} · {lim}',

  /* ---------- cards ---------- */
  'card.links': 'Plunge and link moves',
  'card.damage': 'Part damage',
  'card.crit': 'Limiting blocks',
  'card.corners': 'Sharp inside corners',
  'card.contours': 'Contour breakdown',
  'card.parse': 'Parser notes',
  'btn.annotate': 'Write warnings into the program and download',
  'btn.detailsShow': 'Show details',
  'btn.detailsHide': 'Hide details',
  'common.afterAnalysis': 'Listed here after the analysis.',
  'common.dash': '—',
  'common.at': '· DR {dr}',

  /* ---------- verdict ---------- */
  'vd.idle.tag': 'Ready',
  'vd.idle.txt': 'Load a program and press <b>Analyse</b>.',
  'vd.empty.tag': 'Empty',
  'vd.empty.txt': 'Paste the program text or drop a file first.',
  'vd.error.tag': 'Error',
  'vd.error.txt': 'Could not read the program: {msg}',
  'vd.noContour.tag': 'No contour',
  'vd.noContour.txt': 'The program has no contour opened with RL / RR (or G41 / G42). With compensation off there is ' +
    'no radius error either.',
  'vd.noRange.tag': 'No range',
  'vd.noRange.txt': 'Even an effective radius of {r} mm does not fit these contours. As it stands the program can only ' +
    'be run around DR = {drMin}, i.e. with compensation ineffective.',
  'vd.drNeg.tag': 'DR negative',
  'vd.drNeg.txt': 'With DR {dr} the total radius goes negative and the control will not accept it as is. The lower ' +
    'limit is {drMin}. If your machine can apply an <b>outward offset</b>, tick the box on the left: the path crosses ' +
    'to the other side of the contour and the slot grows. If it cannot, you must lower the table R or change the program.',
  'vd.outMuch.tag': 'Outward offset too large',
  'vd.outMuch.txt': 'DR {dr} means {out} mm outward. The limit is {floor} ({room} mm outward){why}',
  'vd.outMuch.geo': ' — beyond it convex corner arcs invert or the path cuts itself and the form breaks down.',
  'vd.outMuch.mach': ' — that is the outward-offset limit you entered for the machine. If you need more, raise that value first.',
  'vd.drMuch.tag': 'DR too large',
  'vd.drMuch.txt': 'DR {dr} is above the control limit. The accepted range is {floor} … {drMax}.',
  'vd.outZone.tag': 'Outward offset',
  'vd.outZone.txt': 'With DR {dr} the tool centre crosses {out} mm to the other side of the contour. ' +
    'Wall deviation <b>{dev} mm</b>, slot width <b>{ch} mm</b>. {note}Outward floor {floor}.{harm}',
  'vd.outZone.cutting': 'You are cutting past nominal; this material does not come back, make sure you hit the size. ',
  'vd.outZone.safe': 'Because the tool differs from the table, the wall does not fall behind nominal even though the ' +
    'path shifts outward. ',
  'vd.outZone.harm': ' Also, the {kind} move (block {block}) stays {mm} mm past the nominal wall.',
  'vd.harm.tag': 'Damages the part',
  'vd.harm.txt': 'With DR {dr} the {kind} move (block {block}) cuts {mm} mm past the nominal wall — that is ' +
    'permanent damage.{top}',
  'vd.harm.top': ' The damage-free upper limit is {v}.',
  'vd.tight.tail.one': 'at 1 R0 point (plunge, retract, compensation off) the tool centre sits tangent to the nominal ' +
    'wall. No matter how far you raise DR, the wall stays at nominal there: a Ø{dia} mm local notch as deep as the ' +
    'entire stock you left. For the stock to hold everywhere, that R0 point must be pulled into the middle of the slot.',
  'vd.tight.tail.other': 'at {n} R0 points (plunge, retract, compensation off) the tool centre sits tangent to the ' +
    'nominal wall. No matter how far you raise DR, the wall stays at nominal there: each one a Ø{dia} mm local notch ' +
    'as deep as the entire stock you left. For the stock to hold everywhere, those R0 points must be pulled into the ' +
    'middle of the slot.',
  'vd.tightDialed.tag': 'Stock lost locally',
  'vd.tightDialed.txt': 'With DR {dr} you leave {dev} mm on the wall and the part takes no permanent damage. But {tail}{worst}',
  'vd.tightDialed.worst': ' The deepest right now is {mm} mm at block {block}.',
  'vd.tightNominal.tag': 'At nominal · stock will not hold',
  'vd.tightNominal.txt': 'Nothing wrong at this DR — the control accepts up to {drMax} and no move cuts past the ' +
    'nominal wall. But the moment you start leaving stock, {tail}',
  'vd.lossy.tag': 'Stock does not hold',
  'vd.lossy.txt': 'The control does not error out and the part takes no permanent damage, but of the {dev} mm you ' +
    'leave with DR {dr}, {lost} is cut back at the {where} point. The upper limit where stock holds everywhere is {form}.',
  'vd.lossy.some': 'part',
  'vd.lossy.whereBlock': 'block {block}',
  'vd.lossy.whereGeneric': 'plunge / exit',
  'vd.free.tag': 'Unconstrained',
  'vd.free.txt': 'There is no geometric upper limit for DR. The lower limit is {drMin} (effective radius zero).',
  'vd.fine.tag': 'Good',
  'vd.fine.txt': 'Trouble-free range {drMin} … {eff} — at most {room} mm of stock on the wall, {ch} mm of narrowing ' +
    'across the slot width.{cur}{out}',
  'vd.fine.cur': ' The current DR {dr} is inside that range.',
  'vd.fine.out': ' If needed you can offset outward down to {floor} and widen the slot by {ch} mm.',
  'vd.damageLine.one': '1 damage site. {txt}',
  'vd.damageLine.other': '{n} damage sites. {txt}',
  'vd.damageArc': 'An inside arc is smaller than the effective radius — that arc cannot be machined at this DR at all.',
  'vd.damageGouge': 'At this DR the deepest overcut on the part is {mm} mm (with M120 on, the control will not stop).',

  /* ---------- plunge / link table ---------- */
  'link.on': 'Compensation on',
  'link.off': 'Compensation off',
  'link.plunge': 'Plunge (Z)',
  'link.retract': 'Retract (Z)',
  'link.link': 'Link',
  'lnk.noWin': 'The program has no plunge / link move that can be evaluated.',
  'lnk.noRows': 'No move could be measured for the selected DR.',
  'lnk.summary.one': '1 move checked · {harm} · {loss}',
  'lnk.summary.other': '{n} moves checked · {harm} · {loss}',
  'lnk.summaryHarm.one': '<b style="color:var(--red)">1 of them cuts the nominal wall</b>',
  'lnk.summaryHarm.other': '<b style="color:var(--red)">{n} of them cut the nominal wall</b>',
  'lnk.summaryNoHarm': 'none cut the nominal wall',
  'lnk.summaryLoss.one': '1 of them cuts back the stock you left.',
  'lnk.summaryLoss.other': '{n} of them cut back the stock you left.',
  'lnk.summaryNoLoss': 'at this DR the stock holds everywhere.',
  'lnk.outZone': ' <b>You are in the outward zone:</b> since there is no stock to leave, the “stock lost” column here ' +
    'shows how far the move breaks out of the widened slot. The “top DR without loss” column refers to the ' +
    'stock-leaving zone (above {v}).',
  'lnk.th.block': 'Block',
  'lnk.th.move': 'Move',
  'lnk.th.z': 'Z',
  'lnk.th.harm': 'Permanent damage',
  'lnk.th.loss': 'Stock lost',
  'lnk.th.limit': 'Top DR without loss',
  'lnk.idle': ' <span style="color:var(--ink-3)">· idle, blank condition unknown</span>',
  'lnk.noHarm': 'none',
  'lnk.noLimit': 'no limit',
  'lnk.more.one': '…and 1 more move.',
  'lnk.more.other': '…and {n} more moves.',

  /* ---------- part damage ---------- */
  'dmg.none': 'No damage on the part at this DR.',
  'dmg.summary': 'Distinct sites: {places} · blocks in total: {blocks} (the same site repeats at every Z level).',
  'dmg.th.contour': 'Contour',
  'dmg.th.block': 'Block',
  'dmg.th.level': 'Levels',
  'dmg.th.what': 'What happens',
  'dmg.th.excess': 'Overcut',
  'dmg.kind.gouge': 'Corner cut away — the element is driven over',
  'dmg.kind.arc': 'Inside arc smaller than the effective radius',
  'dmg.kind.throat': 'Narrow passage — the path cuts itself',
  'dmg.kind.appr': 'Approach block shorter than the effective radius — the tool enters the contour sideways',
  'dmg.kind.dep': 'Departure block shorter than the effective radius — the tool leaves the contour sideways',
  'dmg.kind.onIn': 'Compensation switched on inside the cut — the tool sweeps sideways',
  'dmg.kind.onOut': 'Compensation switched off inside the cut — the tool sweeps sideways',
  'dmg.dz': ' <span style="color:var(--ink-3)">({mm} mm below the top of the blank)</span>',
  'dmg.unmachinable': 'not machinable',
  'dmg.more.one': '…and 1 more site.',
  'dmg.more.other': '…and {n} more sites.',

  /* ---------- limiting blocks ---------- */
  'crit.none': 'No inside geometry limits the tool.',
  'crit.th.contour': 'Contour',
  'crit.th.block': 'Block',
  'crit.th.what': 'What happens',
  'crit.th.limit': 'Limit Ø',
  'crit.th.sev': 'Severity',
  'crit.reversal': 'Contour element swallowed by the offset',
  'crit.overlap': 'Tool path cuts itself — narrow passage',
  'crit.arcflip': 'Inside arc smaller than the tool',
  'crit.nojoin': 'Offsets of neighbouring elements do not intersect',
  'crit.arc': 'Inside arc radius',
  'crit.sev.hi': 'critical',
  'crit.sev.md': 'borderline',
  'crit.sev.lo': 'info',

  /* ---------- sharp inside corners ---------- */
  'corn.none': 'No inside corner pinches the tool. All corners are convex.',
  'corn.th.contour': 'Contour',
  'corn.th.block': 'Block',
  'corn.th.angle': 'Inside angle',
  'corn.th.edges': 'Adjacent edges mm',
  'corn.th.type': 'Corner type',
  'corn.verySharp': 'very sharp',
  'corn.sharp': 'sharp',
  'corn.blunt': 'shallow',

  /* ---------- contour breakdown ---------- */
  'con.none': 'No contour found.',
  'con.th.n': '#',
  'con.th.comp': 'Comp.',
  'con.th.start': 'Start block',
  'con.th.els': 'Elements',
  'con.th.len': 'Length mm',
  'con.th.minArc': 'Smallest inside arc',
  'con.th.allowed': 'Allowed Ø',
  'con.th.outLimit': 'Outward offset limit',

  /* ---------- parser notes ---------- */
  'parse.clean': 'The program was read completely, no warnings.',
  'warn.noCC': 'Block {block}: no CC before the C block, taken as straight.',
  'warn.crChord': 'Block {block}: CR radius smaller than the chord, taken as straight.',
  'warn.rnd': 'Block {block}: RND R{v} could not be applied, treated as a sharp corner.',
  'warn.chf': 'Block {block}: CHF {v} could not be applied, treated as a sharp corner.',
  'warn.noContour': 'No contour opened with RL / RR (or G41 / G42) was found.',
  'warn.linkFail': 'Plunge analysis failed: {msg}',

  /* ---------- notes written into the program (ASCII, upper case) ---------- */
  'dl.nothing.tag': 'Nothing to mark',
  'dl.nothing.txt': 'Run the analysis first; if no warnings come up there is nothing to add to the program.',
  'dl.fail.tag': 'Download failed',
  'dl.suffix': '-ANNOTATED.H',
  'an.range': 'DR RANGE {a} ... {b} (CONTROL)',
  'an.rangeOpen': 'DR LOWER LIMIT {a} , NO UPPER LIMIT',
  'an.form': 'TOP DR WHERE STOCK HOLDS EVERYWHERE {v}',
  'an.outFloor': 'OUTWARD OFFSET FLOOR DR {v} : SLOT GROWS UP TO {mm} MM',
  'an.harm': 'PERMANENT DAMAGE : CUTS {mm} MM PAST THE NOMINAL WALL',
  'an.lossLimit': 'ABOVE DR {v} THE STOCK LEFT HERE IS CUT BACK',
  'an.lossNow': ' , NOW {mm} MM',
  'an.arcflip': 'INSIDE ARC : EFFECTIVE RADIUS MUST STAY BELOW {v} MM',
  'an.swallow': 'ABOVE DR {v} THIS ELEMENT IS SWALLOWED BY THE OFFSET',
  'an.gouge': 'AT DR {v} OVERCUT {mm} MM',
  'an.arc': 'AT DR {v} THIS ARC CANNOT BE MACHINED',
  'an.apprShort': 'APPROACH/DEPARTURE BLOCK {mm} MM SHORTER THAN THE EFFECTIVE RADIUS',
  'an.compIn': 'COMPENSATION {what} INSIDE THE CUT : {dz} MM BELOW THE BLANK TOP , {mm} MM SIDEWAYS SWEEP',
  'an.compIn.on': 'SWITCHED ON',
  'an.compIn.off': 'SWITCHED OFF'
});
