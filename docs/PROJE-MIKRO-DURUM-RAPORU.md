# İşBulKKTC — Mikro Teknik Durum Raporu

**Rapor tarihi:** 28.09.2026 14:19 (+03:00)  
**Rapor amacı:** Cursor, OpenCode ve Cline tarafından doğrudan uygulanabilir; dosya, sembol, veri sözleşmesi, hata davranışı ve doğrulama seviyesini birlikte gösteren teknik envanter.  
**Kapsam:** Frontend, backend/API, Supabase şeması ve RLS, authentication, ilan arama/detay, aday başvuru/CV, işveren akışı, ödeme, i18n, SEO, CI/CD, test, gözlemlenebilirlik, ajan koordinasyonu ve release hazırlığı.

> Bu belge “proje tamamlandı” iddiası taşımaz. Kod derleme kapısı yeşildir; gerçek Supabase/Turnstile/payment ortamında uçtan uca üretim doğrulaması henüz tamamlanmamıştır.

## 1. Kanıt standardı ve durum sözlüğü

| Durum | Anlam |
|---|---|
| `TAM` | Kod/şema mevcut ve ilgili statik kalite kapısı geçmiştir. Uçtan uca üretim kanıtı ayrıca aranır. |
| `KISMİ` | Ana iskelet vardır; bir veya daha fazla gerçek entegrasyon, UX, test veya operasyon parçası eksiktir. |
| `BLOKE` | Gerekli ortam, credential, migration uygulaması veya dış servis kanıtı olmadan güvenilir biçimde doğrulanamaz. |
| `RİSKLİ` | Kod çalışabilir; fakat güvenlik, veri tutarlılığı, performans, içerik doğruluğu veya bakım açısından borç taşır. |
| `PLANLI` | Kodda henüz yoktur veya ürün kararı/harici entegrasyon bekler. |

## 2. Projenin gerçek teknoloji haritası

### 2.1 Runtime ve framework

| Katman | Kullanılan teknoloji | Durum | Kaynak |
|---|---|---|---|
| Web framework | Next.js 14.2.15 App Router | `TAM` | [`package.json`](../package.json), [`app/`](../app/) |
| UI runtime | React 18.3.1 | `TAM` | [`package.json`](../package.json) |
| Dil | TypeScript 5.9.3, `strict: true` | `TAM` | [`tsconfig.json`](../tsconfig.json) |
| Stil | Tailwind CSS 3.4.13 + global CSS | `TAM/KISMİ` | [`tailwind.config.ts`](../tailwind.config.ts), [`app/globals.css`](../app/globals.css) |
| Form | React Hook Form + Zod resolver | `TAM` | [`bilesenler/formlar/`](../bilesenler/formlar/), [`lib/veri/`](../lib/veri/) |
| i18n | next-intl; `tr`, `en`, `ru`, `he` | `TAM/KISMİ` | [`i18n/`](../i18n/), [`app/[yerel]/layout.tsx`](../app/%5Byerel%5D/layout.tsx) |
| Backend client | `@supabase/ssr`, `@supabase/supabase-js` | `TAM/BLOKE` | [`lib/supabase/`](../lib/supabase/) |
| Bot koruması | Cloudflare Turnstile | `KISMİ/BLOKE` | [`lib/guvenlik/turnstile.ts`](../lib/guvenlik/turnstile.ts) |
| İkon | Material Symbols ve `.msimge` sınıfı | `TAM` | [`bilesenler/genel/`](../bilesenler/genel/) |
| Container | Next standalone output + Docker | `KISMİ` | [`next.config.mjs`](../next.config.mjs), [`Dockerfile`](../Dockerfile) |
| CI | GitHub Actions type-check/lint/build | `TAM/KISMİ` | [`.github/workflows/kalite.yml`](../.github/workflows/kalite.yml) |

### 2.2 Bağımlılık politikası

- Yeni bağımlılık eklenmemeli; mevcut `package-lock.json` kaynak gerçekliğidir.
- Yeni ikon kütüphanesi eklenmemeli; Material Symbols kullanılmalı.
- `any` kullanılmamalı. Bilinmeyen dış veri önce Zod veya açık type guard ile doğrulanmalı.
- Uygulama metni bileşen içinde sabitlenmemeli; dört locale dosyası birlikte güncellenmeli.
- Yeni ortam değişkeni eklenirse [`.env.example`](../.env.example) aynı değişiklikte güncellenmeli.

## 3. Repository yapısı ve dosya sorumlulukları

### 3.1 Uygulama katmanları

- [`app/`](../app/): route, page, layout, API route, metadata, sitemap, robots.
- [`bilesenler/`](../bilesenler/): client/server UI bileşenleri.
- [`lib/veri/`](../lib/veri/): Zod şemaları ve veri tipleri.
- [`lib/depolar/`](../lib/depolar/): Supabase sorgu/depo katmanı.
- [`lib/servisler/`](../lib/servisler/): iş akışı ve domain servisleri.
- [`lib/guvenlik/`](../lib/guvenlik/): auth/role/Turnstile.
- [`lib/supabase/`](../lib/supabase/): server/browser client üretimi.
- [`lib/ortam/`](../lib/ortam/): environment doğrulama ve geliştirme fallback’leri.
- [`supabase/migrations/`](../supabase/migrations/): sıralı şema, RLS, trigger, RPC, index.
- [`i18n/mesajlar/`](../i18n/mesajlar/): dört dil mesaj sözleşmesi.
- [`tools/`](../tools/): çakışma kontrolü, orchestrator, OpenCode/Cline adaptörleri.
- [`.agents/orchestrator/`](../.agents/orchestrator/): makine-okunur task/evidence/state.

### 3.2 Ajan sahipliği

- Uygulama dosyalarının tek yazarı: OpenCode.
- `docs/`, `tools/`, `.github/`, `AGENTS.md`, pano ve orchestrator kalite dosyalarının sahibi: Copilot Chief.
- Cline: salt okunur review.
- Commit sahibi: Copilot Chief.
- Bu düzen [AGENTS.md](../AGENTS.md) ve [AJAN-KOORDINASYON.md](./AJAN-KOORDINASYON.md) ile bağlayıcıdır.

## 4. Route envanteri

### 4.1 Yerelleştirilmiş public sayfalar

