# 🔍 DENETİM RAPORU — İşBulKKTC

**Denetçi:** 🅒 Entegrasyon & Doğrulama katmanı
**Tarih:** 26.09.2026 · **Yöntem:** statik analiz + `git` durumu + dosya değişim zamanı (mtime) korelasyonu

---

## 0. Yönetici Özeti

Repo, **hiç commit'i olmayan** ve **3 ajanın aynı çalışma ağacına eşzamanlı yazdığı** bir durumdaydı. Tek bir yanlış `git` komutu günlerce emeği geri dönüşsüz silebilirdi. Denetim sonunda:

- ✅ İlk baseline commit atıldı → **geri dönüş noktası oluştu** (`97c743c`)
- ✅ Doğrulama kapısı **yeşile döndü**: `tsc` 2 hata → **0**, `lint` 6 hata → **0**
- ✅ 600+ üçüncü parti/hayalet dosya commit dışına alındı
- ⚠️ **Canlı ajan çakışması tespit edildi ve durduruldu** (bkz. §5)
- ⏳ `next build` doğrulaması **build kilidi** bekliyor

---

## 1. 🔴 P0 — Sürüm kontrolü: sıfır güvenlik ağı (ÇÖZÜLDÜ)

| Bulgu | Kanıt | Durum |
|---|---|---|
| Repo'da **0 commit** var | `git rev-parse HEAD` → `fatal: Needed a single revision` · `git rev-list --all --count` → `0` | ✅ İlk commit atıldı |
| 835 dosya yalnızca *staged*; 30 dosya hem staged hem working tree'de değişik (`AM`) | `git status --short` | ✅ Baseline commit |
| `ui-ux-pro-max-skill-main/` `.gitignore`'da ama **600+ dosyası hâlâ index'te** | `git ls-files --cached` | ✅ `git rm -r --cached` |
| `.playwright-mcp/`, `.stitch/`, `stitch_i_bulkktc_design_system_architect/`, `.anima/`, `.trae/`, `.glsld/`, `Optimize Visual Design/` **hiç ignore edilmiyordu** | `git check-ignore -v` → çıktı boş | ✅ `.gitignore`'a eklendi |

**Risk (düzeltilmeden önceki):** Herhangi bir ajanın `git checkout .` / `git reset --hard` çalıştırması → **tüm iş kaybı**. "Kim neyi değiştirdi" sorusu cevaplanamıyordu.

---

## 2. 🟠 P1 — Doğrulama kapısı (ÇÖZÜLDÜ)

### 2.1 TypeScript — 2 hata → 0

| Dosya | Hata |
|---|---|
| `bilesenler/genel/Buton.tsx:55` | `TS2552: Cannot find name 'TemelOzellikleri'` → tip aslında satır 8'de `TemelOzellikler` |
| `bilesenler/cv/ATSCVYonetimKarti.tsx:39` | `TS2339: Property 'company_name' does not exist on type 'never'` → Supabase ilişki tipi `never` çıkıyor |

**🅒 müdahale etmedi**, çünkü mtime analizi bu iki dosyanın **son 4 dakika içinde** değiştiğini gösterdi → diğer ajanlar aktif olarak içindeydi. Nitekim kısa süre sonra iki hata da düzeldi.

### 2.2 ESLint — 6 hata → 0

Kök neden tek ve sistemikti: **`useTranslations` (React Hook) `async` server component içinde çağrılıyordu.**

| Dosya | Satır |
|---|---|
| `app/[yerel]/aday/masam/page.tsx` | 40 |
| `app/[yerel]/aday-profilim/page.tsx` | 30 |
| `app/[yerel]/isveren/panel/page.tsx` | 30 |
| `app/[yerel]/isveren/sirketim/page.tsx` | 32 |
| `app/[yerel]/sirket/[slug]/page.tsx` | 11 |
| `app/[yerel]/sirketler/page.tsx` | 7 |

Doğru kalıp: `import { getTranslations } from "next-intl/server"` + `await getTranslations(...)`. (Projede zaten kullanılıyordu: `i18n/istekYonlendirme.ts`; `next-intl` 3.26.5 kurulu ve bu export mevcut.)

### 2.3 Ek tespit — 4 sayfada `"use client"` eksik

Lint bu kalıbı yakalamıyor (kural yalnızca `async` fonksiyonda tetikleniyor), ancak bu sayfalar **senkron server component** olarak `useTranslations` çağırıyordu → çalışma zamanında kırılır. Hiçbiri `metadata`/`generateStaticParams` export etmiyordu, bu yüzden `"use client"` eklenmesi güvenliydi.

