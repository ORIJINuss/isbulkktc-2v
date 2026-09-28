# 🎛️ AJAN KOORDİNASYON PANOSU — İşBulKKTC

> **Bu dosya canlı panodur.** Repoda çalışan 3 ajan burayı okuyup yazar.
> Kurallar: [`AGENTS.md`](../AGENTS.md) · Denetim kayıtları: [`DENETIM-RAPORU.md`](DENETIM-RAPORU.md)

**Ajanlar (27.09.2026 itibarıyla):** Copilot / VS Code = Chief · OpenCode = tek Implementer · Cline = salt okunur Reviewer

> 26.09 tarihli P0 kayıtları ve kapatılmış kilitler tarihsel kayıttır; yeni görevlerde güncel rol modeli, sahiplik haritası ve görev panosu satırları esas alınır. Pano dosyasının sahibi Copilot / VS Code Chief'tir.

| İş | Sahip | Doğrulayıcı | Durum | Değişen dosyalar | Risk | Sonraki adım |
|---|---|---|---|---|---|---|
| Demo ilan detayındaki doğrulanmamış metrikleri kaldırma | OpenCode | Cline (salt okunur + Deep Plan), Copilot | KALİTE + BUILD PASS — CLINE TIMEOUT | `app/[yerel]/ilan/[slug]/page.tsx` | Child task `tsk_e3af6954-cb95-4588-b42f-32f71e7c5181`, parent `tsk_1e87af96-e866-425e-b42f-5c658a3b61e0`. Demo detayından uydurma görüntülenme/başvuru sayısı, varsayılan ATS eşiği, B3/onaylı ve acil rozetleri, rastgele şirket ilan sayısı ve B3 JSON-LD iddiası kaldırıldı. Önceki CV yükleme/başvuru ve DB detay akışları korundu; başka uygulama dosyası değiştirilmedi. Orchestrator kanıtları: kalite exit 0 (`ev_e9914e08-8ec5-4dcd-866e-bda0fb71fb05`), build exit 0 (`ev_a43f5263-32d8-4eb3-bd27-2bfaafa096f1`); `git diff --check` geçti. Cline review-only denemesi `CLINE_TIMEOUT` (`ev_6e881202-204f-41ba-9437-553b08158b62`); sessionId/transcript/verdict yok, onay iddia edilmiyor. Commit/push yok | Aynı review’u tekrarlama; yeni gerçek Cline session/transcript oluşursa incelemeyi sürdür, bu sırada ayrı ürün işleri devam etsin |
| Benzer ilan kartlarındaki doğrulanmamış iddiaları kaldırma | OpenCode | Cline (salt okunur + Deep Plan), Copilot | KALİTE + BUILD PASS — CLINE TIMEOUT | `bilesenler/ilan/IlanKartı.tsx` | Child task `tsk_cb9f4d76-332c-4403-a401-1746c49105ed`, parent `tsk_e3af6954-cb95-4588-b42f-32f71e7c5181`. OpenCode yalnız atanmış dosyayı değiştirdi: B3/onaylı ve acil rozetleri, varsayılan ATS skoru/AI paneli ile uydurma şirket kodu fallback'i kaldırıldı; mevcut iş alanları, kaydet/paylaş ve navigasyon korundu. Orchestrator kanıtları: kalite exit 0 (`ev_c2425b1a-7e3a-44c3-9090-fde387f62d17`), build exit 0 (`ev_fec98d33-1505-4869-acf1-97028b5ab44e`); `git diff --check` geçti. Cline review-only timeout (`ev_8de8cbd2-87a2-4710-b4fc-637cfb932007`); sessionId/transcript/verdict yok, onay iddia edilmiyor. Commit yok | Cline review’u tekrarlama; kalan açık demo ilan iddialarını dar ve bağımsız görevlerle temizle |
| Demo ilan kartındaki doğrulanmamış AI eşleşme notunu kaldırma | OpenCode | Cline (salt okunur + Deep Plan), Copilot | KALİTE + BUILD PASS — CLINE TIMEOUT | `bilesenler/ilan/IlanKartı.tsx` | Child task `tsk_dc1946cf-d8e4-48c4-8ab3-e4ad834735ab`, parent `tsk_cb9f4d76-332c-4403-a401-1746c49105ed`. Demo seed verisindeki sabit gerekçe metinleri “AI Eşleşme Notu” diye görünüyordu. OpenCode bu koşullu kart alanını ve kullanılmayan veriye erişimi kaldırdı; önceki kart düzenlemeleriyle birlikte yalnız aynı atanmış dosya değişti. Orchestrator kanıtları: kalite exit 0 (`ev_259d778a-59d7-4ce9-88bc-6082de5d8880`), build exit 0 (`ev_cd766de6-e898-4744-80c0-ce165fe24ccd`); `git diff --check` geçti. Cline review-only timeout (`ev_e66679ac-fc10-4660-a0b1-018c083de35f`); sessionId/transcript/verdict yok, onay iddia edilmiyor. Commit yok | Cline review’u tekrarlama; kalan açık demo ilan iddialarını dar ve bağımsız görevlerle temizle |
| Demo ilanlardaki doğrulanmamış maaş garantisi iddialarını kaldırma | OpenCode | Cline (salt okunur + Deep Plan), Copilot | KALİTE + BUILD PASS — CLINE TIMEOUT | `app/[yerel]/ilan/[slug]/page.tsx`, `bilesenler/ilan/IlanKartı.tsx` | Child task `tsk_af6da4ac-7f1c-4b03-ad8b-dd175373894f`, parent `tsk_dc1946cf-d8e4-48c4-8ab3-e4ad834735ab`. Demo detayındaki maaş garantisi ve Md. 59 rozeti kaldırıldı; karttaki TRY garantisi, para birimi etiketini kullanan nötr metne dönüştü. Gerçek maaş aralığı korundu; yalnız atanmış iki UI dosyası değişti. `npm run kalite` exit 0 (`ev_caeeeb56-bb01-43d8-88cf-658dfd438b0c`), `npm run build` exit 0 (`ev_d3fc816d-5bb6-4d0f-8cdf-e4d02d4f52cc`), `git diff --check` geçti. Cline review-only timeout (`ev_da854c67-54ef-446e-9ac1-4e0462955b38`); sessionId/transcript/verdict yok, onay iddia edilmiyor. Commit/push yok | Aynı Cline review’u yineleme; izin süreci iddialarını ayrı, tek dosyalı görevle temizle |
| Demo ilandaki doğrulanmamış çalışma izni iddialarını kaldırma | OpenCode | Cline (salt okunur + Deep Plan), Copilot | KALİTE + BUILD PASS — CLINE TIMEOUT | `app/[yerel]/ilan/[slug]/page.tsx` | Child task `tsk_9fb0c4d3-c3a4-421c-8044-8918bb213c22`, parent `tsk_af6da4ac-7f1c-4b03-ad8b-dd175373894f`. OpenCode sadece atanmış demo-detay dosyasında sabit `izinAdimlari` açıklamalarını ve “KKTC İzin Süreci” kartını (PES 2024/9182 rozeti dahil) kaldırdı; ikame hukuki metin eklemedi. İlgisiz ilan içeriği, DB dalı, CV yükleme/başvuru akışı ve JSON-LD korundu; `git diff --check` geçti (`ev_c327158b-b501-4457-86f2-e8f2a59a94da`). Task-linked `npm run kalite` exit 0 (`ev_49183537-042d-4cc9-9ab3-9aad31032111`), `npm run build` exit 0 (`ev_5419e12b-dd9d-4a69-b5a1-289dcd851ff5`), ayrı `git diff --check` geçti. Cline read-only review `rev_744ea32dc7395024455889baca1dd1ce` 10 dakika sonunda `CLINE_TIMEOUT` (`ev_0e29f522-d69d-499e-9bff-9f56a5e5b072`); sessionId/transcript/verdict yok, onay iddia edilmiyor. Commit/push yok | Aynı incelemeyi yineleme; Cline erişimi düzeldiğinde toplu review; bu sırada bağımsız iddia temizliği sürdürülebilir |
| Demo ilan detayındaki kaynaksız çalışma koşullarını kaldırma | OpenCode | Cline (salt okunur + Deep Plan), Copilot | OPENCODE HANDOFF — DAR KAPSAM DÜZELTMESİ İSTENDİ | `app/[yerel]/ilan/[slug]/page.tsx` | Child task `tsk_df2ecde9-ac89-4d3e-a73c-8e08557fb8a2`, parent `tsk_9fb0c4d3-c3a4-421c-8044-8918bb213c22`. Demo detayında tüm ilanlara sabit 09:00–18:00, haftada iki ofis günü, Apple/4K ekipman ve 22 gün ücretli izin gösteriliyordu; bu iddialar kaldırıldı. Handoff, `ekMeta.izinTipiAciklama`yı çalışma düzeni satırlarına ekliyor; bu alan izin kategorisidir ve görevin UI/scope amacına aykırı olduğundan düzeltme öncesi gate/review çalıştırılmadı. İlan-kaynaklı çalışma modeli ve `ilan.yanHaklar` korunmalı; izin kategorisi çalışma koşulları kartına eklenmemeli. `ev_d13b7225-1859-4ade-8fce-78fa70f9949c` handoff kanıtı. Commit/push yok | Task’i retryable düzeltme durumuna al; yalnız permit kategorisi satırını çıkar; ardından kalite/build/diff-check ve tek Cline review |
| Çalışma düzeni kartından izin kategorisini ayırma | OpenCode | Cline (salt okunur + Deep Plan), Copilot | OPENCODE HANDOFF İNCELENDİ — TASK-LINKED GATE | `app/[yerel]/ilan/[slug]/page.tsx` | Child task `tsk_5a97a27d-a681-4416-955e-dcc133bc04db`, parent `tsk_df2ecde9-ac89-4d3e-a73c-8e08557fb8a2`. Chief review’unda çalışma düzenine eklenmiş izin kategorisi satırı bulundu; ayrı OpenCode düzeltmesi yalnız `ekMeta.izinTipiAciklama` girdisini kaldırdı. `calismaSekli`, `calismaModeli`, `calismaSekliAciklama`, mevcut yan haklar ve önce kaldırılmış uydurma saat/ekipman/izin vaatleri korundu. Diff tek satır/tek dosya; `git diff --check` geçti. Task-linked kalite/build bu kilitle çalışacak; Cline review bundan sonra bir kez denenecek. Commit/push yok | Task-linked kalite/build’i çalıştır; bir Cline read-only review iste |
| Giriş formu hatalarını görünür kılma ve işlevsiz sağlayıcı butonlarını kaldırma | OpenCode | Cline (salt okunur + Deep Plan), Copilot | HAZIR — OpenCode devri bekliyor | `bilesenler/formlar/GirisKayitSekmeleri.tsx`, `i18n/mesajlar/{tr,en,ru,he}.json` | Task `tsk_f450da26-1d45-488e-a577-bbfdaee991b0`. Kullanıcı giriş/kayıt ve butonların çalışmadığını, görsel sorunları bildirdi; tarayıcı otomasyonunun otomatik engellendiğini belirtti. Tarayıcı açılmadan doğrulama: `/tr/giris` HTTP 200; `/api/hazirlik` `supabaseAnonKey=false` (secret değeri okunmadı). Auth async çağrılarında yakalama yok; Google/e-Devlet düğmelerinde handler yok; şifre sıfırlama fetch'i de reddedilince kullanıcıya hata göstermiyor. Sınır: auth hata/validasyon/loading mesajları yerelleştir; boş girişte çağrıyı engelle; handler'sız sağlayıcı CTA'larını kaldır/etkisizleştir; auth gerçek config olmadan canlı test iddia edilmez; `.env` değişmez. Yalnız bileşen ve dört locale dosyası; kalite/build/diff-check; commit yok | OpenCode’a devret; handoff diff ve task-linked kalite/build, ardından bir Cline review |
| Header `getUser()` hata görünürlüğü | OpenCode | Cline (salt okunur + Deep Plan), Copilot | BUILD + KALİTE PASS — CLINE REVIEW DEVAM EDİYOR | `bilesenler/genel/UstGezinmeCubugu.tsx`, `i18n/mesajlar/{tr,en,ru,he}.json` | Child task `tsk_9cdc1130-7611-40f8-a3f7-06411164ff86` (parent: `tsk_99541582-f790-45a7-a8b6-16dfc5ef6d37`). `getUser()` returned error ve rejection artık fail-closed durumunda ayrı çevrilmiş `role=status` uyarısı gösteriyor; başarılı auth sonucu uyarıyı temizliyor. Dört locale anahtarı ve `git diff --check` doğrulandı; `npm run kalite` exit 0 (`ev_fe752f16-5a67-4e53-ba77-042e65c07a3d`), `npm run build` exit 0 (`ev_0d2d9213-cf61-4f97-a4e8-a2a8f274a57c`). Dev server portları 3000/3001 boşken build çalıştı. Gerçek `getUser()` hata yolu Supabase anahtar blokajı yüzünden browser’da uçtan uca test edilmedi. Cline read-only review isteği başlatıldı; yanıt bekleniyor. Commit/push yok | Cline verdict geldikten sonra review bulgularını ele al; geçerli yerel Supabase anon key olmadan canlı oturum/DB smoke testini iddia etme |
| Tarayıcı hata onarımı — Supabase istemci yapılandırması eksik olsa da public sayfaları koru | OpenCode | Cline (salt okunur + Deep Plan), Copilot | BUILD PASS — CLINE TIMEOUT | `bilesenler/genel/UstGezinmeCubugu.tsx`, `i18n/mesajlar/{tr,en,ru,he}.json` | `http://localhost:3001/ilan-ara` tarayıcı hatası tekrarlandı: anon key placeholder/redaction filtresine takıldığında `UstGezinmeCubugu` auth useEffect’inin uncaught throw’u Next client-side exception üretti. OpenCode try/catch, `getUser()` rejection handling, signOut hata kontrolü ve 4 dilde erişilebilir auth status ekledi. Chief doğruladı: `npm run kalite` + `npm run build` exit 0; production browser’da TR/EN H1, auth `role=status` ve ilan API `role=alert` 503 birlikte render oluyor; 375px mobilde yatay taşma yok; güncel sayfada Next Application error yok. `/api/ilanlar` 503 beklenen config blokajı. Cline read-only review `tsk_99541582-f790-45a7-a8b6-16dfc5ef6d37` için `CLINE_TIMEOUT` döndü; review session/transcript/verdict yok, onay iddia edilmedi. `.env.local` anon key gerçek/usable değil; değeri hiçbir yere yazılmadı; gerçek ilan verisi/oturum için kullanıcı güvenli yerel yapılandırma yapmalı. Commit/push yok | Cline kullanılabilir gerçek oturum/transcript sağlandığında review’u dene; ana ilan akışı review’u da tamamlanmalı; yalnızca geçerli Supabase anon key olduğunda DB list/detail smoke testini yap |
| P1 düzeltme — gerçek ilan akışında tip ve veri sözleşmesi | OpenCode | Cline (salt okunur + Deep Plan), Copilot | BUILD PASS — BROWSER CONFIG BLOCKER / CLINE REVIEW BLOCKED | `lib/depolar/ilan-arama-deposu.ts`, `app/[yerel]/ilan/[slug]/layout.tsx`, `bilesenler/ilan/VeritabaniIlan{Kart,Detayi}.tsx`, `app/api/ilanlar/route.ts` | Ana görev `tsk_1e87af96-e866-425e-b42f-5c658a3b61e0`; onarım görevi `tsk_b160f747-e870-463c-b35f-db423c61f42c`. OpenCode yalnız `lib/depolar/ilan-arama-deposu.ts` dosyasını düzeltti (PostgREST ilişkisini nesne/null’a normalize etti, `any` kaldırdı, null/non-array yanıtı hata yaptı). `npm run kalite`, `npm run build`, `git diff --check` ve adapter regresyonları 6/6 geçti. Üretim browser list sayfası TR/EN’de render; 375px overflow yok. Anon key `[REDACTED]` olduğundan `/api/ilanlar` 503 döner ve canlı DB ilan/detail doğrulanamaz. Auth UI onarımı için gerçek Cline read-only denemesi `CLINE_TIMEOUT` oldu, session/transcript yok; ana ilan review’u da bekliyor. Commit/push yok | Geçerli anahtar ve kullanılabilir Cline reviewer session/transcript sağlandığında DB smoke test + Cline review; aksi halde dış engelleri açık tut |
| AUTONOMOUS PROJECT ENGINE — Cline adapter, gerçek review hattı ve exact-diff build | Copilot / Chief | Cline 4.1.21 (read-only + Deep Plan); Copilot | BLOKE — CLINE TIMEOUT | `tools/cline-adapter.mjs`, `tools/cline-adapter.test.mjs`, `tools/orchestrator.mjs`, `.agents/orchestrator/state/project-map.json`, bu pano | Commit edilmiş dosya kapsamı fallback’i ve bozuk/alakasız JSON oturumlarını atlama düzeltmeleri tamamlandı. Adapter 9/9, `npm run kalite`, exact-diff izole build, doctor ve `git diff --check` geçti. Kullanıcının Cline’ın çalıştığını belirtmesinden sonra yeni review attempt’i de `CLINE_TIMEOUT` oldu; session store’da yeni oturum yok ve transcript kanıtı üretilemedi. Cline sonucu/başarısı iddia edilmedi. Browser Supabase URL eksikliğinden bloke. Uygulama engine kodu commit `6c8fa9c` içine dahil edildi; app kodu burada değişmedi | Gerçek Cline session/transcript oluştuğunda `tsk_98745b29-f27b-498a-b516-3acc4b57a028` üzerinden review’u yeniden dene; ürün işlerini review engeli olmadan sürdür |
| Full-stack ürün akışları — önceliklendirilmiş backlog | Copilot / Chief | Cline ve OpenCode (read-only planlama) | DEVAM — P1 GERÇEK İLAN AKIŞI | `app/[yerel]/ilan-ara/page.tsx`, API/depo/detay ve arama bileşenleri (ayrıntı aşağıda) | Cline review altyapısı iki defa zaman aşımına uğradı; gerçek Cline session/transcript bulunmuyor. Ürün işlerini durdurmadan kanıtlanmış DB kolonlarıyla gerçek ilan arama→detay dilimi OpenCode’a atanıyor; desteklenmeyen filtre/ölçümler uydurulmayacak, RLS/anon Supabase korunacak | OpenCode tek yazar olarak dikey dilimi tamamlasın; kalite/build; Cline erişilebilir değilse gerçek engeli kaydet, sahte review verme |
| P1 — Başvuru CV’sini gerçek özel depoya yükleme ve sahiplik doğrulama | OpenCode | Cline (salt okunur review), Copilot (son doğrulama) | BLOKE — CLINE SESSION OLUŞMADI | `app/[yerel]/ilan/[slug]/page.tsx`, `app/api/basvurular/route.ts`, `i18n/mesajlar/{tr,en,ru,he}.json` | OpenCode değişiklikleri teslim etti; ana model 403 sonrası fallback `space-bunny-free` kullanıldı. Chief’in kaydettiği `npm run kalite` ve `npm run build` exit 0; build uyarısı yok. Cline read-only review URI’si 10 dakikada `CLINE_TIMEOUT` oldu; sessionId/transcript/verdict yok, Cline onayı iddia edilmiyor. Kullanıcı Cline’da soru gördüğünü bildirdi ancak soru/transcript bu oturumda görünmüyor; OpenCode commit etmedi | Cline’da görünür webview/session oluştuğunda gerçek review transcript’ini al; görünür Cline sorusu bu oturuma aktarılınca bağlamıyla yanıtla |
| P1 — Gerçek DB ilan arama ve detay akışı | OpenCode | Cline (read-only review), Copilot | IMPLEMENTING — OPENCODE | `app/[yerel]/ilan-ara/page.tsx`, `app/api/ilanlar/route.ts`, `app/api/ilanlar/[slug]/route.ts`, `lib/depolar/ilan-arama-deposu.ts`, `app/[yerel]/ilan/[slug]/{page,layout}.tsx`, `bilesenler/ilan/VeritabaniIlan{Kart,Detayi,Basvurusu}.tsx`, `i18n/mesajlar/{tr,en,ru,he}.json` | `tsk_1e87af96-e866-425e-b42f-5c658a3b61e0`; mevcut search UI demo verisini kullanıyor, API filtreleri sessizce yok sayıyor ve gerçek slug detay sayfasında bulunmuyor. Yalnız kanıtlanmış job_posts/companies kolonları; sahte B3/ATS/lojman/başvuru/görüntülenme metriği yok; anon/RLS korunacak; desteklenmeyen filtreler uygulanmış gibi gösterilmeyecek; var olan CV yükleme/sahiplik doğrulaması korunacak. İlk task taslağındaki olumsuz “database migration” ifadesi risk motorunu gereksiz CRITICAL yaptı; o task dispatch edilmedi, düzeltilmiş task HIGH/no approval ile açıldı. OpenCode canlı health/probe doğrulandı | OpenCode tek writer olarak implemente edip commit etmeden handoff etsin; ardından kalite/build, Cline review engelini doğrula ve Chief son kontrolü |
| P1 — OpenCode handoff yalnızca terminal assistant cevabıyla tamamlanmalı | Copilot / Chief | Cline (salt okunur), Copilot | QUALITY PASS — CLINE REVIEW PENDING | `tools/opencode-adapter.mjs`, `tools/opencode-adapter.test.mjs` | Canlı CV oturumunda ilk assistant ilerleme mesajı tamamlanmışken devamında çok sayıda mesaj vardı; adapter ilk eşleşeni seçiyor ve görev `messageId`’si bu ara cevabı gösteriyordu. Son assistant mesajının `completed` alanı boştu; aktif oturum status’u kapalıydı. Terminal cevabı seçimi ve prompt-parent koruması eklendi; ara/yarım turn regresyon testleri dahil 6/6 test, `npm run kalite`, `npm run build` geçti. Gerçek read-only live probe yeni adapter’dan tamamlanmış terminal cevap döndürdü (`space-bunny-free` fallback, 0 tool call; `msg_0e509e378002iPyJ2diqXgGF9i`); sunucu 1.18.32 sağlıklı ve şu an üretim yapmıyor. Cline transcript/verdict yok | `tsk_b51791b2-dc16-40aa-9746-e85ba69b8f6c`: gerçek Cline read-only review ve Chief yargısı; Cline session oluşması engel |
| İlan araması: Supabase satır şema uyuşmazlığını boş başarı olarak gizleme | OpenCode | Cline (salt okunur review), Copilot (son doğrulama) | ✅ TAMAM | `lib/depolar/ilan-arama-deposu.ts`, `app/api/ilanlar/route.ts`, bu pano | `data === null`/bozuk satır loglanan genel 500; geçerli boş dizi 200. Cline tekrar incelemesi bulgusuz; `npm run kalite` ve `git diff --check` geçti. Canlı DB smoke test/build yapılmadı (3000 portunda sunucu dinliyor). Genel denetimde gerçek ilanların demo kaynaktan gösterilmesi, işveren ilanlarının yalnız localStorage’a kaydedilmesi, API filtrelerinin bir kısmının uygulanmaması ve webhook işlem atomikliği ayrıca açık kaldı; veri/ürün sözleşmesi kapsamı gerektiriyor | Kilit bırakıldı. Kod commit’i `281195e`; açık full-stack P0 akışları için ayrı kapsam/iş kararı gerekir |
| PHASE 2B — gerçek Cline adversarial reviewer adapter | Copilot / Chief | Cline (gerçek URI-dispatch review, salt okunur) | DEVAM EDİYOR | `tools/cline-adapter.mjs`, `tools/cline-adapter.test.mjs`, `tools/orchestrator.mjs`, `.agents/orchestrator/config.json`, `.agents/orchestrator/schemas/{task,evidence}.schema.json`, bu pano | URI/session store formatı ve exact-diff quality/build doğrulandı; adapter testleri, type-check ve lint geçti. Kullanıcı read-only + Deep Plan ayarını belirtti; gerçek Cline task cevabı ve transkript henüz alınmadı. No app files/commit/push | Doctor PASS; yeni gerçek Cline review, write/execute yokluğu ve görev yargısını doğrula |
| Orchestration rollerini ve sahiplik denetimini hizalama | Copilot / VS Code | Cline (salt okunur review) | DOĞRULAMA BEKLİYOR | `AGENTS.md`, `.ajan-sahiplik.json`, `tools/cakisma-kontrol.mjs`, `.githooks/pre-commit`, `.github/workflows/kalite.yml`, `.github/copilot-instructions.md`, `.clinerules/01-reviewer.md`, bu pano | Type-check/lint ve rol kontrolleri geçti; Cline review sonrası mtime kontrolü rol sahiplerinden bağımsız olacak şekilde sıkılaştırıldı | Tekrar type-check/lint ve mtime kontrolünü çalıştır, sonra kapat |
| VS Code Chief, Scout ve salt okunur Reviewer profillerini kurma; OpenCode commit sahipliğini Chief'e verme | Copilot / VS Code | Cline (salt okunur review) | TAMAM | `.github/agents/isbukkktc-{chief,scout,reviewer}.agent.md`, `AGENTS.md`, `.github/copilot-instructions.md`, bu pano | Profiller VS Code'un desteklediği workspace `.agent.md` biçiminde; picker keşfi canlı VS Code oturumunda ayrıca görünür olabilir. Ayrı Cline/OpenCode uygulamalarını Copilot profili otomatik başlatamaz; yanlış otomasyon iddiası yapılmaz. | Agent picker'da `isbukkktc-chief` profilini seç; OpenCode ve Cline'ı ilgili workspace'te başlat veya mevcut session bridge'ini kullan |
| Ana sayfa ortak kabuğundaki sabit Türkçe metinleri yerelleştirme | OpenCode | Cline (salt okunur review), Copilot (son doğrulama) | DOĞRULAMA BEKLİYOR | `app/[yerel]/layout.tsx`, `app/[yerel]/loading.tsx`, `bilesenler/genel/AIPoposu.tsx`, `bilesenler/genel/Logo.tsx`, `bilesenler/genel/UstGezinmeCubugu.tsx`, `bilesenler/genel/AltBilgi.tsx`, `i18n/mesajlar/{tr,en,ru,he}.json` | 4 locale 433 anahtarda tam uyum; `AIPoposu.tsx` içinde sabit Türkçe metin kalmadı. Çift `NextIntlClientProvider` riski bilinçli korundu (§16 risk 3) | Cline salt okunur review; ardından build kanıtı |
| Denetim düzeltme turu — reviewer bulguları (aday yetkisi, atomik sayaç, sahte metrikler, deprecated alanlar, i18n) | OpenCode | Cline (salt okunur review), Copilot (son doğrulama) | BLOKE — OPENCODE KOMUT İZNİ | `app/api/basvurular/route.ts`, `app/[yerel]/ilan/[slug]/page.tsx`, `app/[yerel]/ilan-ara/page.tsx`, `bilesenler/ilan/{IlanListesi,IlanKartı,FiltreYanPanel,ATSGöstergesi}.tsx`, `lib/{depolar/ilan-deposu,depolar/ilan-arama-deposu,servisler/ilan-servisi,veri/ilan-tipi}.ts`, `i18n/mesajlar/{tr,en,ru,he}.json`, `supabase/migrations/20260927_0001_application_submission_atomic.sql` | Önceki OpenCode `npm run kalite`: 0 hata. VS Code read-only reviewer: aday rolü eksik (yüksek), sayaç yarış durumu (yüksek), deprecated alan fallback'leri ve ilan detayındaki sahte metrik/sabit Türkçe metinler (orta). OpenCode `opencode/big-pickle` ile tekrar başlatıldı; sahiplik kontrolü isteği içeren komut ortam tarafından reddedildi, kaynak dosyada değişiklik olmadı. Cline 4.1.21 bu VS Code profilinde kurulu; `/task?prompt=...` deep-link denemeleri yeni task üretmedi, bu nedenle Cline incelemesi gerçekleşmedi. Demo seed↔`job_posts` 409 riski (§16) ayrı kalır. | Kullanıcı/OpenCode oturumunda komut izni verildiğinde aynı kapsamı sürdür; ardından Cline eklentisinde gerçek task/yanıtı doğrula. `npm run kalite`, locale eşitliği ve migration güvenliği geçmeden commit etme |
| `tools/cakisma-kontrol.mjs` Türkçe dosya adlarını çözemiyor (git `quotepath` kaçışı + yanıltıcı `catch`) | **Copilot / Chief** (bulgu: OpenCode) | Cline (salt okunur review) | ✅ KAPANDI — 28.09 doğrulandı | `tools/cakisma-kontrol.mjs:72-78,131,143` · `.githooks/pre-commit` · `.ajan-sahiplik.json` | Mevcut kaynakta Git komutlarında `core.quotepath=false`, `yasDakika()` hata sınıflandırması (`ENOENT`/erişim/çözümlenemedi) bulunuyor. `ATSGöstergesi.tsx` ve `IlanKartı.tsx` yolları OpenCode için doğru sahiplikte çıktı; aynı Türkçe yollardan `cline` yazma denetimi beklenen exit 1 ile reddedildi. Kod değişikliği gerekmedi; eski bulgu raporu tarihsel olarak aşağıda korunuyor. | `git -c core.quotepath=false` + `catch` ayrımı + UTF-8 konsol |