| Route | Kaynak | Durum | Not |
|---|---|---|---|
| `/{yerel}` | [`app/[yerel]/page.tsx`](../app/%5Byerel%5D/page.tsx) | `TAM/KISMİ` | Ana arama, sektörler, CTA ve ilan/şirket özetleri. Bazı istatistik/metinler veri kaynağı gerektiriyor. |
| `/{yerel}/ilan-ara` | [`app/[yerel]/ilan-ara/page.tsx`](../app/%5Byerel%5D/ilan-ara/page.tsx) | `KISMİ` | Filtre UI ve API bağlantısı var; gerçek DB key/RLS ile smoke test eksik. |
| `/{yerel}/ilan/{slug}` | [`app/[yerel]/ilan/[slug]/page.tsx`](../app/%5Byerel%5D/ilan/%5Bslug%5D/page.tsx) | `KISMİ` | Demo ve canlı DB dalları var; demo iddialarının önemli kısmı temizlendi. |
| `/{yerel}/sirketler` | [`app/[yerel]/sirketler/page.tsx`](../app/%5Byerel%5D/sirketler/page.tsx) | `KISMİ` | `force-dynamic` ile build-time Supabase erişiminden ayrıldı; runtime doğrulama yok. |
| `/{yerel}/sirket/{slug}` | [`app/[yerel]/sirket/[slug]/page.tsx`](../app/%5Byerel%5D/sirket/%5Bslug%5D/page.tsx) | `KISMİ` | Canlı şirket sorgusu var; logo/image ve DB/RLS doğrulaması eksik. |
| `/{yerel}/giris` | [`app/[yerel]/giris/page.tsx`](../app/%5Byerel%5D/giris/page.tsx) | `KISMİ/BLOKE` | Form ve hata görünürlüğü var; gerçek auth ortamı yok. |
| `/{yerel}/aday-profilim` | [`app/[yerel]/aday-profilim/page.tsx`](../app/%5Byerel%5D/aday-profilim/page.tsx) | `KISMİ` | Korunan aday alanı; gerçek kullanıcı ile test edilmedi. |
| `/{yerel}/aday/masam` | [`app/[yerel]/aday/masam/page.tsx`](../app/%5Byerel%5D/aday/masam/page.tsx) | `KISMİ` | Başvuru, kayıtlı ilan, bildirim ve CV yönetimi için temel alan. |
| `/{yerel}/isveren/sirket-kaydi` | [`app/[yerel]/isveren/sirket-kaydi/page.tsx`](../app/%5Byerel%5D/isveren/sirket-kaydi/page.tsx) | `KISMİ` | Şirket oluşturma/provisioning mevcut; gerçek employer account ile test yok. |
| `/{yerel}/isveren/sirketim` | [`app/[yerel]/isveren/sirketim/page.tsx`](../app/%5Byerel%5D/isveren/sirketim/page.tsx) | `KISMİ` | Üyelik yetkisi ve şirket düzenleme akışı mevcut. |
| `/{yerel}/isveren/panel` | [`app/[yerel]/isveren/panel/page.tsx`](../app/%5Byerel%5D/isveren/panel/page.tsx) | `KISMİ` | Dashboard sorguları var; production veri sözleşmesiyle test yok. |
| `/{yerel}/isveren/yeni-ilan` | [`app/[yerel]/isveren/yeni-ilan/page.tsx`](../app/%5Byerel%5D/isveren/yeni-ilan/page.tsx) | `KISMİ` | Dört adımlı form var; publish/payment/verification tamamı staging’de kanıtlanmadı. |
| `/{yerel}/ilan-paketleri` | [`app/[yerel]/ilan-paketleri/page.tsx`](../app/%5Byerel%5D/ilan-paketleri/page.tsx) | `KISMİ` | Paket UI var; gerçek ödeme provider testi yok. |
| `/{yerel}/freelance` | [`app/[yerel]/freelance/page.tsx`](../app/%5Byerel%5D/freelance/page.tsx) | `KISMİ` | UI/seed yaklaşımı; canlı freelance domain sözleşmesi ayrı doğrulanmalı. |
| Bilgilendirme sayfaları | [`app/[yerel]/kvk/`](../app/%5Byerel%5D/kvk/), [`is-yasasi-md-59/`](../app/%5Byerel%5D/is-yasasi-md-59/), [`pes-lisans/`](../app/%5Byerel%5D/pes-lisans/) | `KISMİ` | Hukuki metinlerin kaynak/versiyon sahipliği netleştirilmeli. |

### 4.2 Koruma middleware’i

[`middleware.ts`](../middleware.ts):

1. next-intl locale middleware çalıştırır.
2. `aday-profilim`, `aday/masam`, `isveren/yeni-ilan`, `isveren/panel`, `isveren/sirketim` yollarını korur.
3. Supabase env yoksa korunan route’u locale girişine yönlendirir.
4. `getUser()` ile session doğrular.
5. `profiles.account_status` `suspended` veya `deleted` ise girişe `auth_error=account_disabled` ile yönlendirir.

**Eksik/risk:** Middleware yalnız `process.env` değerlerinin varlığını kontrol eder; [`lib/ortam/ortam.ts`](../lib/ortam/ortam.ts) içindeki placeholder/redaction doğrulamasıyla ortaklaştırılmalı. `redirect` parametresi callback ve login sonrası güvenli allowlist ile sınırlandırılmalıdır.

## 5. API envanteri: sözleşme ve hata davranışı

| Endpoint | Girdi doğrulama | Yetki | Veri işlemi | Durum |
|---|---|---|---|---|
| `GET /api/hazirlik` | Env boolean kontrolü | Yok | Yok | `TAM/KISMİ`; gerçek ortam yok |
| `POST /api/auth/password-reset` | Zod email | Supabase server client | Auth reset mail | `TAM/KISMİ`; dış servis test yok |
| `POST /api/auth/logout` | Cookie/session | Auth | Sign out | `KISMİ`; gerçek session test yok |
| `GET /api/ilanlar` | Zod query, maaş aralık guard | Public | `job_posts` search | `TAM/KISMİ` |
| `GET /api/ilanlar/{slug}` | Slug guard/depo | Public | Active/published job | `TAM/KISMİ` |
| `POST /api/basvurular` | JSON guard + Turnstile + `BASVURU_SEMA` | Candidate | Application insert | `TAM/KISMİ`; staging yok |
| `POST /api/aday/cv` | Form/file guard | Candidate | Private storage + cv metadata | `KISMİ`; file E2E yok |
| `POST /api/turnstile/verify` | Token | Public + remote verify | Cloudflare | `KISMİ/BLOKE` |
| `POST /api/odeme/checkout` | Paket/order guard | Employer/auth | Order/payment state | `KISMİ/BLOKE` |
| `POST /api/odeme/webhook` | HMAC/secret format | Webhook secret | Idempotent payment lifecycle | `KISMİ/BLOKE` |
| `GET/POST /api/bildirim-tercihleri` | Auth/data guard | Auth | Preferences | `KISMİ` |
| `POST /api/destek/ticket` | Auth/body guard | Auth | Support ticket | `KISMİ` |
| `GET/POST /api/yonetim` | Admin guard | Admin | Moderation/audit | `KISMİ` |

### 5.1 API ortak güçlü yönleri

- [`lib/api/yanit.ts`](../lib/api/yanit.ts) ile hata/başarı yanıtları standartlaştırılmış.
- [`lib/sunucu/loglama.ts`](../lib/sunucu/loglama.ts) ile request context ve hata logları kullanılıyor.
- İlan arama query’leri Zod ile sınırlandırılıyor: metin uzunluğu, sayfa, maaş ve para birimi.
- Başvuruda ilan aktiflik/süre, aday rolü, CV sahipliği ve duplicate unique constraint ele alınıyor.
- `application_count` client tarafından `count + 1` yapılmıyor; DB trigger ile atomik tutuluyor.

### 5.2 API eksikleri

