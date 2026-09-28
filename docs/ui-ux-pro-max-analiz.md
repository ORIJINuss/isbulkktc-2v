# İşBulKKTC UI/UX Pro Max Uygulama Hafızası

Bu dosya, `ui-ux-pro-max-skill-main` içindeki rehberlerin bu projeye uyarlanmış kalıcı uygulama sözleşmesidir. Hazır şablon veya yapay içerik kaynağı değildir.

## Ürün kararı

- Birincil amaç: doğrulanabilir iş ilanını, doğru adayla ve düşük bilişsel yükle eşleştirmek.
- İkincil amaç: işverene güvenilir ilan yayınlama ve başvuru süreci sunmak.
- Marka vaadi: **Doğrulanmış iş. Doğru iş.**
- Tasarım karakteri: yerel, ciddi, erişilebilir, hızlı taranabilir ve güven sinyallerini açıklayan.
- Kaçınılacaklar: yapay istatistikler, doğrulanmamış şirket iddiaları, sahte aciliyet, AI-SaaS görsel klişeleri, gereksiz gradient/glassmorphism ve dekoratif sonsuz animasyonlar.

## Kaynaklar

- `ui-ux-pro-max-skill-main/stack/CLAUDE.md`: kalite tabanı ve üretim döngüsü.
- `ui-ux-pro-max-skill-main/stack/docs/WORKFLOW.md`: tasarım sistemi üretme, uygulama ve bağımsız inceleme akışı.
- `ui-ux-pro-max-skill-main/src/ui-ux-pro-max/data/colors.csv`: renk önerileri ve kontrast ilkeleri.
- `ui-ux-pro-max-skill-main/src/ui-ux-pro-max/data/typography.csv`: Poppins/Open Sans ve Inter alternatifleri.
- `ui-ux-pro-max-skill-main/src/ui-ux-pro-max/data/motion.csv`: 150–300 ms işlevsel hareket ve reduced-motion ilkeleri.
- `ui-ux-pro-max-skill-main/src/ui-ux-pro-max/data/ux-guidelines.csv`: erişilebilirlik, formlar, durumlar ve responsive kurallar.

## Uygulama sözleşmesi

### İçerik ve veri

1. Sayı, oran, şirket, ilan, maaş ve güven iddiası yalnızca doğrulanabilir veri kaynağından gelmelidir.
2. Veri yoksa gerçekçi görünen kartlar üretmek yerine açıklayıcı boş durum gösterilir.
3. Maaş belirtilmemişse alan boş bırakılmaz; `Maaş belirtilmedi` gibi açık bir ifade kullanılır.
4. İş ilanı ve arama filtreleri URL ile paylaşılabilir olmalıdır.
5. Başarısız API çağrıları başarı gibi gösterilmez; kullanıcıya neden ve sonraki adım söylenir.

### Renk ve tipografi

- Birincil metin: `#0f172a`; gövde ikincil metin: `#475569`; yüzey: `#ffffff`; arka plan: `#f8fafc`; çizgi: `#e2e8f0`; odak/aksiyon: `#0369a1`.
- Normal metin için en az 4.5:1, büyük metin ve UI sınırları için en az 3:1 kontrast.
- Durumlar sadece renk ile anlatılmaz; metin ve ikon birlikte kullanılır.
- Başlıklar ölçülü, gövde metni taranabilir, etiketler cümle düzeninde yazılır.
- Türkçe karakterler ve uzun iş unvanları 375 px genişlikte test edilir.

### Motion ve etkileşim

- Hover/pressed geri bildirimi 150–300 ms, yalnızca `transform`, `opacity`, `box-shadow` ve renk gibi composited özelliklerle yapılır.
- Kart hareketi 2–4 px'i geçmez.
- Arama sonuçlarında uzun stagger animasyonu kullanılmaz; içerik hemen görünür.
- Scroll reveal 8–16 px ve kısa fade ile sınırlıdır.
- `prefers-reduced-motion: reduce` durumunda dekoratif animasyonlar kapanır ve içerik anında görünür.
- Hover temel işlevin tek yolu değildir; dokunmatik cihazlarda her aksiyon erişilebilir kalır.

### Erişilebilirlik ve durumlar

- Semantik `header`, `nav`, `main`, `aside`, `footer` kullanılır.
- Her etkileşimli öğede görünür `:focus-visible` bulunur.
- İkon-only kontroller erişilebilir isim taşır.
- Form alanları placeholder'a bırakılmadan etiketlenir.
- Her interaktif yüzey default, hover, focus, active, disabled, loading, error, success ve empty durumlarını tanımlar.
- Mobil hedefler mümkün olduğunca en az 44 px tutulur.
- Drawer/modal açıldığında klavye odağı yönetilir ve kapatılınca geri yüklenir.

### Responsive kalite kapısı

375, 768, 1024 ve 1440 px genişliklerde yatay taşma olmamalıdır. Mobilde filtreler etiketli drawer/sheet olarak açılır; masaüstü düzeni yalnızca küçültülmez, yeniden akıtılır. `100dvh`, safe-area ve sabit header çakışmaları dikkate alınır.

## Proje eşlemesi

- Tasarım token kaynağı: `lib/tasarim/tasarim-tokenlari.json`
- Global motion, odak ve yüzey sınıfları: `app/globals.css`
- Ortak navigasyon: `bilesenler/genel/UstGezinmeCubugu.tsx`
- Gerçek ilan modeli ve filtre sözleşmesi: `lib/veri/ilan-tipi.ts`
- İlan filtreleme servisi: `lib/servisler/ilan-servisi.ts`
- Arama yüzeyi: `app/[yerel]/ilan-ara/page.tsx`
- Ana sayfa: `app/[yerel]/page.tsx`

## Uygulama notu

Ana sayfa, veri kaynağı boşken sahte ilan/şirket/sayı göstermek yerine açıklayıcı boş durum kullanır. Gerçek Supabase ilan sorgusu bağlandığında yalnızca aynı `Ilan` tipinden dönen kayıtlar kartlara aktarılmalıdır; görsel katman veri uydurmamalıdır.