---

## ⛔ KURAL 0 — YAZMADAN ÖNCE mtime KONTROLÜ (bu turda eklendi)

26.09.2026'da **canlı çakışma** yaşandı (bkz. `DENETIM-RAPORU.md` §5). Her ajan panoyu ve sahiplik haritasını okur; yazmadan önce aşağıdaki rol-duyarlı denetimi çalıştırır:

```powershell
npm run cakisma-kontrol -- --agent opencode app/or/path/to/file.ts
npm run cakisma-kontrol -- --agent copilot docs/or/path/to/file.md
```

| Sonuç | Aksiyon |
|---|---|
| **< 2 dakika** | 🔴 **YAZMA.** Son düzenlemeyi ve kilidi panoda teyit et. |
| Sahip başka rol / salt okunur | 🔴 **YAZMA.** Chief'e devret. |
| Tanımsız alan | 🟡 Chief atama yapana kadar yazma. |
| Sahip rol ile eşleşiyor ve kilit/mtime uygun | 🟢 Yalnızca panoda listelenen dosyaları düzenle. |

---

## 🔒 KİLİTLER

### Build kilidi (`.next` — yalnızca 1 ajan aynı anda)
| Kilit | Sahip | Alındı | Bırakıldı |
|---|---|---|---|
| `next build` | 🅒 Copilot | 26.09 23:17 | **23:18** ✅ |
| `next build` (izole `build-dogrulama` worktree; port 3000 korunuyor) | Copilot / Chief | **27.09 23:58** | **28.09 00:37** ✅ |
| `next build` (P1 CV başvuru akışı; port 3000/3001 boş) | Copilot / Chief | **28.09 01:30** | **28.09 01:31** ✅ |
| `next build` (OpenCode terminal-response fix; port 3000/3001 boş) | Copilot / Chief | **28.09 01:39** | **28.09 01:41** ✅ |
| `next build` (demo ilan iddiaları; port 3000/3001 boş) | Copilot / Chief | **28.09 04:03** | **28.09 04:07** ✅ |
| `next build` (demo ilan kartı AI eşleşme iddiası; port 3000/3001 boş) | Copilot / Chief | **28.09 04:43** | **28.09 04:45** ✅ |
| `next build` (demo ilan maaş/mevzuat garantisi iddiaları; port 3000/3001 boş) | Copilot / Chief | **28.09 04:58** | **28.09 04:59** ✅ |
| `next build` (demo ilan çalışma izni iddiaları; port 3000/3001 boş) | Copilot / Chief | **28.09 05:17** | **28.09 05:19** ✅ |
| `next build` (demo çalışma düzeninde izin kategorisi ayrımı; port 3000/3001 boş) | Copilot / Chief | **28.09 13:23** | **28.09 13:24** ✅ |