- Her endpoint için otomatik sözleşme testi yok.
- Rate limit yalnız bazı dış mekanizmalara/servis davranışlarına bırakılmış; auth, reset, support ve search için uygulama seviyesinde limit kanıtı yok.
- API mesajlarının bir kısmı route içinde hardcoded; backend hata kodu ile locale mesaj kodu ayrıştırılmalı.
- Supabase hata detayları kullanıcıya sızdırılmıyor; fakat merkezi error tracking/alerting eksik.
- `request.json()` başarısızlığında bazı endpoint’ler genel hataya düşüyor; tüm endpoint’lerde aynı 400 sözleşmesi kullanılmalı.

## 6. Authentication mikro analizi

### 6.1 Browser auth

[`bilesenler/formlar/GirisKayitSekmeleri.tsx`](../bilesenler/formlar/GirisKayitSekmeleri.tsx):

- Aday ve işveren sekmeleri.
- Login ve kayıt modları.
- E-posta biçim kontrolü.
- Aday ve işveren Zod kayıt şemaları.
- `gonderiliyorRef` ile duplicate submission engeli.
- Login/signup Supabase hatalarını görünür UI alert’e çevirme.
- Network/config hatası için ayrı kullanıcı mesajı.
- Password reset için fetch rejection yakalama.
- Google/e-Devlet butonları **etkin değildir**; disabled görünür ve locale notuyla açıklanır.
- Aday kayıt butonu Turnstile token yoksa disabled olur.

### 6.2 Auth riskleri

1. Gerçek anon key yok; login/signup başarı kanıtı yok.
2. Turnstile site key yok; kayıt butonu kullanıcı tarafından “bozuk” algılanabilir.
3. Bazı form etiketleri/onay açıklamaları hardcoded.
4. Giriş sayfasında kaynaklandırılmamış hukuk ve operasyon iddiaları var.
5. Auth hata metinleri mod bilgisine göre çevriliyor; Supabase provider error kodları daha kararlı map’lenmeli.
6. Şifre reset redirect’i sabit `/tr/giris` içeriyor; aktif locale ve güvenli `next` sözleşmesiyle birleştirilmeli.

## 7. Supabase veri modeli

14 migration mevcut:

1. marketplace başlangıç şeması,
2. production domain foundation,
3. auth/RBAC guard,
4. billing idempotency,
5. employer signup provisioning,
6. membership/RLS consistency,
7. database hardening/seeds,
8. application lifecycle RPC,
9. auth account controls,
10. candidate storage/RLS,
11. employer verification/dashboard,
12. billing lifecycle,
13. search indexes,
14. atomic application submission.

Ana tablolar:

- `profiles`
- `companies`
- `company_members`
- `candidate_profiles`
- `job_posts`
- `job_skills`
- `job_locations`
- `applications`
- `saved_jobs`
- `cv_documents`
- `notifications`
- `notification_preferences`
- `packages`
- `orders`
- `invoices`
- `subscriptions`
- `payment_events`
- `moderation_cases`
- `reports`
- `audit_logs`

### 7.1 RLS ve rol modeli

- Platform rolleri: `candidate`, `employer`, `admin`; uygulama tarafı `super_admin` değerini de tanıyor, DB enum ile uyumu ayrıca doğrulanmalı.
- Auth user oluşturulunca `handle_new_user()` profil açıyor.
- `prevent_profile_role_escalation()` self-service admin yükseltmesini engelliyor.
- Company member rolleri: `owner`, `recruiter`, `viewer`.
- CV bucket private; dosya yolu ilk klasöründe `auth.uid()` zorunlu.
- Başvuru insert yalnız active candidate ve aktif/süresi dolmamış ilan için.
- Başvuru sayacı insert/delete trigger’ıyla atomik.

### 7.2 DB doğrulanması gereken noktalar

- Repo migration’ları bağlı Supabase projesine gerçekten uygulanmış mı bilinmiyor.
- `profiles.account_status` ve diğer sonradan eklenen alanların tüm ortamlarda mevcut olduğu kanıtlanmalı.
- `job_posts` public select politikası ve şirket ilişkilerinin anon/auth davranışı staging’de test edilmeli.
- `service_role` yalnız server tarafında kullanılmalı; browser bundle’a girmemeli.
- RPC’lerin `SECURITY DEFINER`, `search_path`, execute grant ve input doğrulaması denetlenmeli.
- Seed verisinin demo olduğu UI’da açıkça ayrıştırılmalı.

## 8. İlan arama ve ilan detay akışı

### 8.1 Arama

[`lib/depolar/ilan-arama-deposu.ts`](../lib/depolar/ilan-arama-deposu.ts):

- `status = active`.
- `published_at IS NOT NULL`.
- `expires_at IS NULL OR expires_at > now`.
- text search için temizleme ve `websearch`.
- konum için wildcard karakter temizleme.
- maaş alt/üst sınırı.
- para birimi üç harfli kod.
- remote/hybrid filtre.
- featured/yayın günü/sıralama.
- response `unknown` kabul edilip array + Zod schema ile parse ediliyor.
- sorgu response array değilse veya satır şeması uyuşmazsa başarı gibi boş liste dönülmüyor; hata loglanıyor.

**Risk:** Her arama isteği canlı DB’ye gider. İndeks migration’ı mevcut olsa da query planı, pagination maliyeti ve cache politikası ölçülmemiştir.

### 8.2 İlan detay

- Canlı dal aynı görünürlük kurallarını kullanıyor.
- Demo dalı seed veriyle çalışıyor.
- Daha önce kaldırılan doğrulanmamış görüntülenme/başvuru sayısı, ATS, AI eşleşme, B3/acil/maaş garantisi ve izin süreci iddiaları tekrar eklenmemeli.
- Çalışma koşulları ilan kaynaklı alanlardan üretilmeli; izin kategorisi çalışma saat/modeli gibi gösterilmemeli.

## 9. Aday, CV ve başvuru akışı

### 9.1 CV

- Private `candidate-cvs` bucket.
- PDF ve DOCX MIME sınırı.
- 10 MB storage limiti.
- Kullanıcı klasörüyle object policy.
- CV metadata `cv_documents` ile ilişkilendiriliyor.
- Başvuru sırasında gönderilen storage path, authenticated candidate sahipliğiyle yeniden doğrulanıyor.

### 9.2 Başvuru

Akış:

1. Client formu.
2. Turnstile token.
3. `/api/basvurular`.
4. Body/object doğrulaması.
5. Turnstile remote verify.
6. `BASVURU_SEMA`.
7. candidate auth/role/account status.
8. ilan active/expiry.
9. CV path candidate ownership.
10. `applications` insert.
11. unique duplicate → 409.
12. DB trigger → `job_posts.application_count`.

**Eksikler:**

- Gerçek candidate kullanıcı ile E2E kanıt yok.
- CV parse/ATS işleminin production worker/queue davranışı yok.
- Başvuru status transition’larının UI ve notification testleri eksik.
- Kullanıcıya gösterilen bazı başvuru metinleri locale dışı veya route içinde sabit.

## 10. İşveren ve ilan yayınlama akışı

- Employer signup metadata gönderir; DB trigger rolü güvenli şekilde normalize eder.
- Şirket provisioning migration’ı mevcut.
- Company membership üzerinden sahip/recruiter/viewer kontrolü var.
- Dört adımlı ilan formu temel alan, iş tanımı, koşullar ve doğrulama/publish adımlarını içerir.
- Dashboard şirket, ilan ve başvuru sayıları sorgular.

