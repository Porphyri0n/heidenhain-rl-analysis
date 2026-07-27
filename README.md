# Kontur Yarıçap Analizi — Heidenhain `.H`

> **Canlı / live:** <https://porphyri0n.github.io/heidenhain-rl-analysis/>
>
> **Contour Radius Analysis** — English version below.

Heidenhain Klartext (`.H`) veya ISO programını okuyup, **DR ile pay verirken hangi aralıkta
kalabileceğini** üç ayrı sınırdan bulan tek sayfalık bir araç. Her şey tarayıcıda çalışır;
program hiçbir yere yüklenmez.

- **DR maks · kumanda** — ofsetin bir kontur elemanını yuttuğu, kumandanın *"takım yarıçapı çok büyük"* dediği nokta.
- **DR maks · form tutar** — dalış, geri çekilme ve düzeltme aç/kapa hareketleri `R0` ile programlandığı için
  DR ile yer değiştirmez; bu değerin üstünde bıraktığın pay o noktalarda geri kesilir.
- **DR minimum · dış ofset** — `−R`'nin altı: takım merkezi konturun öbür yanına geçer ve kanal büyür.
  Tezgahın dışarı ofset verebiliyorsa açılır.

Ayrıca kalıcı hasar (nominal duvarın ötesine kesme), keskin iç köşeler, ofsette yutulan elemanlar ve
dar geçitler ayrı ayrı listelenir; uyarılar `;` yorumu olarak programa işlenip indirilebilir.

## Kullanım

İki sürüm var, ikisi de aynı işi yapar:

| Sürüm | Dosya | Ne zaman |
|---|---|---|
| Modüler | [`index.html`](index.html) | Geliştirirken — HTML / CSS / JS ayrı dosyalarda |
| Tek dosya | [`standalone/index.html`](standalone/index.html) | Tezgah başında — indir, çift tıkla, açılır |

Tek dosya sürümü kendi kendine yeter: USB'ye at, kurulum gerekmez, internet olmadan da çalışır
(yalnız yazı tipleri sistem yazı tipine düşer).

**Dil:** sağ üstteki `TR / EN` düğmesi. Seçim tarayıcıda saklanır; ilk açılışta tarayıcı diline göre seçilir.

**Mobil:** arayüz responsive. Grafikte tek parmakla kaydır, iki parmakla yakınlaştır.

## Yapı

```
index.html                  modüler sürüm
assets/
  css/  base.css            değişkenler, sıfırlama, form denetimleri
        layout.css          sayfa iskeleti, ızgara, kırılma noktaları
        components.css      gösterge, DR bandı, grafik, tablolar
  js/   i18n.js             çeviri çekirdeği (t, çoğul, dil değişimi)
        i18n/tr.js          Türkçe sözlük (yedek dil)
        i18n/en.js          İngilizce sözlük
        geometry.js         vektör / yay / kesişim çekirdeği
        parser.js           Klartext + basit ISO ayrıştırıcı
        offset.js           tam analitik ofset, çakışma, gouge
        analysis.js         dalış-bağlantı taraması, DR penceresi
        app.js              arayüz
standalone/index.html       üretilmiş tek dosya — elle düzenleme
tools/build_standalone.py   üretici
```

Ayrıştırma ve geometri katmanı arayüzden bağımsızdır; `analysis.js` Node altında
`module.exports` ile de kullanılabilir.

## Tek dosya sürümünü üretmek

`assets/` altında bir şey değiştirdiysen:

```bash
python tools/build_standalone.py
```

`index.html` içindeki yerel `<link rel="stylesheet">` ve `<script src>` etiketlerini dosya
içerikleriyle değiştirip `standalone/index.html` dosyasını yeniden yazar. Uzak kaynaklar
(Google Fonts) olduğu gibi kalır. Tek dosyayı elle düzenleme — bir sonraki üretimde silinir.

## Sınırlar

- Yalnız **XY düzlemi**, yalnız **mm**.
- Kütük durumu bilinmediği için nominal DR'de zaten boşta olan hareketler değerlendirme dışıdır ve
  listede *boşta* diye işaretlenir.
- Döngüler (`CYCL CALL`), `PLANE`, `M91/M92` sonrası konum belirsiz sayılır; o hareketler ölçülmez.
- **Sonuçları makinede doğrulamadan üretime alma.**

---

# Contour Radius Analysis — Heidenhain `.H`

A single-page tool that reads a Heidenhain Klartext (`.H`) or ISO program and finds **the DR range
you may stay in when dialling stock**, from three separate limits. Everything runs in the browser;
the program is never uploaded.

- **DR max · control** — where the offset swallows a contour element and the control says
  *"tool radius too large"*.
- **DR max · form holds** — plunge, retract and compensation on/off moves are programmed with `R0`
  and do not shift with DR; above this value the stock you left is cut back at those points.
- **DR minimum · outward** — below `−R`: the tool centre crosses to the other side of the contour and
  the slot grows. Enabled if your machine can offset outward.

Permanent damage (cutting past the nominal wall), sharp inside corners, elements swallowed by the
offset and narrow passages are listed separately; the warnings can be written back into the program
as `;` comments and downloaded.

## Usage

Two builds, same behaviour:

| Build | File | When |
|---|---|---|
| Modular | [`index.html`](index.html) | While developing — HTML / CSS / JS in separate files |
| Standalone | [`standalone/index.html`](standalone/index.html) | At the machine — download, double-click, done |

The standalone file is self-contained: drop it on a USB stick, no install, works offline
(only the web fonts fall back to system fonts).

**Language:** the `TR / EN` switch at the top right. The choice is stored in the browser; on first
load it follows the browser language.

**Mobile:** the UI is responsive. Pan the plot with one finger, pinch to zoom.

## Layout

See the tree above — `assets/css/` holds the three stylesheets, `assets/js/` the i18n core, the two
dictionaries and the four analysis modules, and `tools/build_standalone.py` produces the single file.

The parser and geometry layers do not depend on the UI; `analysis.js` also exports through
`module.exports` for use under Node.

## Building the standalone file

After changing anything under `assets/`:

```bash
python tools/build_standalone.py
```

It inlines the local `<link rel="stylesheet">` and `<script src>` tags of `index.html` and rewrites
`standalone/index.html`. Remote resources (Google Fonts) are left alone. Do not edit the single file
by hand — the next build overwrites it.

## Limits

- **XY plane only**, **mm only**.
- Because the blank condition is unknown, moves already idle at the nominal DR are excluded and
  marked *idle* in the list.
- After cycles (`CYCL CALL`), `PLANE`, `M91/M92` the position is treated as uncertain and those
  moves are not measured.
- **Verify the results on the machine before running production.**

---

Author: [Porphyri0n](https://github.com/Porphyri0n)