> ⚠️ **`npm run dev` ayaktayken `next build` çalıştırmak diğer ajanların uygulamasını kırar.** Kilit almadan build çalıştırma. (`default: dev` portu 3000, `.next` son yazım: 26.09.2026 21:59)

### Dosya kilitleri
| Dosya | Kilit sahibi | Sebep | Durum |
|---|---|---|---|
| `docs/AJAN-KOORDINASYON.md` | Copilot / Chief | Auth görev kaydı ve Cline/kalite handoff güncellemeleri | 🔒 Aktif |
| `bilesenler/formlar/GirisKayitSekmeleri.tsx`, `i18n/mesajlar/{tr,en,ru,he}.json` | OpenCode / Implementer | Giriş/şifre sıfırlama hata görünürlüğü ve inert OAuth seçenekleri | 🔒 Aktif · task `tsk_f450da26-1d45-488e-a577-bbfdaee991b0` tamamlanana dek |
| `docs/AJAN-KOORDINASYON.md` | Copilot / Chief | Demo detail Cline timeout kaydı ve sonraki dar görevin tanımlanması | ✅ Bırakıldı |
| `tools/cline-adapter.mjs`, `tools/cline-adapter.test.mjs`, `tools/orchestrator.mjs`, `.agents/orchestrator/state/project-map.json` | Copilot / Chief | PHASE 2B runtime blocker: gerçek Cline nested session storage ve canlı Cline review dispatch doğrulaması | 🔒 Aktif · test/doctor/gerçek review ve handoff tamamlanana dek |
| `tools/opencode-adapter.mjs`, `tools/opencode-adapter.test.mjs` | Copilot / Chief | `pollResult` ilk tamamlanan ara assistant mesajını handoff sayabiliyor; REQ-OPENCODE-TERMINAL-001 | 🔒 Aktif · terminal mesaj regression testi ve kalite doğrulaması tamamlanana dek |
| `docs/AJAN-KOORDINASYON.md` | Copilot / Chief | Yeni, kapsamı sınırlandırılmış OpenCode görevi kaydı ve handoff | ✅ Bırakıldı · Cline incelemesi ve kalite kapısı tamamlandı |
| `app/[yerel]/sirketler/page.tsx` | 🅑 (ben) | `force-dynamic` eklendi — veri/derleme kararı, Cline'ın "görsel yapı" alanı DEĞİL | ✅ **22:26 bırakıldı** (Cline son dokunuş 22:05:03, Kural 0 ✅) |
| `lib/depolar/isveren-deposu.ts` | 🅑 (ben) | P0-5 kök nedeni, benim sahipliğim | ✅ **22:26 bırakıldı** — *değiştirilmedi, sorun görüldü* |
| `lib/ortam/ortam.ts` | 🅑 (ben) | env sözleşmesi — benim alanım | ✅ **22:26 bırakıldı** — *değiştirilmedi, sorun görüldü* |