**Eksikler:**

- Gerçek employer signup → company → publish → public listing zinciri staging’de doğrulanmamış.
- Company verification/moderation kararının UI’dan DB’ye tam lifecycle kanıtı eksik.
- Paket/ödeme gerektiren publish koşullarının tüm hata/geri alma senaryoları test edilmemiş.
- `company_members` erişimi ile `profiles.role` erişimi arasında her route için aynı politika kullanıldığı yeniden denetlenmeli.

## 11. Ödeme ve billing

Mevcut yüzeyler:

- Paket listesi.
- Checkout order oluşturma.
- Payment event kaydı.
- Webhook secret format kontrolü.
- Idempotency migration’ı.
- Orders/invoices/subscriptions lifecycle.

**BLOKE/eksik:**

- Gerçek provider hesabı ve staging webhook endpoint’i doğrulanmadı.
- Signature replay, duplicate event, out-of-order event ve refund senaryoları E2E test edilmedi.
- Webhook retry/dead-letter/alerting prosedürü repo içinde kanıtlanmıyor.
- Payment UI’nın başarısız provider yanıtlarında kullanıcı deneyimi test edilmedi.

## 12. i18n ve içerik kalitesi

### Tamamlanan

- `tr`, `en`, `ru`, `he` mesaj dosyaları mevcut.
- Hebrew RTL layout desteği var.
- Header auth hata mesajları ve yeni auth hata anahtarları dört dile işlendi.

### Tespit edilen borç

- Login sayfasında bazı başlık/açıklamalar doğrudan Türkçe yazılmış.
- Giriş formunda şirket, hukuki beyan ve onay açıklamalarının bir bölümü sabit.
- Placeholder’ların bir bölümü locale’da, bir bölümü component içinde.
- JSON anahtarlarının dört dosyada eşitliği otomatik test edilmiyor.
- Hukuki/kurumsal iddialar kaynaklandırılmadan pazarlama metni gibi duruyor.

**Kabul kriteri:** Her yeni görünen metin dört locale dosyasında aynı anahtar yapısıyla bulunmalı; key parity script/test eklenmeli.

## 13. Frontend UX ve görsel riskler

- Ortak button abstraction [`bilesenler/genel/Buton.tsx`](../bilesenler/genel/Buton.tsx) native button ve Next Link ayrımını yapıyor.
- Loading state disabled ve pointer-events davranışı var.
- Form alert’leri `role="alert"`/`role="status"` kullanıyor.
- Header’da Supabase auth hatası kullanıcıya gösteriliyor.
- Mobil 375px taşma için önceki manuel doğrulama kanıtı var; kalıcı otomatik viewport testi yok.
- Disabled provider butonları bilinçli; etkin özellik gibi gösterilmemeli.
- Görsel sorunların bir bölümü backend değil, eksik env nedeniyle client exception/empty state olarak ortaya çıkabilir.
- Native `<img>` uyarıları şirket sayfalarında var; `next/image` geçişi remotePatterns ve boyut sözleşmesiyle yapılmalı.
- Material Symbols font yükleme/performance ve fallback davranışı gerçek production build’de ölçülmeli.

## 14. SEO ve runtime rendering

- Locale layout metadata, canonical, alternate language, Open Graph, Twitter ve robots bilgilerini üretiyor.
- `generateStaticParams` dört locale üretir.
- Sitemap bir saat revalidate ile çalışır.
- İlan/company canlı veri sayfaları dynamic olabilir.
- `/sirketler` build-time Supabase erişimini önlemek için force-dynamic yapılmıştır.

**Riskler:**

- Dynamic route gerçek Supabase yokken runtime’da 503/empty state verebilir.
- JSON-LD yalnız gerçek veri alanlarından üretilmeli; demo/veri iddiası schema’ya taşınmamalı.
- `next/image` uyarıları ve remote domain kapsamı tamamlanmalı.
- Canonical domain env fallback’i üretimde doğru domain ile doğrulanmalı.

## 15. CI/CD ve release durumu

### Başarılı kontroller

- `npm run type-check`: başarılı.
- `npm run lint`: başarılı.
- `npm run kalite`: başarılı.
- `git diff --check`: başarılı.
- Önceki görevlerde `npm run build`: başarılı kanıtları var.

### CI riskleri

- [`kalite.yml`](../.github/workflows/kalite.yml) build için güvenli placeholder env kullanır; entegrasyon testi değildir.
- [`docker.yml`](../.github/workflows/docker.yml) `main`/`production` dallarına bağlı; çalışma dalı `master` ise otomatik image release çalışmayabilir.
- Docker workflow’unda Trivy `@master` ile pinlenmemiştir.
- Migration apply/rollback workflow’u görünür değildir.
- Production deploy sonrası health check/integration smoke workflow’u yoktur.
- Dependency/security scanning için ayrı güvence sınırlıdır.

## 16. Test envanteri ve açık test matrisi

### Mevcut

- TypeScript compiler.
- Next lint.
- OpenCode adapter testleri: [`tools/opencode-adapter.test.mjs`](../tools/opencode-adapter.test.mjs).
- Cline adapter testleri: [`tools/cline-adapter.test.mjs`](../tools/cline-adapter.test.mjs).
- Önceki manuel HTTP/browser smoke çalışmaları.

### Eksik

- Login/signup/reset/logout E2E.
- Protected route redirect E2E.
- Turnstile success/failure/config E2E.
- CV upload MIME/size/ownership E2E.
- Duplicate application and expiry E2E.
- Employer company/member/publish E2E.
- Payment checkout/webhook/idempotency E2E.
- Locale key parity.
- RTL and 375px responsive regression.
- API contract tests.

### Minimum release test matrisi

| Senaryo | Beklenen |
|---|---|
| Geçersiz env ile public sayfa | Application error değil, erişilebilir kontrollü durum |
| Geçersiz env ile protected route | Locale login redirect |
| Yanlış parola | Localized alert, loading kapanır |
| E-posta doğrulanmamış | Localized guidance |
| Rate limit | 429 mesajı |
| Kayıt + Turnstile yok | Disabled açıklaması; sessiz başarısızlık yok |
| CV yanlış kullanıcı path’i | 400/403; dosya sızıntısı yok |
| Süresi geçmiş ilan başvurusu | 409 |
| Duplicate başvuru | 409 |
| Webhook duplicate | Tek lifecycle etkisi |
| Hebrew | RTL, taşma yok |
| Mobil 375px | Yatay scroll yok |

## 17. P0/P1/P2 görev listesi

### P0 — Gerçek çalışma kanıtı

1. Staging Supabase URL ve anon/publishable key’i yerel/CI secret olarak kur.
2. Service role ve payment/Turnstile secret’larını yalnız server secret store’da tut.
3. `/api/hazirlik` production `ready` kanıtı al.
4. Test kullanıcılarıyla auth/CV/başvuru smoke testi.
5. Migration’ların staging’e uygulandığını ve schema version’ı doğrula.
6. Auth çalışma ağacı değişikliklerini review + kalite + build sonrası commit et.

