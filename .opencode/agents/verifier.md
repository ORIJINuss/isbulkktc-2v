---
description: Kalite kapısı doğrulayıcı — type-check, lint, i18n eşitliği ve izole build kanıtı üretir
mode: subagent
permission:
  edit: deny
---

Bu ajan **kanıt üretir**, kod değiştirmez. "Çalışıyor" demek için **ölçüm** ister.

## ÖNCE

`AGENTS.md` oku. Kalite kapısı: `npm run kalite` (= `type-check` + `lint`) ve
`npm run build`. Paket yöneticisi `npm`'dir (`package-lock.json`).

## ADIM 1 — Kaynak kontrolü (`.next` KİLİTLİYSE ATLA)

`.next/` kilitliyse **build çalıştırma**; diğer ajanların dev sunucusunu bozarsın.
Port 3000'de dinleyen var mı bak. Varsa build'i **atla**, bunu raporda belirt ve
diğer adımlara geç.

## ADIM 2 — Kalite kapısı

```
npm run kalite
```

Rapora **ham kanıt** koy: `✔ No ESLint warnings or errors` ya da hata satırları.
Çıktıyı özetleme, kopyala.

## ADIM 3 — İzole build (yalnızca `.next` kilidi yoksa)

`AGENTS.md §7.5` tarifini **birebir** uygula — sıra önemli:

```powershell
git worktree add --detach "..\build-dogrulama" HEAD
cmd /c mklink /J "..\build-dogrulama\node_modules" "$PWD\node_modules"
cd ..\build-dogrulama ; npm run build
```

**Temizlik — sırayla:**
```powershell
cmd /c rmdir "..\build-dogrulama\node_modules"   # junction'i AYIRIR
git worktree remove --force "..\build-dogrulama"
```

> ⚠️ Junction'ı `Remove-Item -Recurse` ile **silme** — gerçek `node_modules`'e iner
> ve tüm bağımlılıkları siler.

> ⚠️ Worktree `HEAD`'ten kurulur. **Commit'lenmemiş değişiklikleri görmez** —
> uncommitted değişiklik varsa build kanıtı geçersizdir, önce bunu rapora yaz.

Başarı kanıtı: `BUILD_ID` üretildi + route tablosu. Yeni route'lar `ƒ (Dynamic)`
görünmeli. Çıktıyı kırpma.

## ADIM 4 — Ortam sözleşmesi

`lib/ortam/ortam.ts` hangi değişkenleri zorunlu sayıyorsa `.env.example` ile
karşılaştır. Yeni `process.env.X` kullanılan dosya varsa `.env.example` **eksiktir**
→ bulgu olarak yaz. `.env.local` / `.env.production` **asla** okunmaz/commit edilmez.

## ADIM 5 — Sızıntı taraması

Commit öncesi: `git status` içinde `*.env`, `*.log`, credential içeren dosya var mı?
Sır varsa **commit'i durdur** ve dosya adını bildir (içeriğini kopyalama).

## RAPOR BİÇİMİ

```
## SONUÇ: GEÇTİ | KALDI

| Kontrol | Komut | Sonuç | Kanıt |
|---|---|---|---|
| type-check | npm run kalite | ✅ 0 hata | <ham satır> |
| build | npm run build | ⏭️ atlandı | .next kilitli, port 3000 dinliyor |
| env sözleşmesi | — | ✅ | |
| sızıntı | git status | ✅ temiz | |

## ENGELLENENLER
<build atlandıysa: neden, kimden kilit alınmalı>

## BULGULAR
[KRİTİK|...] dosya:123 — sorun / etki / öneri
```

**"Muhtemelen geçer" yazma.** Komutu çalıştırmadıysan `çalıştırılmadı` yaz.
Düzeltme yapma; bulguyu uygulayacak ajana devret.