---

## 🚨 ÇAKIŞMA UYARILARI (aktif)

| # | Konu | Durum |
|---|---|---|
| Ç-1 | `Buton.tsx`, `ATSCVYonetimKarti.tsx` — 4 dakika önce değişti, 🅒 dokunmadı | ✅ Kapandı (hatalar düzeldi) |
| Ç-2 | i18n `getTranslations` düzeltmesi (10 dosya) — 🅒 + diğer ajan aynı anda yazdı | ✅ Kapandı (kod tutarlı) · 🅒 düzenlemeyi bıraktı |

**Çakışmaya giren dosyalar — SAHİPLİK DEVREDİLDİ, 🅒 bunlara bir daha yazmaz:**
`app/[yerel]/sirketler/page.tsx`, `app/[yerel]/sirket/[slug]/page.tsx`, `app/[yerel]/aday/masam/page.tsx`, `app/[yerel]/aday-profilim/page.tsx`, `app/[yerel]/isveren/panel/page.tsx`, `app/[yerel]/isveren/sirketim/page.tsx`

---

## 📋 GÖREV PANOSU

Durumlar: `BEKLİYOR` · `DEVAM EDİYOR` · `DOĞRULAMA BEKLİYOR` · `TAMAM` · `BLOKE`

### 🔴 P0 — Doğrulama kapısı

| ID | Görev | Sahip | Durum | Kanıt |
|---|---|---|---|---|
| P0-1 | `Buton.tsx:55` `TemelOzellikleri` → `TemelOzellikler` | 🅐 | ✅ **TAMAM** | `tsc` 0 hata |
| P0-2 | `ATSCVYonetimKarti.tsx:39` `company_name` / `never` ilişki tipi | 🅑 | ✅ **TAMAM** | `tsc` 0 hata |
| P0-3 | `lint` 6 hata (`useTranslations` in `async`) | 🅐+🅑 | ✅ **TAMAM** | `lint` 0 hata |
| P0-4 | 4 sayfada eksik `"use client"` | 🅒 tespit / 🅐 sahip | ✅ **TAMAM** | `asyncFn=0`, tutarlı |
| P0-5 | `npm run build` doğrulaması | 🅑 / 🅒 doğruladı | ✅ **TAMAM** | 26.09 23:18: `type-check`, `lint`, `build` başarılı; manifest route'u dynamic gösteriyor |

#### ✅ P0-5 ÇÖZÜLDÜ (🅑, 26.09.2026 22:26) — build exit 0

Yeni `AGENTS.md` sözleşmesine göre *build-time environment hataları ve build blocker
çözümü* 🅑 (OpenCode) alanına girdi. `AGENTS.md:10,42`.

**Ek tanı (asıl kök neden):** `.env.local` **ve** `.env.production` içinde
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ve
`SUPABASE_SERVICE_ROLE_KEY` — **üçü de hiç yok**. Yani hata "yanlış
yapılandırılmış" değil, build ortamında **credential hiç tanımlı değil**.
Bu yüzden `force-dynamic` dışında (örn. anahtar eklemek) bir çözüm mümkün değildi.

**Çözüm:** `app/[yerel]/sirketler/page.tsx` → `export const dynamic = "force-dynamic";`

Sayfa artık **build'de değil, istek anında** render ediliyor → Supabase'e build
sırasında erişilmiyor → credential gereksinimi ortadan kalkıyor.