| Dosya |
|---|
| `app/[yerel]/ilan-paketleri/page.tsx` |
| `app/[yerel]/giris/page.tsx` |
| `app/[yerel]/isveren/yeni-ilan/page.tsx` |
| `app/[yerel]/isveren/sirket-kaydi/page.tsx` |

### 2.4 Kalan uyarılar (hata değil)

`app/[yerel]/sirket/[slug]/page.tsx:23` ve `app/[yerel]/sirketler/page.tsx:29` → `<img>` yerine `next/image` önerisi. Karar: logo URL'leri Supabase Storage'dan geldiği için `next.config.mjs`'de `images.remotePatterns` tanımlanmadan `next/image` kullanılamaz. **Karar bekliyor (P3-5).**

---

## 3. 🟡 P2 — Repo hijyeni

| Bulgu | Adet | Durum |
|---|---|---|
| **Derlenmiş JS çıktıları kaynak klasörlerinde** (`dist/`) | 6 klasör / 9 dosya | ⏳ ignore + index temizliği |
| `.github/prompts/` (ui-ux-pro-max skill varlıkları) | yüzlerce dosya | ⏳ **karar bekliyor (P3-2)** — baseline commit'e dahil edilmedi |
| CRLF/LF karışıklığı uyarıları | 30+ dosya | ⏳ `.gitattributes` önerisi (P3-1) |

`dist/` bulunan klasörler: `app/api/turnstile/verify/`, `bilesenler/formlar/`, `bilesenler/genel/`, `lib/servisler/`, `lib/supabase/`, `lib/veri/`

---

## 4. 🟢 Güvenlik denetimi — TEMİZ

| Kontrol | Sonuç |
|---|---|
| `.env.production` izleniyor mu? | ✅ **Hayır** — `git check-ignore` → `.gitignore:36:.env.*` |
| Staged gizli anahtar (service role key, secret) var mı? | ✅ **Yok** |
| `node_modules/` veya `.next/` commit'e girmiş mi? | ✅ **Hayır** (0 dosya) |

---

## 5. ⚠️ CANLI ÇAKIŞMA KAYDI (Collision Log)

**Bu raporun en önemli bölümü.** Üç ajan aynı dosyalara eşzamanlı yazıyordu.

### Ç-1 · `bilesenler/genel/Buton.tsx`, `bilesenler/cv/ATSCVYonetimKarti.tsx`
- **Tespit:** mtime = **4,4 / 3,8 dakika önce** (🅒 düzenleme kararı verirken)
- **🅒 aksiyonu:** **DOKUNMADI** — yalnızca raporladı
- **Sonuç:** Gerçekten de diğer ajanlar o an içerideydi; hatalar onlar tarafından düzeltildi. Çakışma önlendi. ✅

### Ç-2 · i18n `getTranslations` düzeltmesi (6 + 4 dosya)
- **Tespit:** 🅒 düzeltmeyi uygularken 10 dosyanın tamamının **son 1,7 dakika içinde** başka bir süreç tarafından değiştirildiği görüldü. 🅒'nin PowerShell betiği `ATLANDI (0 eşleşme)` döndürdü; 30 saniye sonra dosyalar çoktan değişmişti.
- **Kanıt:** `app/[yerel]/sirketler/page.tsx:7` şu hâle gelmişti:
  ```tsx
  const t = await getTranslations({ locale: params.yerel, namespace: "workspace" });
  ```
  🅒'nin yazdığı sürüm `getTranslations("workspace")` idi → **dosyayı başka bir ajan yeniden ele almış** (fonksiyona `params` ekleyerek daha kapsamlı bir çözüm yazmış).
- **🅒 aksiyonu:** Düzenleme **derhal durduruldu**. Kendi eklediği 4 `"use client"` satırının tutarlılığı doğrulandı (`asyncFn=0` → çakışma yok).
- **Sonuç:** Kod tutarlı ve doğrulama kapısı yeşil. Ancak bu, koordinasyon protokolünün **önleyici** değil **tespit edici** çalıştığını gösteriyor.

### 🅒 Ders çıkarımı → protokol değişikliği
1. **Her düzenlemeden ÖNCE mtime kontrolü zorunlu.** Ajan, dosyanın son 15 dakika içinde değişip değişmediğine bakmadan yazmamalı.
2. **Aynı anda tek yazıcı:** 🅒, çakışma tespit ettiği dosyaların sahipliğini devreder ve **yeniden yazmaz**.
3. **İş bölümü keskinleştirildi:** i18n / server-client sınırı işleri 🅐 ve 🅑'ye; 🅒 yalnızca git/infra/doğrulama/dokümantasyon.