### P1 — Ürün tamamlığı

1. Login sayfasındaki doğrulanmamış hukuk/sayı/SLA metinlerini kaynağa bağla veya nötrleştir.
2. Hardcoded form metinlerini dört locale’a taşı.
3. Locale key parity testi ekle.
4. `yetki.ts` profil verisini Zod/type guard ile doğrula.
5. Middleware env doğrulamasını ortak helper’a taşı.
6. Aday ve işveren E2E akışlarını ekle.
7. OAuth yapılacaksa Google/e-Devlet’i ayrı kapsam olarak uygula; aksi halde disabled kalmalıdır.

### P2 — Operasyon ve ölçek

1. Docker branch politikasını `master`/release stratejisiyle eşleştir.
2. Trivy action’ı sabit sürüme/commit’e pinle.
3. Migration deploy/rollback pipeline ekle.
4. Webhook alert/replay ve merkezi error tracking ekle.
5. Search query planı, pagination ve cache ölçümü yap.
6. Responsive/RTL screenshot smoke testleri ekle.
7. `next/image` ve remote asset politikasını tamamla.

## 18. Cursor için uygulama talimatı

Bir sonraki ajan görevi aşağıdaki biçimde açılmalı:

```md
# Görev: [tek amaç]

## Sahiplik
- Uygulama yazarı: OpenCode
- Review: Cline, salt okunur
- Chief: Copilot

## İzinli dosyalar
- [tam göreli yol 1]
- [tam göreli yol 2]

## Değiştirilmeyecekler
- .env.local / .env.production
- görev kapsamı dışındaki uygulama dosyaları
- gerçek secret değerleri

## Kök neden
[tek cümle]

## Kabul kriterleri
- [ölçülebilir kriter]
- [hata davranışı]
- [i18n/erişilebilirlik kriteri]

## Doğrulama
npm run type-check
npm run lint
npm run build
git diff --check
```

Cursor/OpenCode şu sırayı izlemeli:

1. Önce mevcut dosyayı ve çağrı zincirini oku.
2. Şema veya migration değişikliği gerekiyorsa önce onu yap.
3. Depo/servis/API sözleşmesini güncelle.
4. Client UI’ı güncelle.
5. Dört locale dosyasını eşleştir.
6. Hata ve loading durumlarını açıkça göster.
7. Hedefli kalite kapısını çalıştır.
8. Cline review için değişen dosya, test sonucu ve kalan riski handoff et.
9. Son build ve diff-check sonrası Chief commit etsin.

## 19. Son hüküm

İşBulKKTC şu anda:

- **Mimari:** iyi temellendirilmiş.
- **Type safety:** güçlü; kalite kapısı yeşil.
- **Supabase/RLS:** kapsamlı migration temeli mevcut.
- **Frontend:** geniş route ve bileşen kapsamı var; içerik/i18n borcu sürüyor.
- **Backend/API:** temel iş akışları mevcut; gerçek servis kanıtı eksik.
- **Auth:** kod seviyesi hata görünürlüğü iyileştirilmiş; gerçek credential olmadan BLOKE.
- **Ödeme:** iskelet ve idempotency var; provider/staging kanıtı yok.
- **Test:** ajan altyapı testleri var; ürün E2E testleri eksik.
- **CI:** type-check/lint/build var; gerçek integration/deploy/migration gate eksik.
- **Üretim durumu:** `build-ready`, fakat `production-ready` değil.

En doğru sonraki tek iş: gerçek secret değerlerini sohbete koymadan staging Supabase/Turnstile yapılandırmasını kurmak, ardından auth → CV → başvuru → işveren ilanı → ödeme zincirini test kullanıcılarıyla ölçülebilir biçimde doğrulamaktır.

---

# 20. Mikro bulgu kayıtları

Bu bölüm, Cursor’un doğrudan issue/task üretmesi için hazırlanmış atomik bulgu kayıtlarıdır. Her kayıt tek bir kök nedene odaklanır; “düzeltildi” sayılabilmesi için belirtilen dosya, davranış ve test birlikte doğrulanmalıdır.

## 20.1 Ortam ve başlangıç

### ENV-001 — Gerçek backend yapılandırması yok

- **Dosya zinciri:** [`lib/ortam/ortam.ts`](../lib/ortam/ortam.ts) → [`lib/supabase/tarayici-istemci.ts`](../lib/supabase/tarayici-istemci.ts) → [`app/api/hazirlik/route.ts`](../app/api/hazirlik/route.ts)
- **Mevcut davranış:** Geliştirmede placeholder URL/anahtar fallback’i, production’da `OrtamYapilandirmaHatasi`.
- **Kanıt:** `.env.local` ve `.env.production` içinde kritik Supabase, Turnstile ve payment değişkenleri mevcut değil; değerler rapora yazılmadı.
- **Kullanıcı etkisi:** Public sayfa açılabilir; login, signup, reset, canlı ilan, CV, başvuru ve ödeme gerçek backend’e ulaşamaz.
- **Yanlış çözüm:** Sohbete key yapıştırmak, placeholder’ı gerçek key gibi kabul etmek veya production’da fallback açmak.
- **Doğru çözüm:** Staging secret store/yerel ignored env; `/api/hazirlik` ile yalnız boolean readiness; secret logging yok.
- **Kabul:** `GET /api/hazirlik` production ortamında `basarili=true`, gerçek test kullanıcılarıyla login ve canlı ilan sorgusu.

### ENV-002 — Middleware ile ortak ortam doğrulaması ayrışmış

- **Dosya:** [`middleware.ts`](../middleware.ts), [`lib/ortam/ortam.ts`](../lib/ortam/ortam.ts)
- **Mevcut davranış:** Middleware yalnız `if (!supabaseUrl || !supabaseAnonKey)` kontrolü yapıyor; ortam helper’ı placeholder/redaction değerlerini ayrıca ele alıyor.
- **Risk:** Boş olmayan fakat geçersiz key ile `createServerClient` çağrısı; protected/public davranışı route’a göre tutarsızlaşabilir.
- **Çözüm:** Middleware’de secret değerini döndürmeyen ortak `supabaseOrtamHazirMi()`/safe validator; geçersiz yapılandırmada protected route fail-closed, public route kontrollü devam.
- **Kabul:** `undefined`, boş, redacted ve placeholder değerleri aynı karar tablosuyla işlenir; browser bundle service role içermez.

## 20.2 Authentication

### AUTH-001 — Login ve kayıt başarı kanıtı yok

- **Dosya:** [`bilesenler/formlar/GirisKayitSekmeleri.tsx`](../bilesenler/formlar/GirisKayitSekmeleri.tsx)
- **Mevcut davranış:** `signInWithPassword`/`signUp` hata yakalama, loading reset ve kullanıcı mesajı mevcut.
- **Eksik kanıt:** Geçerli Supabase anon key ve test hesabı olmadığı için başarı, e-posta doğrulama ve redirect uçtan uca doğrulanmadı.
- **Kabul:** yanlış parola, unconfirmed email, 429, network failure, config failure ve success için ayrı sonuç; her senaryoda loading kapanır.
- **Not:** Google/e-Devlet disabled olması hata değil, tamamlanmamış ürün kapsamıdır. OAuth eklenmeden enabled yapılmamalıdır.

