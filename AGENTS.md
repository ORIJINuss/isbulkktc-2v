# AGENTS.md — İşBulKKTC Çoklu Ajan Çalışma Sözleşmesi

> Bu dosya repoda çalışan **tüm AI ajanları** içindir (Copilot SDK / VS Code, OpenCode, Cline).
> Çakışmayı önlemek için **bağlayıcıdır**. Her ajan işe başlamadan önce bu dosyayı okumak zorundadır.
> Canlı görev panosu: [`docs/AJAN-KOORDINASYON.md`](docs/AJAN-KOORDINASYON.md)
>
> **Ajanlar ve sorumluluk sınırları**
> - **Copilot / VS Code Agent — Chief:** kapsam, mimari, iş bölümü, dosya sahipliği, entegrasyon ve son doğrulama.
> - **OpenCode — Implementer:** atanmış uygulama değişikliklerinin tek yazarı; uygulama, test ve öz-inceleme.
> - **Cline — Reviewer:** varsayılan olarak salt okunur bağımsız inceleme; bulgu ve doğrulama raporu verir.
> - Aynı görev/dosya için eşzamanlı yazar yoktur. Reviewer, açık bir görev devri olmadan dosya değiştirmez.

---

## 1. Proje Künyesi

| | |
|---|---|
| **Proje** | İşBulKKTC — KKTC istihdam & kariyer portalı |
| **Stack** | Next.js 14 (App Router) · TypeScript · Tailwind · next-intl · Supabase SSR · Zod + RHF |
| **Diller** | `tr` (kaynak), `en`, `ru`, `he` (RTL) |
| **İsimlendirme** | **Her şey Türkçe**: dosya, tip, fonksiyon, değişken, prop, enum. Türkçe karakter serbest. |
| **Mevcut bağımlılıklar** | `zod`, `@hookform/resolvers`, `react-hook-form`, `clsx`, `tailwind-merge`, `next-intl`, `@supabase/ssr`, `@supabase/supabase-js` |

### Dokunulmaz kurallar

