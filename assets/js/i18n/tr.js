/* =====================================================================
   tr.js — Türkçe sözlük (yedek dil)
   ===================================================================== */
I18N.register('tr', { code: 'tr', label: 'TR', name: 'Türkçe' }, {

  /* ---------- sayfa iskeleti ---------- */
  'app.title': 'Heidenhain DR Kontur Yarıçap Analizi — takım yarıçapı çok büyük hatası | .H / ISO',
  'app.h1': 'Kontur Yarıçap Analizi',
  'app.lead': 'Heidenhain Klartext (<code>.H</code>) veya ISO programını okur. DR ile pay verirken hangi aralıkta ' +
    'kalabileceğini üç ayrı sınırdan bulur: kumandanın “takım yarıçapı çok büyük” hatası, dalış ve geri çekilme ' +
    'hareketlerinin kanal duvarına taşması, ve bırakılan payın nerede tutmadığı.',
  'app.stamp': 'Sadece XY düzlemi · mm · yerel çalışır',
  'app.langAria': 'Dil seçimi',
  'app.footer': 'Tüm hesap tarayıcıda yapılır · program hiçbir yere gönderilmez · sonuçları makinede doğrulamadan üretime alma',

  /* ---------- 1 · Program ---------- */
  'card.program': '1 · Program',
  'drop.idle': '<b>Dosya bırak</b> veya tıkla — .H, .HC, .I, .NC, .txt',
  'drop.loaded': '<b>{name}</b> yüklendi',
  'label.src': 'Program metni',
  'ph.src': '0 BEGIN PGM PARCA MM\n1 BLK FORM 0.1 Z X-60 Y-40 Z-20\n...',
  'btn.run': 'Analiz et',
  'btn.sample': 'Örnek yükle',
  'btn.clear': 'Temizle',

  /* ---------- 2 · Takım ---------- */
  'card.tool': '2 · Takım',
  'label.rtab': 'Takım tablosu R (mm)',
  'label.drcur': 'Programdaki DR (mm)',
  'hint.eff': 'Etkin yarıçap = R + DR. Post DR = &minus;R yazdıysa etkin yarıçap sıfırdır ve tezgah yolu aynen ' +
    'işler. DR alanı programdaki TOOL CALL\'dan otomatik doldurulur.',
  'label.rphys': 'Gerçek takım yarıçapı (mm)',
  'label.drref': 'Nominal formun DR\'si',
  'hint.dev': 'Malzemeyi kaldıran <b>gerçek</b> yarıçaptır; tablo R\'sinden bağımsızdır. Nominal DR, resimdeki ' +
    'formun oluştuğu değerdir &mdash; CAM takım merkez yolu bastıysa bu, programdaki DR\'dir.<br>' +
    'Duvar sapması = (DR &minus; nominal DR) + (tablo R &minus; gerçek R). Artı değer, duvarda daha çok ' +
    'malzeme kalması yani kanalın daralması demektir.',
  'label.safety': 'Güvenlik payı (mm)',
  'label.tol': 'Yay hassasiyeti (mm)',
  'chk.gouge': 'Dar geçit taraması. Gerçek kontur programlarında aç; CAM\'in takım merkez yolunu bastığı ' +
    'programlarda komşu pasoları hata sanar.',
  'chk.outAllow': '<b>Tezgahta dışarı ofset verebiliyorum.</b> Yolu konturun öbür tarafına kaydırıp kanalı ' +
    '<b>büyütmek</b> için &minus;R\'nin altına inebiliyorsan aç. DR ekseni aşağı doğru açılır.',
  'label.outcap': 'Verebildiğin en büyük dış ofset (mm)',
  'hint.outcap': 'Tezgahın / kumandanın pratik sınırı. Geometrik sınır bunun altındaysa küçük olan geçerlidir.',
  'hint.outoffset': 'Dış ofset = etkin yarıçapın eksiye düşmesi: takım merkezi konturun öbür yanına geçer, duvar ' +
    'her yerde <b>nominalin ötesine</b> kesilir ve kanal iki katı kadar genişler. Bu payın geri alınamayacağını ' +
    'unutma &mdash; verdiğin kadar malzeme kalıcı gider.',

  /* ---------- Nasıl okunur ---------- */
  'card.howto': 'Nasıl okunur',
  'howto.1': '<b>DR = &minus;R</b> nominal taban: etkin yarıçap sıfır, tezgah programı olduğu gibi işler. Üstü pay ' +
    'bırakır ve kanalı daraltır.',
  'howto.2': '<b>DR minimum · dış</b>: &minus;R\'nin altı, ancak <i>dış ofset</i> ile mümkündür &mdash; takım merkezi ' +
    'konturun öbür yanına geçer ve kanal büyür. Kumanda toplam yarıçapı eksi kabul etmiyorsa bu bölge kapalıdır; ' +
    '“dışarı ofset verebiliyorum” kutusunu işaretleyince açılır. Sınırı, dışbükey köşe yaylarının ters döndüğü ' +
    'ya da yolun kendini kestiği yerdir.',
  'howto.3': '<b>DR maks · kumanda</b>: bu değeri geçince ofset bir kontur elemanını yutuyor ya da bir iç yaydan ' +
    'büyük kalıyor. Kumandanın <i>“takım yarıçapı çok büyük”</i> dediği an burasıdır.',
  'howto.4': '<b>DR maks · form tutar</b>: dalış, geri çekilme ve düzeltme aç/kapa hareketleri <b>R0</b> ile ' +
    'programlanır, DR ile yer değiştirmez. Bu değerin üstünde takım o noktalarda bırakmak istediğin payı ' +
    'geri kesip duvarı nominalde bırakır &mdash; kanalın geri kalanı dararken orada yerel bir çentik kalır.',
  'howto.5': '<b>Kalıcı hasar</b> ayrı ölçülür: bir hareketin <i>nominal</i> duvarın ötesine kesmesi. Pay bırakma ' +
    'yönünde DR büyütmek normalde bunu yapmaz; program bunu bulursa ayrıca uyarır.',
  'howto.6': 'Kütük durumu bilinmediği için, nominal DR\'de zaten boşta olan hareketler (önceden açılmış cebe inen ' +
    'hızlı dalışlar gibi) değerlendirme dışı bırakılır ve listede <i>boşta</i> diye işaretlenir.',
  'howto.7': 'Z bantları kontur bazında karşılaştırılır: bir hareket, yalnız Z aralığı örtüşen konturların açtığı ' +
    'alana göre ölçülür. Sürekli Z inişli (Z-level) yollarda kontur bandının tamamı birlikte alınır.',
  'howto.8': '<b>Parça bozulması</b>: DR sınırı aştığında kumanda M120 ile çalışıyorsa durmaz, yutulan elemanı ' +
    'atlayıp köşeyi keser. Listedeki mm değeri, yolun o yüzeyin içine girdiği miktardır.',
  'howto.9': 'Grafikte tekerlekle yakınlaş, sürükleyerek kaydır. Kaydırıcıyla DR\'yi gezdirip kanal sınırının nasıl ' +
    'daraldığını ve dalış çemberlerinin ne zaman dışarı taştığını görebilirsin.',

  /* ---------- göstergeler ---------- */
  'dro.min': 'DR minimum',
  'dro.minOut': 'DR minimum · dış ofset',
  'dro.maxCtl': 'DR maks · kumanda',
  'dro.maxForm': 'DR maks · form tutar',
  'dro.notYet': 'Henüz analiz yapılmadı',
  'dro.noContour': 'Düzeltmeli kontur bulunamadı',
  'dro.noRLRR': 'RL / RR bulunamadı',
  'dro.minOutSub': 'Dışarı {out} mm · kanal {ch} mm büyür',
  'dro.minOutGeo': ' · sınırı geometri koyuyor',
  'dro.minOutMach': ' · sınırı tezgah koyuyor',
  'dro.minNomSub': 'Etkin yarıçap 0 · program aynen işlenir',
  'dro.maxFree': 'sınırsız',
  'dro.maxFreeSub': 'Konturlarda takımı sıkıştıran geometri yok',
  'dro.maxTooTight': 'Etkin yarıçap {r} mm bile fazla',
  'dro.maxSub': 'Etkin yarıçap en fazla {r} mm · pay {s} dahil',
  'dro.formOutside': 'Dalış / bağlantı hareketleri kontur alanının dışında kalıyor',
  'dro.formNoLinks': 'Konturla Z\'de kesişen dalış / bağlantı hareketi yok',
  'dro.formNoLimit': 'sınır yok',
  'dro.formOkSub': '{n} hareket incelendi · pay her yerde tutuyor',
  'dro.formNone': 'yok',
  'dro.formTightSub': 'Çıkış / dalış noktaları duvara teğet · pay ilk mikrondan kaçıyor',
  'dro.formSub': 'Bu değere kadar bırakılan pay her yerde oturur',

  /* ---------- DR penceresi ---------- */
  'card.window': 'DR penceresi',
  'band.out': 'Dış ofset · kanal büyüyor, nominalin ötesine kesiliyor',
  'band.green': 'Pay tam oturuyor',
  'band.amber': 'Pay kısmen kayboluyor · dalış/çıkış noktalarında',
  'band.red': 'Kumanda hata verir',
  'window.placeholder': 'Analiz sonrası burada özetlenir.',
  'window.note': '· şu an DR {dr}',
  'window.tickOut': 'dış sınır',
  'window.tickNominal': 'nominal',
  'window.tickNoRoom': 'pay yok',
  'window.tickForm': 'pay tutar',
  'window.tickCtl': 'kumanda',
  'window.outP': '<p><b>Dış ofset {out} mm\'ye kadar</b> — DR {drMin} altındaki mavi bölge. ' +
    'Orada takım merkezi konturun öbür yanına geçer, duvar nominalin ötesine kesilir ve kanal en fazla ' +
    '<b>{ch} mm</b> büyür. {who}</p>',
  'window.outGeo': 'Sınırı geometri koyuyor: {floor} altında dışbükey köşe yayları ters dönüyor ya da yol kendini kesiyor.',
  'window.outMach': 'Sınırı senin girdiğin tezgah değeri koyuyor; geometri daha aşağısına da izin veriyor.',
  'window.tightP1': '<p><b>Kumanda {drMin} … {ctl} arasını kabul eder</b> ({room} mm pay, kanal genişliğinde ' +
    '{ch} mm daralma) ve bu aralıkta parçaya <b>kalıcı zarar gelmez</b>.</p>',
  'window.tightP2': '<p>Ama {n} R0 noktası nominal duvara teğet duruyor, bu yüzden bandın tamamı sarı: ' +
    'DR\'yi ne kadar büyütürsen büyüt o noktalarda duvar nominalde kalır. Kanalın geri kalanı düzgün ' +
    'daralır, sadece o noktalarda Ø{dia} mm\'lik yerel çentik oluşur ve derinliği bıraktığın payın tamamı kadardır.</p>',
  'window.roomP': '<p><b>Oynama payı {room} mm</b> — DR {drMin} ile {eff} arası. ' +
    'Bu aralıkta duvara en fazla {room} mm malzeme bırakırsın, kanal genişliği {ch} mm daralır.</p>',
  'window.lossyP': '<p>{form} üstünde kumanda hâlâ hata vermez ({ctl}\'e kadar) ve parça hurda olmaz, ama ' +
    'bıraktığın pay dalış / çıkış noktalarında geri kesilir. Aşağıdaki tabloda hangi kütükte ve ne kadar olduğu var.</p>',
  'window.harmP': '<p style="color:var(--red)"><b>Dikkat:</b> DR {dr} üstünde bir hareket nominal duvarın ' +
    'ötesine kesiyor — bu kalıcı hasardır.</p>',
  'window.safeP': '<p style="color:var(--green)"><b>Kalıcı hasar yok:</b> kumanda sınırına kadar hiçbir dalış ya da ' +
    'bağlantı hareketi nominal duvarın ötesine kesmiyor. DR büyütmek parçayı küçültmez, yalnız pay bırakır.{extra}</p>',
  'window.safeOutNote': ' <span style="color:var(--ink-2)">Bu, {drMin} üstü için geçerlidir; ' +
    'dış ofset bölgesinde konturun kendisi zaten nominalin ötesine kesiyor.</span>',
  'window.curP': '<p>Seçili DR {dr} → nominale göre duvar sapması <b>{dev} mm</b>, kanal genişliği <b>{ch} mm</b>.{wear}</p>',
  'window.curWear': ' Bunun {wear} mm\'i, gerçek takımın tablo ölçüsünden farklı olmasından geliyor.',
  'window.tailOut': '<p style="color:var(--ink-2)">DR {drMin} üstü pay bırakır ve kanalı daraltır; altı dış ofsettir ' +
    've kanalı büyütür. Dış ofsette bırakılacak pay yoktur, malzeme kalıcı gider &mdash; ölçüyü tezgahta ' +
    'doğrulamadan tam sınıra oturma.</p>',
  'window.tailIn': '<p style="color:var(--ink-2)">Bu ayarda DR yalnız pay bırakır: kanalı <b>büyütmek</b> için DR ' +
    '{drMin}\'in altına inmek, yani etkin yarıçapı eksiye düşürmek gerekir. Tezgahta dışarı ofset ' +
    'verebiliyorsan “dışarı ofset verebiliyorum” kutusunu işaretle; veremiyorsan tablo R\'sini düşür ya da ' +
    'nominal formu değiştir.</p>',

  /* ---------- grafik ---------- */
  'card.plot': 'Kontur ve takım yolu',
  'plot.testdr': 'Deneme DR',
  'plot.fit': 'Sığdır',
  'plot.noVal': '— mm',
  'plot.val': 'DR {dr}',
  'plot.empty': 'Kontur yok',
  'plot.grid': 'ızgara {step} mm',
  'plot.block': 'kütük {block}',
  'legend.contour': 'Kontur',
  'legend.center': 'Takım merkez yolu',
  'legend.gouge': 'Çakışma / gouge',
  'legend.channel': 'İşlenen kanal sınırı',
  'legend.plunge': 'Dalış / bağlantı · takım çemberi',
  'legend.damage': 'Parça bozulması / odak',
  'plot.chip': 'Kontur {i} · {side} · {lim}',

  /* ---------- kartlar ---------- */
  'card.links': 'Dalış ve bağlantı hareketleri',
  'card.damage': 'Parça bozulmaları',
  'card.crit': 'Sınırlayan kütükler',
  'card.corners': 'Keskin iç köşeler',
  'card.contours': 'Kontur dökümü',
  'card.parse': 'Ayrıştırma notları',
  'btn.annotate': 'Uyarıları programa işle ve indir',
  'btn.detailsShow': 'Ayrıntıları göster',
  'btn.detailsHide': 'Ayrıntıları gizle',
  'common.afterAnalysis': 'Analiz sonrası burada listelenir.',
  'common.dash': '—',
  'common.at': '· DR {dr}',

  /* ---------- karar şeridi ---------- */
  'vd.idle.tag': 'Hazır',
  'vd.idle.txt': 'Bir program yükle ve <b>Analiz et</b>’e bas.',
  'vd.empty.tag': 'Boş',
  'vd.empty.txt': 'Önce program metnini yapıştır ya da dosya bırak.',
  'vd.error.tag': 'Hata',
  'vd.error.txt': 'Program okunamadı: {msg}',
  'vd.noContour.tag': 'Kontur yok',
  'vd.noContour.txt': 'Programda RL / RR (veya G41 / G42) ile açılan kontur yok. Düzeltme kapalıysa yarıçap hatası da çıkmaz.',
  'vd.noRange.tag': 'Aralık yok',
  'vd.noRange.txt': 'Etkin yarıçap {r} mm bile bu konturlara sığmıyor. Program bu haliyle sadece DR = {drMin} ' +
    'civarında, yani düzeltme etkisiz iken işlenebilir.',
  'vd.drNeg.tag': 'DR eksi',
  'vd.drNeg.txt': 'DR {dr} ile toplam yarıçap negatife düşer, kumanda bu haliyle kabul etmez. Alt sınır {drMin}. ' +
    'Tezgahta <b>dışarı ofset</b> verebiliyorsan sol taraftaki kutuyu işaretle: yol konturun öbür yanına geçer ve ' +
    'kanal büyür. Veremiyorsan tablo R\'sini düşürmen ya da programı değiştirmen gerekir.',
  'vd.outMuch.tag': 'Dış ofset fazla',
  'vd.outMuch.txt': 'DR {dr}, dışarı {out} mm demek. Sınır {floor} (dışarı {room} mm){why}',
  'vd.outMuch.geo': ' — bunun ötesinde dışbükey köşe yayları ters dönüyor ya da yol kendini kesiyor, form bozulur.',
  'vd.outMuch.mach': ' — tezgah için girdiğin dış ofset sınırı. Daha fazlası gerekiyorsa önce o değeri büyüt.',
  'vd.drMuch.tag': 'DR fazla',
  'vd.drMuch.txt': 'DR {dr} kumanda sınırının üstünde. Kabul edilen aralık {floor} … {drMax}.',
  'vd.outZone.tag': 'Dış ofset',
  'vd.outZone.txt': 'DR {dr} ile takım merkezi konturun öbür yanına {out} mm geçiyor. ' +
    'Duvar sapması <b>{dev} mm</b>, kanal genişliği <b>{ch} mm</b>. {note}Dış taban {floor}.{harm}',
  'vd.outZone.cutting': 'Nominalin ötesine kesiyorsun; bu malzeme geri gelmez, ölçüyü tutturduğundan emin ol. ',
  'vd.outZone.safe': 'Takım tablodan farklı olduğu için yol dışarı kaysa da duvar nominalin gerisine düşmüyor. ',
  'vd.outZone.harm': ' Ayrıca {kind} hareketi (kütük {block}) nominal duvarın {mm} mm ötesinde kalıyor.',
  'vd.harm.tag': 'Parçaya zarar',
  'vd.harm.txt': 'DR {dr} ile {kind} hareketi (kütük {block}) nominal duvarın {mm} mm ötesine kesiyor — ' +
    'bu kalıcı hasardır.{top}',
  'vd.harm.top': ' Hasarsız üst sınır {v}.',
  'vd.tight.tail': '{n} R0 noktasında (dalış, geri çekilme, düzeltme kapanışı) takım merkezi nominal duvara ' +
    'teğet duruyor. DR\'yi ne kadar büyütürsen büyüt o noktalarda duvar nominalde kalır: her biri ' +
    'Ø{dia} mm\'lik, derinliği bıraktığın payın tamamı kadar yerel çentik. Payın her yerde ' +
    'oturması için o R0 noktalarını kanalın ortasına çekmek gerekir.',
  'vd.tightDialed.tag': 'Pay yerel kaçıyor',
  'vd.tightDialed.txt': 'DR {dr} ile duvara {dev} mm pay bırakıyorsun ve parçaya kalıcı zarar gelmiyor. Ama {tail}{worst}',
  'vd.tightDialed.worst': ' Şu an en derini kütük {block}\'te {mm} mm.',
  'vd.tightNominal.tag': 'Nominalde · pay tutmaz',
  'vd.tightNominal.txt': 'Bu DR\'de sorun yok, kumanda {drMax}\'e kadar da kabul eder ve hiçbir hareket nominal ' +
    'duvarın ötesine kesmez. Ancak pay bırakmaya başladığın anda {tail}',
  'vd.lossy.tag': 'Pay tutmuyor',
  'vd.lossy.txt': 'Kumanda hata vermez ve parçada kalıcı hasar yok, ama DR {dr} ile bıraktığın {dev} mm payın ' +
    '{lost} kadarı {where} noktasında geri kesiliyor. Payın her yerde oturduğu üst sınır {form}.',
  'vd.lossy.some': 'bir kısmı',
  'vd.lossy.whereBlock': 'kütük {block}',
  'vd.lossy.whereGeneric': 'dalış / çıkış',
  'vd.free.tag': 'Serbest',
  'vd.free.txt': 'DR için geometrik üst sınır yok. Alt sınır {drMin} (etkin yarıçap sıfır).',
  'vd.fine.tag': 'Uygun',
  'vd.fine.txt': 'Sorunsuz aralık {drMin} … {eff} — duvara en fazla {room} mm pay, kanal genişliğinde ' +
    '{ch} mm daralma.{cur}{out}',
  'vd.fine.cur': ' Şu anki DR {dr} bu aralıkta.',
  'vd.fine.out': ' Gerekirse {floor}\'e kadar dışarı ofset verip kanalı {ch} mm büyütebilirsin.',
  'vd.damageLine': '{n} bozulma noktası. {txt}',
  'vd.damageArc': 'İç yay etkin yarıçaptan küçük — bu DR ile o yay hiç işlenemez.',
  'vd.damageGouge': 'Bu DR ile parçada en derin {mm} mm talaş fazlası oluşur (M120 açıksa kumanda durmaz).',

  /* ---------- dalış / bağlantı tablosu ---------- */
  'link.on': 'Düzeltme açılışı',
  'link.off': 'Düzeltme kapanışı',
  'link.plunge': 'Dalış (Z)',
  'link.retract': 'Geri çekilme (Z)',
  'link.link': 'Bağlantı',
  'lnk.noWin': 'Programda değerlendirilebilir dalış / bağlantı hareketi yok.',
  'lnk.noRows': 'Seçili DR için hareket ölçülemedi.',
  'lnk.summary': '{n} hareket incelendi · {harm} · {loss}',
  'lnk.summaryHarm': '<b style="color:var(--red)">{n} tanesi nominal duvarı kesiyor</b>',
  'lnk.summaryNoHarm': 'nominal duvarı kesen yok',
  'lnk.summaryLoss': '{n} tanesinde bırakılan pay geri kesiliyor.',
  'lnk.summaryNoLoss': 'bu DR\'de pay her yerde oturuyor.',
  'lnk.outZone': ' <b>Dış ofsettesin:</b> bırakılacak pay olmadığı için “pay kaybı” sütunu burada hareketin ' +
    'büyütülmüş kanalın dışına ne kadar taştığını gösterir. “Kayıpsız üst DR” ise pay bırakma bölgesine ' +
    '({v} üstüne) aittir.',
  'lnk.th.block': 'Kütük',
  'lnk.th.move': 'Hareket',
  'lnk.th.z': 'Z',
  'lnk.th.harm': 'Kalıcı hasar',
  'lnk.th.loss': 'Pay kaybı',
  'lnk.th.limit': 'Kayıpsız üst DR',
  'lnk.idle': ' <span style="color:var(--ink-3)">· boşta, kütük durumu bilinmiyor</span>',
  'lnk.noHarm': 'yok',
  'lnk.noLimit': 'sınır yok',
  'lnk.more': '…ve {n} hareket daha.',

  /* ---------- parça bozulmaları ---------- */
  'dmg.none': 'Bu DR değerinde parçada bozulma yok.',
  'dmg.summary': '{places} ayrı yer, toplam {blocks} kütük (aynı yer her Z seviyesinde tekrar ediyor).',
  'dmg.th.contour': 'Kontur',
  'dmg.th.block': 'Kütük',
  'dmg.th.level': 'Seviye',
  'dmg.th.what': 'Ne oluyor',
  'dmg.th.excess': 'Talaş fazlası',
  'dmg.kind.gouge': 'Köşe kesiliyor — elemanın üzerinden geçiliyor',
  'dmg.kind.arc': 'İç yay etkin yarıçaptan küçük',
  'dmg.kind.throat': 'Dar geçit — yol kendini kesiyor',
  'dmg.kind.appr': 'Yaklaşma bloğu etkin yarıçaptan kısa — takım kontura yandan dalıyor',
  'dmg.kind.dep': 'Uzaklaşma bloğu etkin yarıçaptan kısa — takım kontura yandan kaçıyor',
  'dmg.kind.onIn': 'Düzeltme talaş içinde açılıyor — takım yana süpürüyor',
  'dmg.kind.onOut': 'Düzeltme talaş içinde kapanıyor — takım yana süpürüyor',
  'dmg.dz': ' <span style="color:var(--ink-3)">(kütük üstünün {mm} mm altında)</span>',
  'dmg.unmachinable': 'işlenemez',
  'dmg.more': '…ve {n} yer daha.',

  /* ---------- sınırlayan kütükler ---------- */
  'crit.none': 'Takımı sınırlayan iç geometri bulunmadı.',
  'crit.th.contour': 'Kontur',
  'crit.th.block': 'Kütük',
  'crit.th.what': 'Ne oluyor',
  'crit.th.limit': 'Sınır Ø',
  'crit.th.sev': 'Önem',
  'crit.reversal': 'Kontur elemanı ofsette yutuluyor',
  'crit.overlap': 'Takım yolu kendini kesiyor — dar geçit',
  'crit.arcflip': 'İç yay takımdan küçük',
  'crit.nojoin': 'Komşu elemanların ofseti kesişmiyor',
  'crit.arc': 'İç yay yarıçapı',
  'crit.sev.hi': 'kritik',
  'crit.sev.md': 'sınırda',
  'crit.sev.lo': 'bilgi',

  /* ---------- keskin iç köşeler ---------- */
  'corn.none': 'Takımı sıkıştıran iç köşe yok. Tüm köşeler dışbükey.',
  'corn.th.contour': 'Kontur',
  'corn.th.block': 'Kütük',
  'corn.th.angle': 'İç açı',
  'corn.th.edges': 'Komşu kenarlar mm',
  'corn.th.type': 'Köşe tipi',
  'corn.verySharp': 'çok keskin',
  'corn.sharp': 'keskin',
  'corn.blunt': 'yayvan',

  /* ---------- kontur dökümü ---------- */
  'con.none': 'Kontur bulunamadı.',
  'con.th.n': '#',
  'con.th.comp': 'Düzeltme',
  'con.th.start': 'Başl. kütük',
  'con.th.els': 'Eleman',
  'con.th.len': 'Uzunluk mm',
  'con.th.minArc': 'En küçük iç yay',
  'con.th.allowed': 'İzin verilen Ø',
  'con.th.outLimit': 'Dış ofset sınırı',

  /* ---------- ayrıştırma notları ---------- */
  'parse.clean': 'Program tam olarak okundu, uyarı yok.',
  'warn.noCC': 'Kütük {block}: C bloğu öncesinde CC yok, doğru kabul edildi.',
  'warn.crChord': 'Kütük {block}: CR yarıçapı kirişten küçük, doğru kabul edildi.',
  'warn.rnd': 'Kütük {block}: RND R{v} uygulanamadı, keskin köşe kabul edildi.',
  'warn.chf': 'Kütük {block}: CHF {v} uygulanamadı, keskin köşe kabul edildi.',
  'warn.noContour': 'RL / RR (veya G41 / G42) ile açılmış hiçbir kontur bulunamadı.',
  'warn.linkFail': 'Dalış analizi yapılamadı: {msg}',

  /* ---------- programa işlenen notlar (ASCII, büyük harf) ---------- */
  'dl.nothing.tag': 'İşaretlenecek yok',
  'dl.nothing.txt': 'Önce analiz çalıştır; uyarı çıkmazsa programa eklenecek bir şey yok.',
  'dl.fail.tag': 'İndirilemedi',
  'dl.suffix': '-UYARILI.H',
  'an.range': 'DR ARALIGI {a} ... {b} (KUMANDA)',
  'an.rangeOpen': 'DR ALT SINIR {a} , UST SINIR YOK',
  'an.form': 'PAYIN HER YERDE TUTTUGU UST DR {v}',
  'an.outFloor': 'DIS OFSET ILE TABAN DR {v} : KANAL EN COK {mm} MM BUYUR',
  'an.harm': 'KALICI HASAR : NOMINAL DUVARIN {mm} MM OTESINE KESIYOR',
  'an.lossLimit': 'DR {v} USTUNDE BIRAKILAN PAY BURADA GERI KESILIR',
  'an.lossNow': ' , SU AN {mm} MM',
  'an.arcflip': 'IC YAY : ETKIN YARICAP {v} MM ALTINDA KALMALI',
  'an.swallow': 'DR {v} UZERINDE BU ELEMAN OFSETTE YUTULUR',
  'an.gouge': 'DR {v} ILE TALAS FAZLASI {mm} MM',
  'an.arc': 'DR {v} ILE BU YAY ISLENEMEZ',
  'an.apprShort': 'YAKLASMA/UZAKLASMA BLOGU ETKIN YARICAPTAN {mm} MM KISA',
  'an.compIn': 'DUZELTME TALAS ICINDE {what} : KUTUK USTUNUN {dz} MM ALTINDA , {mm} MM YANAL SUPURME',
  'an.compIn.on': 'ACILIYOR',
  'an.compIn.off': 'KAPANIYOR'
});