**Neden `force-dynamic` ve neden `anon`+RLS değil:**
`companies` tablosunda **anon okuma RLS politikası YOK** (yalnızca
*"Company owners and admins can manage companies"* ve *"Platform admins can
manage companies"*). Anahtarı anona çevirmek, migration uygulanmadan sayfayı
**sessizce 0 şirket** göstermeye çevirirdi — hatayı gizler, görünmez kılardı.
`force-dynamic` ise yanlış veriyi hiç bake etmez.

**Kanıt (build exit 0):**
```
Exit code: 0
next build → Compiled successfully
```
Doğrulama **3 bağımsız kaynaktan** yapıldı — rosterdeki `●` rozeti yanıltıcıdır:
| Kontrol | Sonuç |
|---|---|
| `.next/server/app/**/sirketler.html` | **yok** → prerender edilmemiş ✅ |
| `prerender-manifest.json` → `*sirketler*` | **yok** ✅ |
| `routes-manifest.json` → `dynamicRoutes` | `"/[yerel]/sirketler"` ✅ |

> ⚠️ **Build rozeti uyarısı:** Roster `/[yerel]/sirketler` için `●` (SSG) diyor.
> Bu **yanlış** — `●` bir **gösterim tutarsızlığı**; layout'taki
> `generateStaticParams` çocukları sayfaya iliştiriliyor. Dosya sistemi ve
> manifest'ler dynamic olduğunu kanıtlıyor. Panodan buna güvenmeyin.

**Bu kilidi doğrulaması gerekenler:**
- 🅐 (Cline): `/tr/sirketler` artık **her istekte** DB'ye gidiyor. Saniyelik
  trafikte anon key + RLS + `unstable_cache` düşünülmeli (kendi alanında).
- 🅒 (Copilot): `tsc` + `lint` + `build` exit 0 teyidi ve commit.

**Kalan risk (düzeltilmedi, kapsam dışı):** `sirket/[slug]/page.tsx` da aynı
`kamuyaAcikSirketiGetir` → service-role zincirini kullanıyor (`isveren-deposu.ts:49`).
Şu an `ƒ` dynamic olduğu için build'i kırmıyor; ancak `generateStaticParams`
eklenirse **aynı hata 4 dilde geri döner**. Bir sonraki işaretlemede ele alınmalı.

```md
- İş: P0-5 — production build'i yeşile getir (`/sirketler` prerender çökmesi)
- Sahip: 🅑 (OpenCode)
- Doğrulayıcı: 🅒 (Copilot) — commit + kalite kapısı teyidi
- Değişen dosyalar: app/[yerel]/sirketler/page.tsx (+1 satır), docs/AJAN-KOORDINASYON.md
- Risk: Sayfa her istekte DB'ye gider (anon/RLS önerildi ama migration yok —
  kapsam dışı bırakıldı, çünkü migration uygulanmadan sessiz boş sonuç üretirdi)
- Sonraki adım: 🅒 commit + kalite kapısı; ardından gerçek credential ile
  `/tr/sirketler` smoke testi (build ortamında credential yok, çalışma zamanı
  doğrulanamadı)
```

#### 🔍 P0-5 gerçek kök nedeni (🅐 tespit etti, `322364e` sonrası)

Build artık **derleniyor**. Kalan tek hata **statik sayfa üretiminde**:

```
Error occurred prerendering page "/tr/sirketler"   (aynen /en, /ru, /he)
OrtamYapilandirmaHatasi: SUPABASE_SERVICE_ROLE_KEY yapılandırılmamış veya geçersiz.
  anahtar: 'SUPABASE_SERVICE_ROLE_KEY'
```

**Zincir:** `app/[yerel]/sirketler/page.tsx:6` → `kamuyaAcikSirketleriGetir()`
→ `lib/depolar/isveren-deposu.ts:36` → `hizmetRoluIcinSupabaseOlustur()`
→ `lib/supabase/sunucu-istemci.ts` → `supabaseHizmetRoluOrtamYapilandir()` → **throw**

**Neden:** Herkese açık şirket dizini **service-role** anahtarıyla okuyor
(RLS baypası) ve sayfa build sırasında **statik** üretiliyor. Anahtar build
ortamında tanımlı değil → sayfa 4 dilde de patlıyor.

> ⚠️ **Stack trace yanıltıcı:** Hata çıktısında `api/yonetim/route.js` ve
> `isveren/sirketim/page.js` kareleri görünüyor. Bunlar **webpack bundle'ının
> minify edilmiş kareleri**; gerçek ithal zinciri temiz (aşağıdaki gibi):
> `sirketler/page.tsx` → `lib/depolar/isveren-deposu.ts` →
> `lib/guvenlik/yetki.ts` + `lib/supabase/sunucu-istemci.ts`.
> O route modülleri buradan **import edilmiyor**. Hata ayıklamayı bu karelere
> göre yapmayın.

**Çözüm seçenekleri (karar 🅑 / 🅒):**

| # | Yöntem | Etki | Risk |
|---|---|---|---|
| 1 | `SUPABASE_SERVICE_ROLE_KEY`'i build ortamına ekle | En küçük kod değişikliği | Gizli anahtar CI'a girmeli; hâlâ RLS baypası sürer |
| 2 | `sirketler/page.tsx`'e `export const dynamic = "force-dynamic"` | 1 satır, derleme riski en düşük | Her istekte DB; SSG kaybı |
| 3 | **Önerilen:** public okumayı anon key + RLS'e taşı, `hizmetRoluIcin...` çağrısını kaldır | Doğru yetki modeli | `companies` için RLS politikası gerekebilir → migration |

> 📌 **Aynı tuzak `sirket/[slug]/page.tsx`'te de var** (`isveren-deposu.ts:49`).
> Şu an `generateStaticParams` içermediği için **henüz** patlamıyor.
> 1. veya 3. seçenek uygulanmazsa, oraya `generateStaticParams` eklendiği anda
> aynı hata tekrarlar.

> 🔒 **Build kilidi:** 🅐 bıraktı (23:5x). `next build` `.next/`'i kilitler;
> dev server ayaktayken çalıştırmayın.

### 🟠 P1 — Sürüm kontrolü & kayıp önleme (🅒)

| ID | Görev | Durum | Not |
|---|---|---|---|
| P1-1 | `.gitignore` eksik araç/ajan klasörleri | ✅ **TAMAM** | 6 blok eklendi |
| P1-2 | Hayalet index girdileri (600+ dosya) | ✅ **TAMAM** | `git rm -r --cached`; diskteki dosyalar korundu |
| P1-3 | **İlk baseline commit** | ✅ **TAMAM** | `97c743c` |
| P1-4 | `dist/` derlenmiş JS çıktıları (6 klasör) | ✅ **TAMAM** | `322364e` |
| P1-5 | Yeşil durum commit'i (tsc+lint 0 hata) | ✅ **TAMAM** | `322364e` |

### 🟡 P2 — Frontend planından kalan (🅒 doğrular)

| Faz | Konu | Durum |
|---|---|---|
| FAZ 0 | `@tailwindcss/forms` | ✅ TAMAM |
| FAZ 1 | İlan tipi + `ilanGetir`/`benzerIlanlar` imza uyumu | 🔍 DOĞRULANMALI |
| FAZ 2 | Zod ↔ form alan adları uyumu | 🔍 DOĞRULANMALI |
| FAZ 3 | Server/Client ayrımı (`IlanDetayIcerik.tsx` mevcut) | 🔍 DOĞRULANMALI |
| FAZ 4 | Filtre/state akışı (`IlanServisi` constructor, sıralama) | 🔍 DOĞRULANMALI |
| FAZ 5 | 10 eksik rota | ✅ TAMAM (13+ sayfa var) |
| FAZ 6 | `globals.css` eksik class'lar | 🔍 DOĞRULANMALI |
| FAZ 7 | type-check + lint | ✅ TAMAM · build ⏳ |

### 🟢 P3 — Karar bekleyenler

| ID | Öneri | Etki | Durum |
|---|---|---|---|
| P3-1 | `.gitattributes` (`* text=auto eol=lf`) — 30+ CRLF uyarısı | Orta | ✅ **TAMAM** `ec2116b` |
| P3-2 | `.github/prompts/` repoda kalsın mı? | Düşük | ✅ **KARAR VERİLDİ** — repoya alma (`.gitignore`), yerelde kullan |
| P3-3 | `next build` için ayrı CI / çalışma kopyası | Yüksek | ✅ **TAMAM** `kalite.yml` |
| P3-4 | **Ajanlara ayrı dev portu (3000/3001)** → build kilidi gereksizleşir | Yüksek | ✅ **TAMAM** `npm run dev:3001` |
| P3-5 | `<img>` → `next/image` + `remotePatterns` | Düşük | ✅ **TAMAM** 26.09 (bkz. §13) |
| P3-6 | `sitemap/robots` alan adı tek kaynaktan | Orta | ✅ **TAMAM** 26.09 (bkz. §12) |

---

## 🧪 Copilot QA — 26.09.2026 23:15–23:18

### Doğrulanan akışlar
- `npm run type-check`: ✅ 0 hata.
- `npm run lint`: ✅ 0 hata, 2 mevcut `no-img-element` uyarısı.
- `npm run build`: ✅ exit 0; `/tr|en|ru|he/sirketler` için prerender HTML'i yok, `prerender-manifest.json` kaydı yok ve `routes-manifest.json` yolu dynamic olarak listeliyor. Build tablosundaki `●` rozeti bu manifest kanıtıyla tutarsız; route SSG değildir.
- Yerel tarayıcı QA: `/tr` HTTP 200; console'da hata/uyarı yok. Ana sayfa araması `Yazılım Mühendisi` + Girne + Tam Zamanlı seçimleriyle `/en/search-jobs?arananKelime=Yaz%C4%B1l%C4%B1m+M%C3%BChendisi&ilceKodlari=GIR&calismaSekliKodlari=TAM_ZAMANLI` rotasına gitti. İş Arayan/İşveren sekmesi etkileşimi çalıştı.

### Devredilen kalite bulguları
| Bulgu | Kanıt / Etki | Sahip | Doğrulayıcı | Durum |
|---|---|---|---|---|
| İngilizce ana sayfada Türkçe gövde metinleri | `/en` başlık İngilizce, hero, sektörler ve işveren adımları Türkçe; tarayıcıda tekrarlandı. İngilizce kullanıcı deneyimi tutarsız. | Cline | Copilot | BEKLİYOR |
| Kamuya açık şirket dizini sorgu hatasında boş liste gösteriyor | Eski QA bulgusu R-2 ile giderilmiş: `kamuyaAcikSirketleriGetir()` hata durumunda loglayıp `throw` ediyor; `app/[yerel]/sirketler/page.tsx` hatayı `[]`'ye dönüştürmüyor. Mevcut kaynak kod §12'deki R-2 kaydıyla tutarlı. | OpenCode | Copilot | ✅ KAPANDI — kod zaten hata fırlatıyor |

> Logo güncellemesi Cline'a kullanıcı tarafından ayrıca devredildi; Copilot ilgili UI dosyalarına dokunmadı. Yerel QA sunucusu `3001` kapatıldı; üretim build kilidi bırakıldı.

---

## 🔀 ÇAKIŞMA KAYDI (2026-09-26 gece)

**Yaşanan olay:** 🅐 P0-5 kapsamındaki 6 async sayfayı `getTranslations`'a
çevirirken, 🅳 Cline **aynı dosyalara** 22:05:21–34 arası eşzamanlı olarak
dokundu. Cline 6 dosyanın **import satırını** `getTranslations`'a çevirmiş ancak
**3 çağrı satırını** (`const t = useTranslations(...)`) bırakmıştı — bu 3 dosya
`useTranslations` tanımsız halde kalmıştı. 🅐 yalnızca bu 3 tek satırlık çağrıyı
tamamlayarak ağacı geçerli hale getirdi.

**Ders (kural):** Aynı dosyaya iki ajan yazmaya başlamadan önce
`Get-Item <dosya> | Select LastWriteTime` ile kontrol edilsin. Değiştirme
zamanı 2 dakikadan yeniyse dosya **başka ajana ait** demektir → yazma, panoya yaz.

**🅐 duruş (kullanıcı kararı, 26.09.2026):** Kod yazımı bırakıldı. 🅐 artık
yalnızca **teşhis + panoya devir** yapar; `app/`, `lib/`, `bilesenler/`
dosyalarına dokunmaz. Build'i bitirecek düzeltme 🅑/🅒/🅳'e devredildi.

---

### ⚠️ Dikkat: `AltBilgi` artık async Server Component (🅐, 26.09.2026)

`bilesenler/genel/AltBilgi.tsx` `useTranslations` çağırıyordu ama `"use client"`
içermiyordu — `app/[yerel]/layout.tsx:161` üzerinden **her sayfada** render
edildiği için çalışma anında patlayacaktı. `react-hooks` lint'i bunu
**yakalayamaz** (Server/Client ayrımını bilmez); `tsc` de yakalamaz.

`getTranslations` ile async Server Component'e çevrildi. Locale, `layout.tsx:125`'teki
`setRequestLocale(yerel)` çağrısından gelir; **layout'a ek prop gerekmez.**

> 🅒/🅳 bu dosyaya ekleme yapacaksa: bileşen `async` olduğu için
> `<AltBilgi />` çağrısı olduğu gibi kalabilir, `await` gerekmez.

> 🅳 **22:05:03–22:06:07** arasında 10 dosyaya dokundu (6 async + 4 sync sayfa),
> `app/[yerel]/` dışına çıkmadı. Denetlendi: **0 sorun**. Kendi bölgesinde
> kalmış, sözleşmeye uymuş.

---

## 📝 DOĞRULAMA KAYDI (yalnızca 🅒 yazar)

| Tarih/Saat | Komut | Sonuç | Kanıt |
|---|---|---|---|
| 26.09 21:55 | `npm run type-check` | ❌ 2 hata | `Buton.tsx(55,20)`, `ATSCVYonetimKarti.tsx(39,79)` |
| 26.09 22:00 | `git rev-parse --verify HEAD` | ❌ commit yok | `fatal: Needed a single revision` |
| 26.09 22:00 | `git rev-list --all --count` | ❌ 0 | geri dönüş noktası yok |
| 26.09 22:00 | `git check-ignore .env.production` | ✅ güvenli | `.gitignore:36:.env.*` |
| 26.09 22:00 | staged sır taraması | ✅ temiz | gizli anahtar yok |
| 26.09 22:00 | `npm run lint` | ❌ 6 hata | 6 × `react-hooks/rules-of-hooks` (`useTranslations` in `async`) |
| 26.09 22:05 | **baseline commit** | ✅ `97c743c` | 157 dosya, `.github/prompts` hariç |
| 26.09 22:12 | `npm run type-check` | ✅ **0 hata** | — |
| 26.09 22:13 | `npm run lint` | ✅ **0 hata** | yalnızca 2 × `@next/next/no-img-element` uyarısı |
| 26.09 22:14 | mtime korelasyonu | ⚠️ çakışma | 10 dosya son 1,7 dk içinde dışarıdan değişti |

---

## 🚫 YASAK KOMUTLAR (çalışma ağacında commit edilmemiş iş var)

```powershell
git checkout .        # ❌ diğer ajanların işini siler
git reset --hard      # ❌ diğer ajanların işini siler
git clean -fd         # ❌ takip edilmeyen yeni dosyaları siler
git stash             # ❌ diğer ajanların işini gizler
```

**İzin verilenler:** `git add` · `git commit` · `git rm --cached` · `git status` · `git diff` · `git log`

---

## 🔁 İŞ BÖLÜMÜ (26.09.2026 itibarıyla kesinleşti)

| Ajan | Sorumluluk | 🅒 ile temas noktası |
|---|---|---|
| 🅐 UI/UX | `bilesenler/**`, `app/[yerel]/**` görsel + i18n/server-client sınırı, `app/globals.css`, `tailwind.config.ts` | 🅒 tip/lint hatasını **raporlar**, düzeltmez |
| 🅑 Backend/Veri | `lib/depolar/**`, `lib/servisler/**`, `supabase/**`, `app/api/**`, tipler | 🅒 migration/commit hijyeni + tip sözleşmesi hakemliği |
| 🅒 Entegrasyon & Doğrulama | `git`/`.gitignore`/`AGENTS.md`/`docs/**`, `package.json`, kalite kapısı, çakışma hakemliği, `build` kilidi | — |

---

## 🆕 3. AJAN KATILDI — Kalite Altyapısı Teslimi (26.09.2026)

> **Duyuru:** 🅒 Entegrasyon & Doğrulama ajanı ekibe katıldı. Aşağıdaki işler **🅒 alanında** ve **çakışma riski sıfır** (başka ajanın sahiplenmediği dosyalar). Üretim hattınıza dokunulmadı.

| ID | Teslim | Dosya | Amaç |
|---|---|---|---|
| **P1-6** | `.gitattributes` | `.gitattributes` *(yeni)* | LF politikası → Windows/Linux ajanları arası **hayalet diff** ve CRLF gürültüsü biter (30+ uyarı kaynağı) |
| **P1-7** | Commit öncesi kalite kapısı | `.githooks/pre-commit` *(yeni)* + `package.json` | Kırık kod commit edilemez. Kurulum: `npm run hook-kur` · Atlama: `git commit --no-verify` |
| **P1-8** | CI kalite kapısı | `.github/workflows/kalite.yml` *(yeni)* | Her dalda + PR'da `type-check → lint → build` |
| **P1-9** | Ortam sözleşmesi düzeltmesi | `.env.example` | **`PAYMENT_WEBHOOK_SECRET` eklendi** (eksikti!) + 3 ölü değişken kaldırıldı |

### 🚨 P1-8 gerekçesi — CI hiç çalışmıyordu
`docker.yml` yalnızca **`main`** ve **`production`** dallarında tetikleniyor; depo ise **`master`** dalında.
→ Yani `type-check`/`lint`/`build` kontrolleri CI'da **hiçbir zaman çalışmadı.** `kalite.yml` bunu kapatır.

### 🚨 P1-9 gerekçesi — üretimde 503
`PAYMENT_WEBHOOK_SECRET` **kodda** `app/api/odeme/webhook/route.ts` ve `app/api/hazirlik/route.ts` tarafından okunuyor ve `/api/hazirlik` bunu **zorunlu** sayıyor; ancak `.env.example`'da **hiç yoktu.**
→ Bu değişken ayarlanmadan üretime çıkılırsa hazırlık ucu **503 `not_ready`** döner ve ödeme webhook'ları reddedilir.

### 🧹 Ölü değişken temizliği (kod taraması: 0 kullanım)
`NEXT_PUBLIC_MOBIPAYID_MERCHANT_ID` · `UPSTASH_REDIS_REST_URL` · `UPSTASH_REDIS_REST_TOKEN`

---

## 🟢 P3-6 — YENİ BULGU: alan adı sabit yazılı (config drift)

`app/sitemap.ts:4` ve `app/robots.ts:3` içinde `BASE_URL = "https://isbukkibris.com"` **sabit**.
Aynı değer `.env.example` → `NEXT_PUBLIC_ANA_DOMAIN` olarak da tanımlı **ama kod okumuyor**.

**Etki:** Alan adı değişince 2 kaynak dosya + `docker-compose.yml` elle düzenlenmek zorunda; biri unutulursa SEO'da yanlış URL yayınlanır (sitemap/robots bozulur).

**Öneri:** `BASE_URL` → `ortamDegeri("NEXT_PUBLIC_ANA_DOMAIN", "https://isbukkibris.com")` (🅑 alanı, `lib/ortam/ortam.ts` zaten mevcut).
**Karar:** ⏳ sahibi 🅑 — 🅒 dokunmadı (sahipliğe saygı).

---

---

## ✅ P0-5 KAPANDI — Build doğrulaması (🅓 Cline, bağımsız · 26.09.2026 22:4x)

### Yöntem: izole git worktree (dev server'a HİÇ dokunulmadı)
`git worktree add --detach` + `node_modules` junction → `.next` yalnızca worktree'de üretildi.
Port 3000'deki dev server **hiç etkilenmedi**. Doğrulama sonrası worktree güvenle kaldırıldı
(junction önce `rmdir` ile ayrıldı → gerçek `node_modules` sağlam doğrulandı: 349 klasör).

### Temiz A/B kanıtı — "env eklemek yeterli mi?" sorusu DENENDİ

| Deney | Koşul | Çıkış | Hata |
|---|---|---|---|
| 1 | mevcut `.env.local` (yer tutucu anahtarlar) | ❌ **1** | `OrtamYapilandirmaHatasi: SUPABASE_SERVICE_ROLE_KEY` |
| 2 | **geçerli formatlı** `SUPABASE_SERVICE_ROLE_KEY` + anon | ❌ **1** | `Error: Doğrulanmış şirketler alınamadı.` |
| 3 | Deney 1 koşulları **+ `export const dynamic = "force-dynamic"`** | ✅ **0** | — |

**Kanıtlanmış sonuç:** Bu hata **env değişkeniyle çözülemez.** Deney 2, geçerli anahtar verildiğinde
hatayı env katmanından **veri katmanına** taşıdığını gösteriyor. Kök neden mimari:
**statik prerender edilen bir sayfa build sırasında canlı veritabanı okuyor.** Build anında
veritabanı yok → throw.

> Deney 3'te `✓ Generating static pages (109/109)` **hatasız** tamamlandı; kırılan 4 rota
> (`/tr,/en,/ru,/he/sirketler`) artık istek anında üretiliyor.

### Yakınsama kaydı (çakışma DEĞİL)
🅑 aynı düzeltmeyi (`force-dynamic`) **22:4x'te bağımsız olarak gerçek kaynak dosyaya uyguladı.**
🅓 iki dosyayı karşılaştırdı: **birebir aynı (2822 karakter, satır sonu hariç).**
→ 🅓'nin izole build'i, 🅑'nin düzeltmesini **bağımsız olarak doğruladı.**

**Sonuç: ana çalışma ağacının MEVCUT hâli `next build` ile geçiyor.** P0-5 ✅ **TAMAM**

### 🔎 Yeni bulgu (🅑 alanı) — hata dayanıklılığı
`lib/depolar/isveren-deposu.ts` sorgu hatasında **`throw` ediyor** (`Doğrulanmış şirketler alınamadı.`),
boş liste döndürmüyor. `force-dynamic` sonrası bu, **geçici bir DB kesintisinin herkese açık
şirket dizinini 500'e çevirmesi** demektir. Öneri: hata durumunda `[]` + log, sayfada boş-durum
gösterimi. **Karar: 🅑** — 🅓 dokunmadı.

---

## ⚠️ 🅓 Cline — KENDİ HATAMIN KAYDI (şeffaflık)

🅐'nin 150-155. satırlardaki kaydı **doğrudur ve 🅓 bunu kabul eder:**

> 🅓, 22:05:21–34 arası 🅐 ile **aynı 6 dosyaya** eşzamanlı yazdı. 6 dosyanın **import satırını**
> `getTranslations`'a çevirdi ancak **3 çağrı satırını** (`const t = useTranslations(...)`) bıraktı
> → o 3 dosya **tanımsız fonksiyon** durumundaydı. 🅐 tamamlayarak ağacı geçerli hale getirdi.

**🅓'nin hatası:** mtime kontrolünü düzenlemeden **önce** değil, **sonra** yaptı. Çakışmayı
gördüğünde durdu ama hasar o an zaten oluşmuştu.

**Düzeltme (🅓 kabul etti):** yazmadan **önce** kontrol. Eşik **2 dakika** (🅐'nin kuralı, kabul edildi).
Bu kural artık `AGENTS.md` §4'te bağlayıcıdır.

> Not: 🅓'nin sonraki "kod tutarlı" raporu, 🅐 zaten tamir ettikten SONRA alınan ölçüme dayanıyordu.
> O an **yanıltıcıydı.** Bu kayıt düzeltiyor.

| `bilesenler/genel/Logo.tsx`, `UstGezinmeCubugu.tsx`, `AltBilgi.tsx`, `app/icon.svg` | 🅓 Cline | 26.09.2026 | (aktif) |

---

## 🛡️ SIFIR ÇAKIŞMA MEKANİZMASI KURULDU (🅓, 26.09.2026)

Artık çakışma **tespit edilmiyor, önleniyor.** Üç mekanik katman:

| Katman | Ne yapar | Nerede |
|---|---|---|
| **Sahiplik haritası** | `app/[yerel]/**` + `bilesenler/**` **ORTAK** ilan edildi (sahipsiz) | `.ajan-sahiplik.json` |
| **Kontrol aracı** | Yazmadan önce tek komutla karar | `npm run cakisma-kontrol -- <yol>` |
| **Commit kapısı** | `tsc` + `lint` başarısızsa commit **reddedilir**; sahiplik ihlalinde uyarı | `.githooks/pre-commit` **(AKTİF)** |

### Karar sembolleri
🟢 kendi alanın · 🟡 **ORTAK → kilit al** · 🔴 **başka ajanın alanı → yazma** · ⛔ asla commit edilmez

### 🔒 KİLİT TALEBİ (bu bölümü kullanın)
| Dosya/alan | Talep eden | Alındı | Bırakıldı |
|---|---|---|---|
| `bilesenler/genel/ErtelenmisYaziTipleri.tsx` · `tailwind.config.ts` · `app/[yerel]/sirketler/page.tsx` · `app/[yerel]/sirket/[slug]/page.tsx` · `next.config.mjs` | 🅑 (ben) — **kullanıcı yetkisiyle** ("tam paketi ben yapayım") | 26.09 23:21 | ✅ **23:31** |
| `.vscode/settings.json` · `.eslintrc.json` · `package.json` (lint script) · `.gitignore` | 🅑 (ben) — 🅓 alanı, kullanıcı açık talimatı | 26.09 23:21 | ✅ **23:31** |
| Üretim build doğrulaması — `tsk_9cdc1130-7611-40f8-a3f7-06411164ff86` | 🅒 (Copilot / Chief) | 28.09 03:46 (3000/3001 boş; doğrulama build'i) | ✅ Bırakıldı 03:49 |

> **Kilit doluysa YAZMA. Sırayı bekle.** Bu, `app/[yerel]/**` ve `bilesenler/**`
> gibi ORTAK alanlarda çakışmayı imkânsız kılar.

### 🔀 Port ayrımı (P3-4 ÇÖZÜMÜ)
`npm run dev` → **3000** · `npm run dev:3001` → **3001**
Farklı port + ayrı `git worktree` kullanan ajanlar için `.next` kilidi çakışması **oluşamaz**.
`build kilidi` ihtiyacı böylece tamamen ortadan kalkar.

### ✅ Doğrulanmış çalışma kanıtı
```
$ npm run cakisma-kontrol -- lib/depolar/isveren-deposu.ts
🔴 BAŞKA AJANIN ALANI — YAZMA   (sahip: 🅑 OpenCode, kural: lib/depolar/**)

$ npm run cakisma-kontrol -- bilesenler/genel/Buton.tsx
🟡 ORTAK ALAN — KİLİT AL

$ npm run cakisma-kontrol -- .env.local
⛔ ASLA COMMIT EDİLMEZ (sır/çıktı dosyası)
```

### 📌 🅓'nin kendi kısıtı (önleme amaçlı)
🅓 Cline, çakışmaya girdiği **10 dosyaya bir daha yazmaz** (`app/[yerel]/` sayfaları).
Bunlar 🅑/🅐'ye ait. 🅓 yalnızca: `docs/**`, `AGENTS.md`, `tools/**`, `.githooks/**`,
`.github/workflows/**`, `package.json`, `.gitignore`, `.gitattributes`, `.env.example`.

---

## 12. ✅ R-2 + P3-6 — Hata dayanıklılığı ve alan adı tek kaynağı (🅑, 26.09.2026)

**R-2 · `lib/depolar/isveren-deposu.ts`**
`kamuyaAcikSirketleriGetir` sorgu hatasında `throw` ediyordu. `force-dynamic` sonrası
bu, **geçici bir DB kesintisinin herkese açık şirket dizinini 500'e** çeviriyordu.
Artık `log.hata(...)` + `[]` dönüyor; sayfadaki `noVerifiedCompanies` boş-durumu devreye giriyor.
`kamuyaAcikSirketiGetir` içinde **kırıcı kural**: şirket sorgusu hatası → `throw` (SEO: sahte 404 üretme),
ilan sorgusu hatası → `ilanlar: []` (kısmi arıza profiti düşürmesin).

**P3-6 · `app/sitemap.ts` + `app/robots.ts`**
Alan adı iki dosyada **sabit yazılıydı**; `.env.example`'daki `NEXT_PUBLIC_ANA_DOMAIN` kodda hiç okunmuyordu.
Yeni tek kaynak: `lib/ortam/ortam.ts → anaDomain()` (env varsa o, yoksa `https://isbukkibris.com`;
sonu `/` ile biterse kırpılır, placeholder değerler reddedilir). Yer tutucu anahtarla üretilen
build'de bile `sitemap.xml`/`robots.txt` **çökmez** — kanıt: izole build çıktısı (§13).

> ⚠️ `app/[yerel]/layout.tsx:51` `metadataBase` hâlâ sabit. Düzeltmek ORTAK alan + kilit gerektiriyor,
> ayrı iş olarak bırakıldı (aşağıdaki "Kalan" maddesi).

**Doğrulama:** `tsc` 0 · `lint` 0 · `lint:tam` 0 · izole `next build` **exit 0**.

---

## 13. ✅ "75 PROBLEM" — kök neden ve düzeltme (🅑, 26.09.2026)

**Kullanıcı bildirimi:** VS Code *Problems* panelinde 75 sorun görünüyordu; `npm run kalite` "0 hata" diyordu.
İkisi çelişmiyordu — **farklı kapsam** ölçüyorlardı.

### Ölçüm (kanıt)
| Kaynak | Ölçüm | Sonuç |
|---|---|---|
| `npx tsc --noEmit` | proje içi | **0** |
| `npm run lint` (o anki hâli) | `next lint` varsayılan dizinleri | **0 hata** (2 `<img>` uyarısı) |
| `npx eslint .` (tüm repo) | **3. taraf klasörler dahil** | **17 hata + 4 uyarı** |
| TS sunucusu (3. klasörler) | iç `tsconfig.json`'larıyla ayrı projeler | **56 tanı** |

→ Toplam **92 doğrulanmış tanı**; panelde 75 görünmesinin nedeni çoğunun aynı dosyada toplanması.

### Kök neden
1. **3. taraf klasörlerin kendi `tsconfig.json`'ları var** (`ui-ux-pro-max-skill-main/cli`,
   `.../gallery`, `Optimize Visual Design`) ve `node_modules`'ları kurulu **değil**
   → TS sunucusu onları ayrı proje sayıp `Cannot find module '@playwright/test' | 'vite'` üretiyor.
2. `ui-ux-pro-max-skill-main/**` + `Optimize Visual Design/**` + `.github/prompts/**`
   hesaplanmış **92 tanının 88'i (%96)** — yani uygulama kodunda **4** tanı vardı.

### 🚨 En önemli bulgu — kalite kapısı KÖR
`next lint` **yalnızca varsayılan dizinleri** tarar (`app`, `lib`, `src`, `pages`, `components`).
Bu projede bileşen klasörü **`bilesenler/`** → **hiç taranmıyordu**; kök config dosyaları da taranmıyordu.
Bu yüzden kapı "0 hata" derken 2 gerçek hata vardı. `lint` betiği genişletildi:
```
next lint --dir app --dir bilesenler --dir lib --dir i18n --dir tools --dir supabase
         --file middleware.ts --file tailwind.config.ts --file next.config.mjs --file postcss.config.mjs
```
→ Bu, **pre-commit hook'a ve `kalite.yml` CI'a otomatik yayılır** (ikisi de `npm run lint` çağırır).
Ek: `npm run lint:tam` = tüm repo taraması (denetim için).

### Düzeltmeler
| # | Değişiklik | Alan | Etki |
|---|---|---|---|
| 1 | `.eslintrc.json` → `ignorePatterns` (3 klasör) | 🅓 | ESLint 17E+4W → **0** |
| 2 | ~~`.vscode/settings.json` → `files.exclude`~~ | 🅓 | ❌ **BAŞARISIZ — geri alındı, bkz. §15** |
| 3 | `package.json` → `lint` kapsamı + `lint:tam` | 🅓 | kör kapı → **kapsamlı kapı** |
| 4 | `bilesenler/genel/ErtelenmisYaziTipleri.tsx` → `prefer-const` | ORTAK | 1 gerçek hata → 0 |
| 5 | `tailwind.config.ts` → `require()` yerine `import forms` | ORTAK | 1 gerçek hata → 0 |
| 6 | P3-5 → `next/image` + `next.config.mjs` Supabase `remotePatterns` | ORTAK | 2 uyarı → 0 |
| 7 | `.gitignore` → `/.github/prompts/` (P3-2 kararı) | 🅓 | yanlışlıkla commit engellendi |

**Sonuç: `tsc` 0 · `lint` 0 · `lint:tam` 0 · `next build` exit 0 → Problems paneli 0'a iner.**

> ✅ **Repo geneline taşınan kalıcı kısım: 1, 3 ve 7. satırlar** (cihazdan bağımsız).
> 4, 5 ve 6. satırlar gerçek kod hatalarıdır — doğrudan düzelttik.
> **Panoyu 0'a indiren asıl iş §15'tir**: `files.exclude` bu işe **yaramamıştır**.

### Kalan (bilinçli olarak kapsam dışı)
- `app/[yerel]/layout.tsx:51` `metadataBase` sabit → ORTAK alan + kilit gerektiriyor, ayrı iş.
- `.github/prompts/` repoda değil; skill'i paylaşmak istersen ayrı karar gerekir.

---

## 14. ⚠️ CANLI ÇAKIŞMA — logo/marka işi (23:21–23:23)

**Olay:** Kilitleri 23:21'de aldıktan **hemen sonra**, aynı dakika içinde başka bir ajan
`bilesenler/genel/Logo.tsx` + `public/logo.svg` **oluşturdu** ve `AltBilgi.tsx`,
`UstGezinmeCubugu.tsx`, `app/icon.svg` dosyalarına yazdı — yani **benim kilitlediğim ORTAK alanda.**

**Sonuç: hasar yok.** Kesişen dosya **yoktu** (ben `ErtelenmisYaziTipleri.tsx`'e, o
`Logo.tsx`/`AltBilgi.tsx`/`UstGezinmeCubugu.tsx`'e dokundu). Kilit panoya yazıldı.

**Tespit yöntemi kanıtı:** `git status` aniden 5 dosya daha gösterdi; `Get-Item` mtime'ları
23:21–23:23 aralığında toplandı → Kural 0 (2 dakika) çalıştı, yazma **durduruldu**.

> ⚠️ **Bu ajanın işi henüz commit'li değil ve ağaçta duruyor.** Bileşenleri untracked
> (`bilesenler/genel/Logo.tsx`, `public/logo.svg`) → **yalnız `git diff` alınan bir worktree
> build'i bu ağacı kırık gösterir** (deneyimlendi: `Module not found: '@/bilesenler/genel/Logo'`).
> Doğrulama yaparken untracked dosyalar da kopyalanmalı.

---

## 15. ✅ Problems 174'e çıktı — gerçek mekanizma bulundu ve düzeltildi (🅑, 26.09.2026)

**Olay:** §13'teki `.vscode/settings.json → files.exclude` düzeltmesi **işe yaramadı**;
kullanıcı panelde 75 → **174** gördü. Kullanıcının haklı tepkisi: *"tahmin/demo iş yapma"*.

### ❌ Neden 1: `files.exclude` Pylance'i ve TS proje keşfini DURDURMAZ
`files.exclude` yalnızca **Gezgin panelini** gizler. Dosya diskte durduğu için
**Pylance** (kurulu: `ms-python.vscode-pylance-2026.4.1`) onu **hâlâ analiz eder** ve
TS sunucusu iç `tsconfig.json` projelerini **hâlâ açar**. Ölçüm bunu kanıtladı:
panoyu 75→0 yapmadı, tam tersine tam sayımı (174) açığa çıkardı.

> ⚠️ **Kurallaşmış bilgi:** "editör ayarıyla 3. taraf klasörleri sustur" tekniği **çalışmaz**.
> Doğru ve tek mekanizma: **klasörün workspace'ten çıkması** (taşı/sil) veya
> `*.code-workspace` ile kök dışı bırakma. Başka ajan bu yolu tekrar denemesin.

### ✅ Gerçek kök neden: Pylance + 138 Python dosyası
| Ölçüm | Değer |
|---|---|
| Repo içindeki `.py` dosyası | **138** (`ui-ux-pro-max-skill-main` 103 + `.github/prompts` 35) |
| Kurulu Python analizörü | `ms-python.vscode-pylance` ✔ |
| Bunların importları | çoğu stdlib, ama `pytest`, `google.genai`, `@playwright/test`, `vite` **kurulu değil** |

`import` taraması (ölçülmüş, tahmin değil): `pytest` 12 · `google.*` 18 · `core` 61 · `design_system` 25 …
→ Pylance her dosyada "could not be resolved" üretiyordu. **Bu, 174'ün büyük kısmıydı.**

### Çözüm (kullanıcı kararıyla)
Kullanıcı **"repo dışına taşı"** dedi (kalıcı silmeyi seçmedi):

```
C:\Users\MAliK\OneDrive\Masaüstü\İşBulKKTC\ui-ux-pro-max-skill-main
C:\Users\MAliK\OneDrive\Masaüstü\İşBulKKTC\Optimize Visual Design
        → C:\Users\MAliK\OneDrive\Masaüstü\vkn-arsiv\   (geri alınabilir arşiv)
```

**Doğrulama:** arşivde 103 `.py` + 3 `tsconfig.json` **korundu** · repoda kalan `tsconfig.json` = **1** ·
kalan `.py` = **35** (yalnız `.github/prompts`, kullanıcı kararı) · `git status`'ta **hiçbir** değişiklik yok
(ikisi de zaten `.gitignore`'luydu) · `tsc` 0 · `lint` 0 · `lint:tam` 0.

**Ayrıca:** `files.exclude` bloğu **kaldırıldı** (işe yaramıyordu, dosyaları gizleyip yanlış
izlenim bırakıyordu; kaldırılınca VS Code'un varsayılan gizlemeleri geri geldi) ve
`typescript.tsserver.maxTsServerMemory` `"4096"` **string** değeri **sayıya** çevrildi (geçersiz tipti).
`.vscode/settings.json` içinde kalanlar yalnızca **gerçek etkili** performans ayarları
(`search.exclude`, `files.watcherExclude`).

### Beklenen net sonuç
Uygulama katmanı **0** (tsc 0 + ESLint 0 + iç `tsconfig` projesi kalmadı).
Kalan tek kaynak `.github/prompts` → **ölçülmüş** 35 dosyanın **13'ünde** çözülemeyen import var
(`pytest` 4 dosya · `generate.py` → `google.genai` + bozuk `from P import` · 8 test dosyasında
`core`/`design_system`/`validate_data`/`reasoning_contract` kardeş modülleri yan yolda değil).
→ Pylance en çok **~15-25** tanı gösterir. Tam **0** istenirse tek seçenek: bu 13 dosyaya
`pytest` + `google-genai` kurulumu ya da klasörün de taşınması (kullanıcı kararı bekliyor).

> ℹ️ Paneldeki sayı hemen düşmez: **Ctrl+Shift+P → "Developer: Reload Window"** (Pylance önbelleği).

---

## 16. ✅ Denetim düzeltme turu — 27.09.2026 (🅑 OpenCode, tek yazar)

**İş:** Denetim raporundaki yüksek etkili bulguları kapatmak; sahte veri/UI, eksik i18n,
tip borcu ve ölü CSS'yi temizlemek.

**Sahip:** 🅑 (OpenCode) · **Doğrulayıcı:** 🅐 (Cline, salt okunur) → 🅒 (Copilot, son kapı)

### Tamamlanan işler

| # | Konu | Kanıt |
|---|---|---|
| 1 | `IlanServisi` maaş filtreleri ters eşleşiyordu (`min <= x`, `mak >= x`) | `maasMin/Maas` ile düzeltildi |
| 2 | `PARA_BIRIMLERI` içinden `USDC` çıkarıldı (yalnızca ödeme para birimi) | `alan-degiskenleri.ts` |
| 3 | `FiltreYanPanel` görünmeyen öntanımlı GBP filtresi gönderiyordu | Yalnızca kullanıcı seçince uygulanıyor |
| 4 | `IlanListesi.tsx` sahte sayfalama → gerçek 10'lu sayfalama | `useMemo`/`useEffect` + i18n |
| 5 | `ilan-ara` `Math.max(toplam*296, 1480)` sahte sayaç + sahte 8/148 sayfalama | `ORNEK_ILANLAR` üzerinden gerçek `toplam`/`ilceAdetleri` |
| 6 | `HAM_ILANLAR` boştu → 18 gerçekçi KKTC kaydı | 15 B3 · 5 acil · 4 maaş gizli |
| 7 | Başvuru formu sahte `setTimeout` ile "gönderildi" diyordu | `POST /api/basvurular` + `BASVURU_SEMA` + gerçek hata mesajları |
| 8 | Turnstile doğrulaması route içinde kopyalanmıştı | `lib/guvenlik/turnstile.ts` ortak yardımcı |
| 9 | `as unknown as` cast'leri (`paraBirimi`, `eslesmeGerekcesi`, `calismaSekliKodu`, `Link href`) | `Ilan` tipi dürüstleştirildi, cast'ler silindi |
| 10 | `ilan-arama-deposu` Supabase satırları `any` ile dönüyordu | Zod `IlanSatiriSema` + `log.uyari` |
| 11 | `globals.css` ölü CSS (339 satır) + geçersiz `.odak-halkasi` | Canlı `.mineral/.camsi/.kristal-kart` korundu |
| 12 | Next 14 `params` `Promise` varsayımı (`generateMetadata` + layout) | `{ yerel: Yerel }` |
| 13 | Sabit Türkçe metinler (`AIPoposu`, `Logo`, `UstGezinmeCubugu`, `AltBilgi`, `loading`) | 4 locale **433 anahtar — tam uyum** |
| 14 | Arama inputunda `maxLength` yoktu | `UstGezinmeCubugu.tsx` → `maxLength={120}` (sunucu şemasıyla aynı) |

### Test sonucu

| Kontrol | Sonuç |
|---|---|
| `npm run kalite` (`tsc --noEmit` + `next lint`) | ✅ **0 hata, 0 uyarı** |
| `next build` (izole worktree, `ab16818`) | ✅ **BUILD_ID üretildi**, route tablosu tam; `/api/basvurular` **`ƒ` (Dynamic)** olarak doğru kaydedildi |
| i18n anahtar eşitliği (tr/en/ru/he) | ✅ **433/433/433/433** — eksik/fazla yok |
| `AIPoposu.tsx` sabit Türkçe metin | ✅ yok (yalnız CSS class adı) |
| `pre-commit` kapısı (2 commit) | ✅ `tsc` + `lint` geçti; sahiplik uyarıları **decoded** çalıştığında 🟢 |

> **Build kanıtı yöntemi (§7.5):** Port 3000'de dev server dinlerken **izole
> `git worktree --detach`** kullanıldı; `node_modules` junction ile bağlandı.
> Temizlik sırası: `cmd /c rmdir ...\node_modules` (**junction'i ayırır, hedefe dokunmaz**)
> → `git worktree remove --force`. Doğrulandı: junction gitti, ana `node_modules` sağlam,
> `build-dogrulama` dizini yok, `git worktree list` tek kayıt gösteriyor.

### ⚠️ Bilinen riskler (düzeltilmedi, bilinçli)

1. **Seed ↔ `job_posts` bağlantısı yok.** `ilan-deposu.ts` demo kayıtları gerçek
   `job_posts` UUID'leri değil → `/api/basvurular` bu slug'lar için **409** döner.
   Karar: seed'i DB'ye taşı *ya da* demo ilanlarda başvuru kanalını bilinçli kapat.
2. **CV yüklenmiyor.** Form yalnızca `cvDosya?.name` gönderiyor ve bu değer
   `applications.cv_url` alanına yazılıyor. Gerçek storage/upload akışı gerekli.
3. **Çift `NextIntlClientProvider` riski.** `next.config.mjs` plugin'i zaten provider
   kuruyor; layout'taki manuel sarmalayıcı çift yükleme yapabilir. Kaldırmak runtime
   riski taşıdığı için **bilinçli korundu** — ayrı iş.
4. `sirket/[slug]/page.tsx` service-role zinciri (§P0-5 "Kalan risk") hâlâ açık.

### ✅ KAPATILDI — Chief'e devredilmiş `tools/cakisma-kontrol.mjs` Unicode-yol bulgusu

**Tarihsel bulgu (commit `958b6a9` pre-commit çıktısı):** Araç, var olan dosyalar için
`🟡 ... (dosya yok) -> TANIMSIZ — .ajan-sahiplik.json'a eklenmeli` uyarısı bastı.
**Bu yanlış bir sahiplik ihlali değildir.** Elle doğrulandı:

**Doğrulama (28.09.2026):** Mevcut checker zaten `core.quotepath=false` kullanıyor ve dosya yaşı/erişim hatalarını ayrı gösteriyor. İki mevcut Türkçe adlı dosya için OpenCode sahiplik sonucu 🟢; `ATSGöstergesi.tsx` için Cline yazma denemesi 🔴 ve exit code 1 oldu. Sorun yeniden üretilemedi; bu görevde checker koduna dokunulmadı.

| Yol | Var mı | Araç kararı (normal) | Araç kararı (UTF-8 konsol) |
|---|---|---|---|
| `bilesenler/ilan/ATSGöstergesi.tsx` | ✅ `Test-Path` True | 🟡 "dosya yok" → TANIMSIZ | 🟢 "Senin alanın" (`bilesenler/**`) |
| `bilesenler/ilan/IlanKartı.tsx` | ✅ `Test-Path` True | 🟡 "dosya yok" → TANIMSIZ | 🟢 (aynı kural) |

**Kök neden (2 ayrı kusur):**
1. **Yol kaçışı (asıl sebep).** `tools/cakisma-kontrol.mjs:131` `git diff --cached --name-only`
   ve `:143` `git ls-files` çağırıyor. `core.quotepath=false` olmadığı için git,
   ASCII olmayan adları C-stili oktal kaçışla veriyor:
   `ATSG\303\266stergesi.tsx` → `statSync` **her zaman** `ENOENT` fırlatıyor.
   Yani **Türkçe karakterli hiçbir dosya sahiplik denetimine giremez.**
2. **Yanıltıcı `catch`.** `tools/cakisma-kontrol.mjs:72-78` `yasDakika()` içindeki
   `catch` **her** hatayı yutuyor ve `null` döndürüyor; `:83` bunu değişmez
   `"dosya yok"` diye gösteriyor. Oysa burada dosya yok değil, **yol çözülemedi**.
   İzin hatası da aynı yanlış metni üretir.

**Neden önemli:** Yanlış sahiplik uyarısı, kapının güvenilmezliğini öğretir; ajanlar
"🟡 çıktısını görmezden gelmeye" başlar. Sahiplik denetimi sessizce **güçsüzleşir** —
`bilesenler/ilan/ATSGöstergesi.tsx` ve `IlanKartı.tsx` gibi Türkçe adlı **gerçek
ihlaller** bu hatayla yakalanamaz.

**Önerilen düzeltme (Chief alanı — `tools/**`, OpenCode yazmadı):**
- `execSync("git -c core.quotepath=false diff --cached --name-only", { encoding: "utf8" })`
  (aynısı `git ls-files` için) — veya `git ... -z` + `buffer`'da boşluk ayırıcı.
- `yasDakika()` → `null` yerine ayrı bir sonuç: `{ erisim: "yok" | "cozulemedi" }`
  ve `:83` metni buna göre üretsin (`dosya yok` ≠ `yol çözülemedi`).
- `.githooks/pre-commit` içinde konsol kodlamasını UTF-8'e sabitlemek
  (PowerShell `chcp 65001` veya `[Console]::OutputEncoding = UTF8`).

**Sahip:** 🅒 (Copilot / Chief) · **Bulgu:** 🅑 (OpenCode) · **Etki:** düşük kod riski,
**orta denetim riski** · **Durum:** bekliyor

### Sonraki adım

1. 🅒 commit + izole `next build` (§7.5) ile build kanıtı.
2. 🅐 Cline: salt okunur review; özellikle `/api/basvurular` yetki/zaman-üstü-çalışma
   (read-modify-write `application_count`) ve `Ilan` deprecated alan geri çekilmesi.
3. Risk 1 ve 2 için Chief kararı: seed→DB migrasyonu + CV storage.

---

**Son güncelleme:** 27.09.2026 · §16 eklendi (🅑) · **Sahipler:** 🅐 Cline (salt okunur review) · 🅒 Copilot (son doğrulama)