1. **Yeni bağımlılık ekleme.** (Özellikle `lucide-react` gibi ikon kütüphanesi → **Material Symbols** kullan, `.msimge` class'ı zaten yüklü.)
2. **`any` yasak.** `unknown` + type guard; Zod ile parse etmeden veriye güvenme.
3. **Sabit metin hardcode etme.** `useTranslations` / `getTranslations` kullan. Yeni anahtar → önce `i18n/mesajlar/tr.json`, sonra `en/ru/he`.
4. **`"use client"`** yalnızca gerçekten state/effect hook'u olan dosyanın **1. satırında**. Server component içinden client import etme.
5. **Class birleştirme** → `import { sb } from "@/lib/yardimcilar/sinif-yardimcisi"` (veya `siniflariBirlestir as sb`).
6. **SEO kritik işler** (metadata, JSON-LD, `generateStaticParams`) **server component** içinde kalır.

---

## 1.1 Ajan Sözleşmesi: Chief → Implementer → Reviewer

### Roller

- **Copilot / VS Code Agent — Chief:** isteği ve repository'yi inceler; kabul kriterlerini, sıralamayı, izinli dosyaları ve doğrulamayı belirler. Uygulamayı OpenCode'a devreder, handoff'u birleştirir ve son kalite kapısını yürütür. Varsayılan olarak uygulama kaynak kodunu değiştirmez.
- **OpenCode — Implementer:** Chief'in görev kaydında açıkça listelenen dosyaların tek yazarıdır. İlgili testleri çalıştırır, öz-inceleme yapar ve değişiklikleri **commit etmeden** handoff eder. Commit oluşturmaz.
- **Cline — Reviewer:** değişiklikleri ve gerekli bağlamı okur; doğruluk, güvenlik, performans, erişilebilirlik ve regresyon bulgularını raporlar. Varsayılanı salt okunur incelemedir; düzeltmeleri Chief'e devreder, implementasyon OpenCode tarafından yapılır.
- **Copilot / VS Code Chief — Integrator & Commit Owner:** OpenCode handoff'unu ve Cline incelemesini denetler, son doğrulamayı yapar ve OpenCode'un değişikliklerini commit eder.

### Görev ve dosya kilidi

Her görev başlamadan önce `docs/AJAN-KOORDINASYON.md` panosunda tek bir **sahip**, **reviewer**, **izinli dosyalar**, **bağımlılıklar**, **kabul kriterleri** ve **testler** kaydedilir. Bir görev veya dosyada aynı anda yalnızca bir yazar bulunur.

1. Yazmadan önce `npm run cakisma-kontrol -- --agent <copilot|opencode|cline> <dosya...>` çalıştır; izin verilmeyen, tanımsız veya başka ajana ait dosyada yazmayı durdur.
2. `ORTAK` dosya için önce panoda kilit al; kilit doluysa sırayı bekle. Kilidi teslimden sonra bırak.
3. Dosya mtime'ı son 2 dakika içindeyse yazmayı durdur ve olası eşzamanlı düzenlemeyi panoda teyit et. Mtime tek başına sahiplik veya kilit kanıtı değildir.
4. Paralel implementasyon yalnızca ayrı worktree'lerde ve kesişmeyen dosya listeleriyle yapılır. Aynı dosya/özellikte paralel yazım yapılmaz.
5. `.env.local`, `.env.production` ve sır içeren dosyalar commit edilmez; gerçek credential'lar log/rapora kopyalanmaz.

### Handoff

Her implementasyon ve review panoya şu alanlarla kaydedilir: iş, sahip, doğrulayıcı, değişen dosyalar, test sonucu, bilinen riskler ve sonraki adım. OpenCode handoff'u Cline'a **review only** devridir; Cline bulguları Chief'e iletir, düzeltmeleri OpenCode yapar. OpenCode hiçbir zaman commit oluşturmaz; doğrulanmış OpenCode değişikliklerinin commit sahibi Copilot / VS Code Chief'tir.

---

## 1.5 Ajan kimlikleri

| Ajan | Kanonik rol | Yazma ilkesi |
|---|---|---|
| Copilot / VS Code Agent | Chief / orchestrator | Koordinasyon ve repo kalitesi alanları; uygulama kodunu varsayılan olarak yazmaz |
| OpenCode | Implementer | Görevde kendisine atanmış implementasyon dosyaları; commit oluşturmaz |
| Cline | Reviewer | Salt okunur; bulguları Chief'e devreder |

---

## 2. Dosya Sahipliği Haritası

Makine-okunur kaynak [`.ajan-sahiplik.json`](.ajan-sahiplik.json); her görev panoda daha dar bir dosya listesiyle sınırlandırılır.

| Alan | Copilot / Chief | OpenCode / Implementer | Cline / Reviewer |
|---|---|---|---|
| `app/**`, `bilesenler/**`, `lib/**`, `i18n/**`, `supabase/**`, `public/**`, `middleware.ts` | Koordine eder/doğrular | **Tek uygulama yazarı** | Salt okunur review |
| Uygulama yapılandırmaları, testler, bağımlılık manifestleri | Onaylar/koordine eder | Görev kapsamındaysa yazar | Salt okunur review |
| `AGENTS.md`, `.ajan-sahiplik.json`, `docs/**`, `tools/**`, `.githooks/**`, `.github/**`, `.clinerules/**` | **Sahip** | Salt okunur; devir/kilit gerekir | Salt okunur review |
| `.env.local`, `.env.production`, log/credential dosyaları | Salt okunur | Salt okunur | Salt okunur |
| Görev panosu/ortak dosya | Önce tek kilit/sahip belirler | Yalnızca atanmış kilitle yazar | Yazmaz |

Makine haritasında eşlenmeyen dosya **sahipsizdir, güvenli kabul edilmez**: yazmadan önce Chief eşlemeyi günceller ve görevi panoya kaydeder. Görev listesinde olmayan dosyaya gelişigüzel dokunulmaz.

---

## 3. Kalite Kapısı (Her faz sonunda zorunlu)

Package manager `npm`'dir (`package-lock.json`). `package.json` içinde ayrı bir test script'i tanımlı değildir; değişiklik için mevcut en küçük doğrulama komutunu seç, eksik test kapsamını raporla.

```powershell
npm run type-check   # tsc --noEmit → 0 hata
npm run lint         # → 0 sorun
npm run build        # → exit 0, .next/ oluşur
```

### ⛔ ÇAKIŞMA UYARISI — `next build` kilidi

`npm run build` **`.next/` klasörünü kilitler**. Dev server (`npm run dev`) ayaktayken build çalıştırmak **diğer ajanların çalışan uygulamasını bozar**.

**Kural:** `next build` çalıştırmadan önce `docs/AJAN-KOORDINASYON.md`'de **"build kilidi"** al ve port 3000'de dinleyen dev server olmadığını doğrula. Bitince kilidi bırak.

---

## 4. Görev Devir / Çakışma Protokolü

1. **Sahiplenme:** Panoda tek owner (`Copilot`, `OpenCode` veya `Cline`), reviewer, izinli dosyalar, bağımlılıklar ve kabul kriterlerini kaydet.
2. **Dosya kontrolü:** Yazmadan önce `npm run cakisma-kontrol -- --agent <copilot|opencode|cline> <dosya...>` çalıştır. `ORTAK`, tanımsız, salt-okunur veya başka rolün dosyasıysa önce kilit/atama al.
3. **Tek yazar:** Bir dosyada tek aktif implementer bulunur. Paralel görevler ayrı worktree ve kesişmeyen dosya listeleri gerektirir.
4. **Bitirme:** Implementer değişiklikleri commit etmeden teslim eder; değişen dosyaları, test komutlarını/sonuçlarını, riskleri ve sonraki adımı panoya kaydedip işi Cline'a read-only review için devreder.
5. **Review:** Cline bulguları Chief'e iletir. Düzeltme gerekiyorsa dosya sahipliği OpenCode'a döner; reviewer doğrudan düzeltme yapmaz.
6. **Son doğrulama ve commit:** Copilot son diff'i ve kalite kapısını doğrular, Cline bulgularını kapatır ve OpenCode değişikliklerini commit eder. Commit mesajına gerekli Co-authored-by trailer eklenir.
7. **Asla:** OpenCode commit oluşturmaz; hiç kimse `git checkout .`, `git reset --hard`, `git clean -fd`, `git stash` çalıştırmaz. Başka işlerin commit edilmemiş değişiklikleri bulunabilir.

### 4.1 İş sırası ve paralellik

- **Sıralı:** Chief kapsam/kabul kriteri ve dosya atamasını yapar → OpenCode uygular ve öz-inceleme yapar → Cline salt okunur review yapar → OpenCode gerekli düzeltmeleri yapar → Copilot son doğrulamayı çalıştırır.
- **Paralel:** Salt okunur araştırma/review, implementasyondan bağımsızsa paralel olabilir. Birden çok implementasyon işi ancak bağımsız kabul kriterleri, ayrı worktree'ler ve kesişmeyen dosya listeleri varsa paralel yürür.
- Şema/sözleşme değişikliği onu kullanan API ve UI'dan önce tamamlanır. Son test/build aynı kod ağacında yeni implementasyonla eşzamanlı çalıştırılmaz.

---

## 5. Kaynak Gerçek (Single Source of Truth)

| Konu | Yetkili kaynak |
|---|---|
| Aktif görevler & sahiplik | `docs/AJAN-KOORDINASYON.md` |
| Frontend tamamlama planı | `.trae/documents/isbukkktc_frontend_tamamlama_duzeltme_plan.md` |
| Tasarım tokenları | `lib/tasarim/tasarim-tokenlari.json` |
| Ortam değişkenleri | `.env.example` (gerçek değerler `.env*.local`, **asla commit edilmez**) |
| Denetim kayıtları | `docs/DENETIM-RAPORU.md` |

---

## 6. Kalite Altyapısı

### 6.1 Commit öncesi kapı — `pre-commit` hook

```powershell
npm run hook-kur      # → git config core.hooksPath .githooks
```

Kurulduktan sonra **her commit'te** `type-check` + `lint` otomatik çalışır ve kırık kod commit edilemez.
Acil durumda atlamak için: `git commit --no-verify` · Kaldırmak için: `npm run hook-kaldir`

### 6.2 CI kapısı — `.github/workflows/kalite.yml`

Her dalda ve her PR'da `type-check → lint → build` çalışır (Docker imajı üretmez → hızlı geri bildirim).

> ⚠️ **Tespit:** Mevcut `docker.yml` yalnızca `main` ve `production` dallarında tetikleniyor; ancak depo **`master`** dalında. Yani kalite kontrolü **hiç çalışmıyordu.** `kalite.yml` bu boşluğu kapatır.

### 6.3 Tek komutla doğrulama

```powershell
npm run kalite        # type-check + lint
```

### 6.4 Ortam değişkeni sözleşmesi

Yetkili kaynak: **`.env.example`** (kod taramasıyla doğrulanmış, 26.09.2026).
Üretimde **zorunlu 6 değişken** — eksikse `lib/ortam/ortam.ts` hata fırlatır ve `/api/hazirlik` 503 döner:

| Değişken | Kullanıldığı yer |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/ortam/ortam.ts`, `middleware.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/ortam/ortam.ts`, `middleware.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/ortam/ortam.ts` (sunucu tarafı) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `lib/ortam/ortam.ts`, `TurnstileBileseni.tsx` |
| `TURNSTILE_SECRET_KEY` | `lib/ortam/ortam.ts`, `app/api/turnstile/verify` |
| **`PAYMENT_WEBHOOK_SECRET`** | `app/api/odeme/webhook/route.ts`, `app/api/hazirlik/route.ts` |

> **Zorunlu kural:** Yeni bir `process.env.X` kullanımı ekleyen ajan, **aynı commit'te** `.env.example`'ı da güncellemek zorundadır. Aksi hâlde üretimde sessiz kesinti oluşur.

### 6.5 Satır sonu politikası

`.gitattributes` eklendi → repoda tüm kaynak dosyalar **LF** saklanır. Böylece Windows/Linux ajanları arasında "dosyanın tamamı değişmiş gibi görünme" (hayalet diff) sorunu ortadan kalkar. Bu, çakışma önleyici bir katmandır — `.gitattributes`'ı **değiştirmeyin**.

---

## 7. ÇAKIŞMA ÖNLEME MEKANİZMASI

Çakışma riskini azaltmak için panoyu, tek yazarı, sahiplik denetimini ve ayrı worktree'leri birlikte kullan:

### 7.1 Makine-okunur sahiplik haritası — `.ajan-sahiplik.json`
Uygulama kaynak alanı OpenCode'a, orchestration/kalite alanı Copilot'a atanmıştır. Cline yazmayan reviewer'dır. Yeni veya eşleşmeyen dosya için Chief'ten görev ve sahiplik ataması alın.

### 7.2 Kontrol aracı — `npm run cakisma-kontrol`
```powershell
npm run cakisma-kontrol                                      # son 30 dk'daki hareket ve sahiplik
npm run cakisma-kontrol -- --agent opencode app/page.tsx    # implementer yetkisi
npm run cakisma-kontrol -- --agent copilot AGENTS.md        # chief yetkisi
npm run cakisma-kontrol -- --agent cline app/page.tsx       # reviewer yazma denetimi
```

| Karar | Anlamı |
|---|---|
| 🟢 | Seçilen rol için atanmış alan |
| 🟡 | Kilit gerekli, rol belirtilmeli veya dosya sahipliği tanımsız |
| 🔴 | Başka rolün alanı, yakın zamanda değişmiş dosya veya reviewer yazma isteği — dur |
| ⛔ | ASLA commit edilmez (`.env.local`, `.env.production`, `*.log`) |

> Araç, `--agent` ile rol sahipliğini denetler ve yetkisiz istekte exit code 1 döndürür. Son 2 dakikada değişmiş dosyada rol sahibi de dahil herkes durur. Staged dosya denetimi bilgilendiricidir; araç dosya sistemi izinlerini zorlamaz. Panodaki tek sahiplik ve reviewer'ın salt okunur rolü bağlayıcıdır.

### 7.3 Commit kapısı — `.githooks/pre-commit` · **AKTİF**
`core.hooksPath = .githooks` kurulu. Sırasıyla:
1. `tsc --noEmit` → başarısızsa **commit REDDEDİLİR**
2. `next lint` → başarısızsa **commit REDDEDİLİR**
3. sahiplik denetimi → ihlalde **uyarı basar** (bloklamaz)

Acil bypass: `git commit --no-verify` · Kapatma: `npm run hook-kaldir`

### 7.4 Dev portu ayrımı — çakışmayı kökten bitirir
`npm run dev` (port 3000) · `npm run dev:3001` (port 3001)
Her ajan **farklı port** + gerekiyorsa **ayrı `git worktree`** kullanırsa `.next` kilidi ve
dev-server çakışması **imkânsız** hale gelir. (Build kilidi gerekmez.)

### 7.5 Kanıtlanmış izole `next build` tarifi (dev server'a dokunmaz)
```powershell
git worktree add --detach "..\build-dogrulama" HEAD
cmd /c mklink /J "..\build-dogrulama\node_modules" "$PWD\node_modules"
cd ..\build-dogrulama ; npm run build
# TEMİZLİK — sırayla:
cmd /c rmdir "..\build-dogrulama\node_modules"   # 1) junction'i ayir (hedefe DOKUNMAZ)
git worktree remove --force "..\build-dogrulama" # 2) worktree'yi kaldir
```
> ⚠️ **Junction'ı `Remove-Item -Recurse` ile silmeyin** — gerçek `node_modules`'e de iner.
> Bu tarif `docs/DENETIM-RAPORU.md` §7'de P0-5'in kapanmasını sağladı (exit 0, kanıtlı).
---

## 8. Bilinen Ortam Sorunları — Windows

### 8.1 OpenCode CLI çağrısı — `opencode` komutu KULLANILMAZ

Bu makinede `opencode` komutu, npm'in ürettiği `opencode.ps1` shim dosyasındaki bir
path çözümleme hatası yüzünden **otomasyon/agent terminali üzerinden non-interaktif
çağrıldığında** `Cannot find drive. A drive with the name
'Microsoft.PowerShell.Core\FileSystem' does not exist.` hatası verir. İnteraktif bir
kullanıcı terminalinde sorunsuz çalışır — hata yalnızca agent/script bağlamında çıkar.

**Kural:** OpenCode'u terminal üzerinden çağıran her ajan (özellikle Chief),
`opencode` yerine **tam exe yolunu** kullanmak zorundadır:

```powershell
& "C:\Users\MAliK\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe" <argümanlar>
```

`opencode` kısayolunu (shim) hiçbir otomasyon senaryosunda kullanma; yalnızca kişi
kendi elle açtığı interaktif terminalde `opencode` yazabilir.

---

**Son güncelleme:** 27.09.2026 · **Bakım:** Copilot / VS Code Agent (Chief)