### AUTH-002 — Turnstile olmadan kayıt butonu disabled

- **Dosya:** [`GirisKayitSekmeleri.tsx`](../bilesenler/formlar/GirisKayitSekmeleri.tsx), [`bilesenler/genel/TurnstileBileseni.tsx`](../bilesenler/genel/TurnstileBileseni.tsx)
- **Mevcut davranış:** Kayıtta `!turnstileToken` form submit butonunu disabled yapıyor.
- **Risk:** Token üretilemediğinde kullanıcı neden ilerleyemediğini yeterince açık görmeyebilir.
- **Çözüm:** Disabled durumunu açıklayan locale mesajı; Turnstile loading/error/expired callback’leri; production ve local test key ayrımı.
- **Kabul:** token yok, token expired, remote verify 400/403/503 ve başarı ayrı görünür duruma sahiptir.

### AUTH-003 — Reset redirect locale’a sabitlenmiş

- **Dosya:** [`app/api/auth/password-reset/route.ts`](../app/api/auth/password-reset/route.ts), [`app/auth/callback/route.ts`](../app/auth/callback/route.ts)
- **Mevcut davranış:** Reset `redirectTo` içinde `/auth/callback?next=/tr/giris` kullanıyor.
- **Risk:** EN/RU/HE kullanıcıları TR girişine dönebilir; redirect sözleşmesi request locale ile uyumlu değil.
- **Çözüm:** Locale’i güvenli request path/validated body’den al; `next` allowlist’i koru; dış origin kabul etme.
- **Kabul:** dört locale reset callback’i kendi giriş rotasına döner; açık redirect testi reddedilir.

### AUTH-004 — Auth formunda sabit görünen metin borcu

- **Dosya:** [`GirisKayitSekmeleri.tsx`](../bilesenler/formlar/GirisKayitSekmeleri.tsx), [`app/[yerel]/giris/page.tsx`](../app/%5Byerel%5D/giris/page.tsx)
- **Mevcut örnekler:** şirket/B3/VKN/NACE placeholder’ları, hukuki onay açıklamaları, “7/24”, “2 saat içinde” ve ürün istatistikleri.
- **Risk:** EN/RU/HE ekranında Türkçe metin; kaynaklandırılmamış hukuki/SLA iddiası.
- **Çözüm:** Her görünür metni locale anahtarına taşı; iddia için kaynak/owner/version metadata veya nötr ifade.
- **Kabul:** component içinde kullanıcıya görünen Türkçe literal kalmaz; dört locale key parity geçer.

## 20.3 API ve hata sözleşmesi

### API-001 — Backend hata mesajları locale kodundan ayrılmamış

- **Dosyalar:** [`lib/api/yanit.ts`](../lib/api/yanit.ts), [`app/api/basvurular/route.ts`](../app/api/basvurular/route.ts), [`app/api/ilanlar/route.ts`](../app/api/ilanlar/route.ts)
- **Mevcut davranış:** API bazı yerlerde Türkçe insan mesajı, bazı yerlerde `GECERSIZ_ISTEK`/`SUNUCU_HATASI` kodu döndürüyor.
- **Risk:** Client locale’a göre güvenilir çeviri yapamaz; mesaj değişimi UI sözleşmesini kırabilir.
- **Çözüm:** `code`, `details` ve opsiyonel güvenli default message ayrımı; UI code → locale map.
- **Kabul:** API testleri status + code doğrular; kullanıcı mesajı client locale’dan gelir; Supabase error detail sızmaz.

### API-002 — Başvuru route’unda yazım hatalı hata mesajı

- **Dosya:** [`app/api/basvurular/route.ts`](../app/api/basvurular/route.ts)
- **Mevcut davranış:** Süresi geçmiş ilan dalında “Bu ilanun başvuru süresi dolmuş.” metni bulunuyor.
- **Etki:** Kullanıcıya görünen dil hatası ve kalite algısı düşer.
- **Çözüm:** Mesajı locale/error code sözleşmesine taşıyarak düzelt.
- **Kabul:** expired job testinde doğru Türkçe ve diğer locale karşılığı döner.

### API-003 — Rate limit kapsamı kanıtlanmamış

- **Kapsam:** auth/password reset, support ticket, ilan arama, Turnstile verify, payment webhook.
- **Mevcut kanıt:** Supabase/Cloudflare/provider davranışları var; uygulama seviyesinde ortak rate-limit abstraction ve test matrisi yok.
- **Risk:** Abuse, e-posta reset spam’i, arama maliyeti, ticket spam’i.
- **Çözüm:** Platformun edge/rate-limit özelliğini seç; endpoint bazlı limit, response `Retry-After`, audit event ve test ekle.
- **Kabul:** limit aşıldığında 429, güvenli code ve log correlation id; webhook idempotency rate-limit yerine geçmez.

## 20.4 Yetki ve veri doğrulama

### SEC-001 — Profil role cast ile güveniliyor

- **Dosya:** [`lib/guvenlik/yetki.ts`](../lib/guvenlik/yetki.ts)
- **Mevcut davranış:** DB’den gelen `profil.role` `as PlatformRolu` ile cast ediliyor.
- **Risk:** TypeScript cast runtime validation değildir; beklenmeyen role değeri uygulama kararına girebilir.
- **Çözüm:** `z.enum(["candidate","employer","admin"])` parse; `super_admin` DB enum ile gerçekten uyumlu değilse uygulama tipinden çıkar veya ayrı kontrollü admin claim yapısı kur.
- **Kabul:** unknown/null/uyumsuz role 403 veya güvenli server error; hiçbir bilinmeyen değer yetki vermez.

### SEC-002 — `account_status` sözleşmesi tüm çağrılarda tek tip değil

- **Dosyalar:** [`lib/guvenlik/yetki.ts`](../lib/guvenlik/yetki.ts), [`middleware.ts`](../middleware.ts), auth/RBAC migrations.
- **Mevcut davranış:** Middleware ve server helper suspended/deleted kontrolü yapıyor.
- **Risk:** Bir route yalnız role kontrol edip account status’i atlayabilir.
- **Çözüm:** Tüm protected endpoint’leri `kimlikliKullaniciGetir` veya aynı merkezi guard’dan geçir; raw `getUser()` kullanan route’ları tarayıp kapat.
- **Kabul:** suspended/deleted test kullanıcısı her protected API ve sayfada tutarlı 403/login davranışı alır.

### SEC-003 — Supabase migration uygulanma durumu bilinmiyor

- **Dosyalar:** [`supabase/migrations/`](../supabase/migrations/), [`supabase/config.toml`](../supabase/config.toml)
- **Mevcut durum:** 14 migration repoda; bağlı project’te migration history ve schema diff kanıtı raporda yok.
- **Risk:** Kod son migration’daki `account_status`, `cv_documents`, RLS, RPC veya trigger’a güvenip eski DB ile çalışmayabilir.
- **Çözüm:** Staging `supabase db push`/migration history/schema diff; production için onaylı migration pipeline ve rollback prosedürü.
- **Kabul:** staging schema snapshot beklenen tablo/policy/function/index listesini karşılar.