---

## 6. Açık Kararlar

| ID | Karar | Etki | Öneri |
|---|---|---|---|
| P3-1 | `.gitattributes` (`* text=auto eol=lf`) | Orta | ✅ ekle |
| P3-2 | `.github/prompts/` repoda kalacak mı? | Düşük | ❌ ignore et (skill varlığı, uygulama kodu değil) |
| P3-3 | `next build` için ayrı CI/kopya | Yüksek | ✅ CI'da çalıştır |
| P3-4 | Ajanlara ayrı dev portu (3000 / 3001) | Yüksek | ✅ build kilidini gereksiz kılar |
| P3-5 | `<img>` → `next/image` + `remotePatterns` | Düşük | ⏳ sonraki tur |

---

**Sonuç:** Sürüm güvenliği sağlandı, doğrulama kapısı yeşil, çakışma tespit edilip durduruldu.

---

## 7. `next build` DOĞRULAMASI — P0 KAPANDI (🅓, 26.09.2026)

### Yöntem: izole `git worktree` (dev server'a dokunmadan)
Port 3000'de çalışan dev server bozulmasın diye build, `git worktree add --detach` ile açılan
**ayrı bir dizinde** çalıştırıldı; `node_modules` junction ile bağlandı, `.next` yalnızca orada üretildi.
Doğrulama bitince worktree kaldırıldı — **junction önce `rmdir` ile ayrıldı** ve gerçek
`node_modules`'ün sağlam kaldığı doğrulandı (349 klasör).

### Temiz A/B deneyi

| # | Koşul | Çıkış | Gözlem |
|---|---|---|---|
| 1 | Mevcut `.env.local` | ❌ 1 | `OrtamYapilandirmaHatasi: SUPABASE_SERVICE_ROLE_KEY` |
| 2 | Geçerli **formatlı** service-role + anon anahtarı | ❌ 1 | `Error: Doğrulanmış şirketler alınamadı.` |
| 3 | Deney 1 **+ `export const dynamic = "force-dynamic"`** | ✅ 0 | `✓ Generating static pages (109/109)`, hatasız |

### Çıkarım
1. **"Env değişkeni eklemek yeterli" varsayımı YANLIŞ** — Deney 2 bunu kanıtladı; hata env
   katmanından **veri katmanına** kaydı.
2. Kök neden mimari: **statik prerender edilen sayfa build sırasında canlı DB okuyor.**
3. İlk build'de yalnızca **4 rota** kırılıyordu: `/tr,/en,/ru,/he/sirketler` (109 sayfa üretiliyordu).
4. `sirket/[slug]` **henüz** patlamıyor (statik üretilmiyor) — oraya `generateStaticParams`
   eklenirse aynı hata tekrarlar. ⚠️

### 🔎 Yeni bulgu — R-2: hata dayanıklılığı
`lib/depolar/isveren-deposu.ts` hatada **`throw`** ediyor, boş liste döndürmüyor.
`force-dynamic` sonrası geçici bir DB kesintisi **herkese açık şirket dizinini 500'e** çevirir.
**Öneri (🅑):** hata → `[]` + log + sayfada boş-durum. **Karar bekliyor.**

---

## 8. Ortam sözleşmesi boşluğu — R-3 (🅓, ÇÖZÜLDÜ)

`PAYMENT_WEBHOOK_SECRET` **kodda** okunuyor ve `/api/hazirlik` bunu **zorunlu** sayıyor, ancak
`.env.example`'da yoktu. Üstelik **`.env.example` `.gitignore:36` (`.env.*`) tarafından yutuluyordu**
→ **hiçbir commit'te yoktu.** Repoyu klonlayan hiç kimse ortam şablonunu alamıyordu; drift'in kök nedeni.