## 20.5 İlan arama ve veri sözleşmesi

### JOB-001 — Canlı arama runtime bağımlılığı

- **Dosyalar:** [`app/api/ilanlar/route.ts`](../app/api/ilanlar/route.ts), [`lib/depolar/ilan-arama-deposu.ts`](../lib/depolar/ilan-arama-deposu.ts)
- **Mevcut davranış:** Her sorgu canlı `job_posts`; active/published/expiry koşulları; Zod response parse.
- **Güçlü nokta:** Invalid response boş başarıya dönmüyor; log + hata veriyor.
- **Eksik:** Query plan, cache, timeout, pagination upper bound’in gerçek trafik altı kanıtı.
- **Kabul:** 0 kayıt, DB 5xx, malformed row, 120 karakter üstü sorgu, maaş tersliği ve 500. sayfa testleri.

### JOB-002 — Demo/live veri sınırı

- **Dosyalar:** [`lib/depolar/ilan-deposu.ts`](../lib/depolar/ilan-deposu.ts), [`app/[yerel]/ilan/[slug]/page.tsx`](../app/%5Byerel%5D/ilan/%5Bslug%5D/page.tsx), [`bilesenler/ilan/IlanKartı.tsx`](../bilesenler/ilan/IlanKart%C4%B1.tsx)
- **Mevcut durum:** Demo fallback ve canlı DB dalı birlikte bulunuyor; doğrulanmamış metrik/ATS/B3/izin iddialarının önemli kısmı temizlendi.
- **Risk:** Seed/demo kayıtları gerçek doğrulanmış ilan izlenimi verebilir.
- **Çözüm:** `kaynak: demo | database`, görünür demo etiketi ve ortak normalize tip; demo JSON-LD/SEO’ya taşınmamalı.
- **Kabul:** demo kayıt hiçbir gerçek doğrulama/metric/hukuk vaadi göstermiyor; canlı kayıt yalnız DB alanlarından render edilir.

## 20.6 Aday/CV/başvuru

### CAND-001 — Başvuru route’u güçlü fakat E2E’siz

- **Dosya:** [`app/api/basvurular/route.ts`](../app/api/basvurular/route.ts)
- **Mevcut davranış:** Body guard, Turnstile, candidate role, active/expiry, CV owner, unique duplicate, atomic counter.
- **Eksik:** gerçek JWT/session, RLS, storage path, trigger ve notification zinciri birlikte kanıtlanmadı.
- **Kabul:** aday success 201; expired/paused/unknown job 409; wrong role 403; duplicate 409; wrong CV path 400; counter tek artış.

### CAND-002 — CV işleme asenkron sözleşmesi belirsiz

- **Dosyalar:** [`app/api/aday/cv/route.ts`](../app/api/aday/cv/route.ts), [`lib/servisler/cv-isleme-servisi.ts`](../lib/servisler/cv-isleme-servisi.ts), [`bilesenler/cv/ATSCVYonetimKarti.tsx`](../bilesenler/cv/ATSCVYonetimKarti.tsx)
- **Risk:** Upload başarılı olsa bile parse/ATS sonucu, processing status, retry ve kullanıcı mesajı net değil.
- **Çözüm:** `uploaded → processing → ready|failed|deleted` state machine; idempotent job/worker veya açık “manual processing” durumu.
- **Kabul:** MIME/size/path ownership; processing failure UI; tekrar upload aynı belgeyi çoğaltmaz; silinen belge başvuruda kullanılamaz.

## 20.7 İşveren ve ödeme

### EMP-001 — İlan yayınlama birleştirilmiş acceptance testine sahip değil

- **Dosyalar:** [`bilesenler/formlar/IlanVerFormu4Adim.tsx`](../bilesenler/formlar/IlanVerFormu4Adim.tsx), [`lib/servisler/isveren-servisi.ts`](../lib/servisler/isveren-servisi.ts), [`lib/depolar/isveren-deposu.ts`](../lib/depolar/isveren-deposu.ts)
- **Risk:** Form validasyonu başarılı olsa bile company membership, payment, verification, job status ve public görünürlük arasında kopukluk olabilir.
- **Kabul:** employer signup → company → draft → payment/verification → active → public search zinciri tek staging senaryosunda geçer.

### PAY-001 — Ödeme sağlayıcısı gerçek değil/kanıtsız

- **Dosyalar:** [`lib/odemeler/saglayici.ts`](../lib/odemeler/saglayici.ts), [`app/api/odeme/checkout/route.ts`](../app/api/odeme/checkout/route.ts), [`app/api/odeme/webhook/route.ts`](../app/api/odeme/webhook/route.ts)
- **Mevcut durum:** Billing tabloları, order/event/idempotency ve webhook iskeleti mevcut; provider’ın üretim credential/contract kanıtı yok.
- **Risk:** UI ödeme toplamı ile provider charge, currency, tax/KDV, webhook event ve subscription lifecycle birbirinden sapabilir.
- **Çözüm:** Tek provider adapter contract; minor-unit amount; currency whitelist; signed event fixture; replay/out-of-order/refund testleri.
- **Kabul:** checkout güvenli order döndürür; aynı webhook tek etki yapar; sahte/expired signature reddedilir; refund state doğruya döner.

## 20.8 Frontend, erişilebilirlik ve içerik

### UI-001 — Client/server ayrımı genel olarak doğru, fakat manuel görsel kanıt kalıcı değil

- **Dosyalar:** [`app/[yerel]/layout.tsx`](../app/%5Byerel%5D/layout.tsx), [`bilesenler/genel/Buton.tsx`](../bilesenler/genel/Buton.tsx), [`bilesenler/genel/UstGezinmeCubugu.tsx`](../bilesenler/genel/UstGezinmeCubugu.tsx)
- **Mevcut durum:** `role=alert/status`, loading disabled, RTL dir ve skip link var.
- **Eksik:** 375px, keyboard-only, focus visible, reduced motion, RTL ve no-env durumları otomatik regression suite değil.
- **Kabul:** mobil/RTL screenshot veya DOM smoke; tab sırası; disabled reason; error live region.

### UI-002 — Native image uyarıları

- **Dosyalar:** [`app/[yerel]/sirketler/page.tsx`](../app/%5Byerel%5D/sirketler/page.tsx), [`app/[yerel]/sirket/[slug]/page.tsx`](../app/%5Byerel%5D/sirket/%5Bslug%5D/page.tsx), [`next.config.mjs`](../next.config.mjs)
- **Mevcut durum:** Supabase/remote logo için `<img>` kullanımı ve lint önerisi.
- **Çözüm:** `next/image` + güvenli remote pattern + width/height veya fill; bozuk/eksik logo fallback.
- **Kabul:** lint warning yok; CLS ve remote image URL davranışı testli.

### CONTENT-001 — Hukuki ve ticari iddialar kaynak sözleşmesine bağlı değil

- **Dosyalar:** [`app/[yerel]/giris/page.tsx`](../app/%5Byerel%5D/giris/page.tsx), [`i18n/mesajlar/tr.json`](../i18n/mesajlar/tr.json), diğer locale dosyaları.
- **Risk:** B3/PES/KVKK/İş Yasası, çalışan sayısı, SLA ve “doğrulanmış” ifadeleri yanlış veya bağlamsız kullanılabilir.
- **Çözüm:** İddia registry’si: `anahtar`, `kaynak`, `sonDoğrulama`, `sorumlu`, `locale`; kaynaksız iddiayı nötr metne çevir.
- **Kabul:** UI’da kaynaklanmamış sayısal/hukuki/SLA iddiası kalmaz veya açık kaynak linki bulunur.

## 20.9 CI, release ve operasyon

### OPS-001 — Build yeşil, entegrasyon yeşil değil

- **Dosyalar:** [`.github/workflows/kalite.yml`](../.github/workflows/kalite.yml), [`package.json`](../package.json)
- **Mevcut durum:** `type-check`, `lint`, `build`; test script’i yok. CI placeholder env kullanıyor.
- **Yanlış yorum:** CI yeşili gerçek Supabase, Turnstile, payment veya migration’ın çalıştığını kanıtlamaz.
- **Çözüm:** Ayrı staging integration workflow; secret’lar GitHub environment; smoke sonrası health check.
- **Kabul:** quality, integration ve deploy workflow’ları sonuç olarak ayrıdır.

### OPS-002 — Docker branch ve security action sürümü

- **Dosya:** [`.github/workflows/docker.yml`](../.github/workflows/docker.yml)
- **Mevcut durum:** image workflow `main`/`production`; repo HEAD `master`; Trivy `@master`.
- **Risk:** Beklenen branch’te image üretilmemesi; mutable action supply-chain riski.
- **Çözüm:** Release branch politikasını açıkça seç; action sürümlerini immutable tag/SHA ile pinle.
- **Kabul:** test branch/PR/image release tetikleyicileri dokümante ve gerçek run ile kanıtlı.

### OPS-003 — Merkezi hata/olay gözlemlenebilirliği eksik

- **Kapsam:** [`lib/sunucu/loglama.ts`](../lib/sunucu/loglama.ts), [`lib/analitik/olay.ts`](../lib/analitik/olay.ts), payment webhook, auth, başvuru.
- **Mevcut durum:** request context ve bazı DB hataları loglanıyor.
- **Eksik:** merkezi sink, alert threshold, correlation id’nin kullanıcı destek akışına bağlanması, webhook replay dashboard’u.
- **Kabul:** auth failure, 5xx, Turnstile 503, application failure ve payment mismatch için alarm/arama yolu.

## 21. Kanıt matrisi: bugün ne gerçekten kanıtlandı?

| Kanıt | Sonuç | Yorumu |
|---|---|---|
| `npm run type-check` | Başarılı | TypeScript derleme sözleşmesi geçiyor. |
| `npm run lint` | Başarılı | ESLint/Next lint hata vermiyor; ürün davranışını kanıtlamaz. |
| `npm run kalite` | Başarılı | Type-check + lint birleşik kapı. |
| `git diff --check` | Başarılı | Whitespace/diff biçimi temiz. |
| Önceki `npm run build` | Başarılı kanıtları mevcut | Build/runtime env smoke değildir. |
| `/tr/giris` HTTP | Daha önce 200 | Sayfa erişimi auth success değildir. |
| `/api/hazirlik` | Ready değil/development | Kritik gerçek env yok. |
| Supabase auth success | Kanıt yok | Geçerli key/test hesabı yok. |
| CV upload + application | Kanıt yok | DB/storage/RLS E2E yok. |
| Employer publish | Kanıt yok | Company/payment/verification zinciri yok. |
| Payment webhook | Kanıt yok | Provider fixture/staging yok. |
| Cline review | Çoğunlukla timeout | Transcript/verdict yoksa approval denemez. |

## 22. Uygulama sırası: dosya bazlı görev paketleri

### Paket A — Staging ve auth kanıtı

- **Dosyalar:** `.env.local` yalnız yerel; auth route/component ve test fixture dosyaları.
- **Dokunma:** secret’ı repo/docs/log’a yazma.
- **Ön koşul:** Supabase staging, Turnstile test/domain ayarı.
- **Çıkış:** login/signup/reset/logout/protected route test kanıtı.

### Paket B — Locale ve içerik güvenilirliği

- **Dosyalar:** [`app/[yerel]/giris/page.tsx`](../app/%5Byerel%5D/giris/page.tsx), [`bilesenler/formlar/GirisKayitSekmeleri.tsx`](../bilesenler/formlar/GirisKayitSekmeleri.tsx), dört locale JSON.
- **Çıkış:** literal metin yok, key parity geçer, kaynaklanmamış iddia yok.

### Paket C — Yetki ve middleware

- **Dosyalar:** [`lib/guvenlik/yetki.ts`](../lib/guvenlik/yetki.ts), [`middleware.ts`](../middleware.ts), gerekirse yeni Zod schema.
- **Çıkış:** unknown role fail-closed, disabled account tüm protected yüzeylerde tutarlı.

### Paket D — Ürün E2E

- **Dosyalar:** test runner kararı, auth/ilan/CV/başvuru/işveren/ödeme fixture’ları.
- **Çıkış:** minimum release matrisi yeşil; gerçek DB + RLS.

### Paket E — Release operasyonu

- **Dosyalar:** [`.github/workflows/kalite.yml`](../.github/workflows/kalite.yml), [`.github/workflows/docker.yml`](../.github/workflows/docker.yml), migration/deploy workflow.
- **Çıkış:** migration apply, health check, image release ve rollback kanıtı.

## 23. Cursor’a doğrudan verilecek başlangıç prompt’u

```text
Bu repo için yalnızca bir atomik görev uygula.

Önce AGENTS.md ve docs/AJAN-KOORDINASYON.md oku.
Görev kapsamı dışındaki dosyalara dokunma.
Gerçek secret değerlerini okuma, yazma, loglama veya raporlama.
Mevcut kullanıcı değişikliklerini geri alma.

Kök neden:
[tek cümle]

İzinli dosyalar:
[tam yollar]

Beklenen davranış:
[başarı + hata + loading + erişilebilirlik]

Veri sözleşmesi:
[request/response/schema/RLS]

Kabul kriterleri:
[ölçülebilir maddeler]

Doğrulama:
npm run type-check
npm run lint
npm run build
git diff --check

Teslim formatı:
değişen dosyalar, test komutları/sonuçları, kalan riskler, gerçek E2E blokajları.
Commit oluşturma.
```

## 24. Güncellenmiş sonuç

Bu repo “boş prototip” değildir; route, form, auth, Supabase migration, RLS, CV storage, application integrity, billing ve CI temelleri vardır. Fakat şu dört kanıt olmadan bitmiş ürün sayılamaz:

1. Geçerli staging ortamında auth ve DB başarı senaryoları.
2. Aday ve işveren ana akışlarının gerçek E2E testleri.
3. Migration/ödeme/webhook/release operasyonunun kanıtı.
4. Kaynaksız içerik, hardcoded locale metni ve bağımsız review borcunun kapanması.

**Nihai sınıflandırma:** `Mimari foundation: güçlü` · `Statik kalite: yeşil` · `Runtime entegrasyon: bloke/kısmi` · `Ürün E2E: eksik` · `Production readiness: hazır değil`.