**Çözüm:** `.gitignore`'a `!.env.example` istisnası + `.env.example` yeniden yazıldı ve versiyona alındı.
3 ölü değişken (`NEXT_PUBLIC_MOBIPAYID_MERCHANT_ID`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
kaldırıldı (kod taraması: 0 kullanım).

---

## 9. CI boşluğu — R-4 (🅓, ÇÖZÜLDÜ)

`docker.yml` yalnızca `main`/`production` dallarında tetikleniyor; depo **`master`** dalında
→ `type-check`/`lint`/`build` CI'da **hiç çalışmadı.** `.github/workflows/kalite.yml` eklendi
(tüm dallar + PR'lar, Docker imajı üretmez).

---

## 10. 🅓 Cline'ın kendi hatası — dürüst kayıt

**Olay:** i18n düzeltmesi sırasında 🅓 ile 🅐 **aynı 6 dosyaya eşzamanlı yazdı.** 🅓 import satırlarını
değiştirdi, çağrı satırlarını değiştirmedi → **3 dosya geçici olarak tanımsız fonksiyon durumundaydı.**
🅐 tamamladı.

**Kök neden:** 🅓, mtime kontrolünü yazmadan **önce** değil **sonra** yaptı.
🅓'nin "kod tutarlı" raporu, 🅐 tamir ettikten sonraki ölçüme dayanıyordu → o an yanıltıcıydı.

**Kabul edilen düzeltme:** Yazmadan önce mtime kontrolü, eşik **2 dakika**. `AGENTS.md` §4'e bağlandı.

---

## 11. SIFIR ÇAKIŞMA MEKANİZMASI (🅓, 26.09.2026) — commit `c22122b`

Kullanıcı talebi: *"çakışma asla olmasın"*. Bu yüzden çakışma **tespit** katmanından **önleme**
katmanına taşındı. Üç mekanik bileşen:

### 11.1 `.ajan-sahiplik.json` — makine-okunur sahiplik haritası
Çekişmenin gerçek kaynağı dürüstçe ilan edildi: **`app/[yerel]/**` ve `bilesenler/**` "ORTAK"**
(sahipsiz). ORTAK alana yazmak için panoda **kilit** açmak zorunlu; kilit doluysa sıra beklenir.
Bunun dışında 🅑 = `lib/**`, `supabase/**`, `app/api/**`; 🅓 = `docs/**`, `tools/**`, `.githooks/**`,
`.github/workflows/**`, `package.json`, `.gitignore`, `.gitattributes`, `.env.example`.
🅐 yazmaz (teşhis + doğrulama).

### 11.2 `tools/cakisma-kontrol.mjs` — yazmadan önce karar
```powershell
npm run cakisma-kontrol -- <yol>     # 🟢 güvenli | 🟡 ORTAK(kilit al) | 🔴 başka ajanın alanı | ⛔ sır
npm run cakisma-kontrol              # son 30 dk'da kim ne yazdı
```
**Doğrulanmış çıktı:**
```
🔴 lib/depolar/isveren-deposu.ts  -> BAŞKA AJANIN ALANI (🅑 OpenCode, lib/depolar/**)
🟡 bilesenler/genel/Buton.tsx     -> ORTAK ALAN — KİLİT AL
⛔ .env.local                     -> ASLA COMMIT EDİLMEZ
```
> Düzeltilen hata: tazelik uyarısı başta **kendi dosyalarımı da** 🔴 işaretliyordu (yanlış pozitif).
> Artık tazelik kontrolü yalnızca kendi alanı dışındaki dosyalara uygulanıyor.

### 11.3 `.githooks/pre-commit` — AKTİF commit kapısı (`core.hooksPath = .githooks`)
| Adım | Davranış |
|---|---|
| `tsc --noEmit` | başarısızsa **commit REDDEDİLİR** |
| `next lint` | başarısızsa **commit REDDEDİLİR** |
| sahiplik denetimi | ihlalde **uyarı basar** (bloklamaz) |

**Kapının blokladığı KANITLANDI** (kasıtlı tip hatası ile):
```
tools/_kapi-testi.ts:1:14 - error TS2322: Type 'string' is not assignable to type 'number'.
[HAYIR] type-check BASARISIZ -> Commit REDDEDILDI.
>>> commit cikis kodu: 1
```
Test dosyası silindi, commit oluşmadı, ağaç temiz kaldı.

### 11.4 Port ayrımı — P3-4 çözümü
`npm run dev` → 3000 · `npm run dev:3001` → 3001.
Farklı port + ayrı `git worktree` kullanan ajanlar için `.next` kilidi **oluşamaz** → build kilidi gereksiz.

### 11.5 🅓'nin kendi kısıtı
🅓 Cline, `app/[yerel]/` sayfalarına (çakışmaya girdiği 10 dosya) **bir daha yazmayacak.**
Bu, çakışmanın tekrarını yapısal olarak engeller.

---

**Nihai durum:** `tsc` ✅ 0 hata · `lint` ✅ 0 hata · **`next build` ✅ exit 0 (izole doğrulandı)** ·
**commit kapısı ✅ AKTİF ve blokladığı kanıtlı** · 7 commit · çalışma ağacı temiz.



