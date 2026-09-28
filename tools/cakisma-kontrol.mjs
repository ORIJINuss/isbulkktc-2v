#!/usr/bin/env node
/**
 * İşBulKKTC — Çakışma Önleme Kontrolü (tools/cakisma-kontrol.mjs)
 * Sahip: Copilot / VS Code Agent (Chief)
 *
 * NEDEN: 26.09.2026'da iki ajan aynı 6 dosyaya eşzamanlı yazdı ve ağaç
 * geçici olarak bozuldu (bkz. docs/DENETIM-RAPORU.md §10). Bu araç,
 * "yazmadan önce karar verme" adımını tek komuta indirir.
 *
 * KULLANIM
 *   node tools/cakisma-kontrol.mjs                 -> son 30 dk'daki dosya hareketi + sahipleri
 *   node tools/cakisma-kontrol.mjs --agent <rol> <yol> [<yol>] -> yazma yetkisi kararı
 *   roller: copilot | opencode | cline
 *   node tools/cakisma-kontrol.mjs <yol> [<yol>]   -> sahiplik bilgisi
 *   node tools/cakisma-kontrol.mjs --staged        -> staged dosyaların sahiplik denetimi (hook kullanır)
 */

import { readFileSync, statSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const KOK = process.cwd();
const HARITA_YOLU = resolve(KOK, ".ajan-sahiplik.json");

if (!existsSync(HARITA_YOLU)) {
  console.error("[cakisma-kontrol] .ajan-sahiplik.json bulunamadı. Proje kökünde çalıştırın.");
  process.exit(2);
}

const harita = JSON.parse(readFileSync(HARITA_YOLU, "utf8"));
const BEKLEME = Number(harita.beklemeDakika) || 2;
const AJANLAR = new Map([
  ["copilot", "Copilot / VS Code Agent (Chief)"],
  ["opencode", "OpenCode (Implementer)"],
  ["cline", "Cline (Reviewer)"],
]);

function globRegex(glob) {
  const kacisli = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*");
  return new RegExp("^" + kacisli + "$");
}

const regexOnbellek = new Map();
function eslesir(yol, glob) {
  if (!regexOnbellek.has(glob)) regexOnbellek.set(glob, globRegex(glob));
  return regexOnbellek.get(glob).test(yol);
}

/** Bir yolun sahibini/kategorisini bulur. */
export function sahibiBul(yolHam) {
  const yol = String(yolHam).replace(/\\/g, "/").replace(/^\.\//, "");
  for (const kural of harita.ortakAlanlar ?? []) {
    if (eslesir(yol, kural)) return { tip: "ORTAK", ajan: null, kural };
  }
  for (const [ajan, kurallar] of Object.entries(harita.sahiplik ?? {})) {
    for (const kural of kurallar) {
      if (eslesir(yol, kural)) return { tip: "OZEL", ajan, kural };
    }
  }
  for (const kural of harita.sadeceOkurDosyalar ?? []) {
    if (eslesir(yol, kural) || eslesir(yol, "**/" + kural)) {
      return { tip: "OKUMA_ONLY", ajan: null, kural };
    }
  }
  return { tip: "TANIMSIZ", ajan: null, kural: null };
}

function yasDakika(yol) {
  try {
    return (Date.now() - statSync(resolve(KOK, yol)).mtimeMs) / 60000;
  } catch (error) {
    return { hata: error?.code ?? "BILINMEYEN", dakika: null };
  }
}

function yasMetin(yas) {
  if (yas && typeof yas === "object") {
    if (yas.hata === "ENOENT") return "dosya yok";
    if (yas.hata === "EACCES" || yas.hata === "EPERM") return "erişim reddedildi";
    return "çözümlenemedi";
  }
  if (yas === null || yas === undefined) return "dosya yok";
  return yas < 1 ? "<1 dk" : `${yas.toFixed(1)} dk`;
}

function satirKarari(yol, aktifAjan) {
  const { tip, ajan, kural } = sahibiBul(yol);
  const yas = yasDakika(yol);
  const yasDegeri = yas && typeof yas === "object" ? null : yas;
  const yasYazisi = yasMetin(yas);

  let isaret = "🟢";
  let karar = "Güvenli";
  const notlar = [];

  if (tip === "ORTAK") {
    isaret = "🟡";
    karar = "ORTAK ALAN — KİLİT AL";
    notlar.push(`kural: ${kural} -> docs/AJAN-KOORDINASYON.md'de kilit talebi aç`);
  } else if (tip === "OZEL") {
    notlar.push(`sahip: ${ajan} (kural: ${kural})`);
    if (!aktifAjan) {
      isaret = "🟡";
      karar = "SAHİP BELİRLİ — --agent ile denetle";
    } else if (ajan === aktifAjan) {
      karar = "Senin alanın";
    } else if (harita.yazmayanAjanlar?.[aktifAjan]) {
      isaret = "🔴";
      karar = "BU ROL DOSYA YAZAMAZ";
      notlar.push(harita.yazmayanAjanlar[aktifAjan]);
    } else {
      isaret = "🔴";
      karar = "BAŞKA AJANIN ALANI — YAZMA";
      notlar.push(`sahip ${ajan}; yazan rol ${aktifAjan}`);
    }
  } else if (tip === "OKUMA_ONLY") {
    isaret = "⛔";
    karar = "ASLA COMMIT EDİLMEZ (sır/çıktı dosyası)";
  } else {
    isaret = "🟡";
    karar = "TANIMSIZ — .ajan-sahiplik.json'a eklenmeli";
  }

  // Rol sahipliği, aynı roldeki başka bir görevin eşzamanlı yazmadığını kanıtlamaz.
  if (yasDegeri !== null && yasDegeri !== undefined && yasDegeri < BEKLEME) {
    isaret = "🔴";
    karar = "AKTİF YAZIM RİSKİ — BEKLE";
    notlar.push(`son değişim ${yasYazisi} (< ${BEKLEME} dk) -> başka ajan olabilir`);
  }

  return { yol, isaret, karar, yasMetin: yasYazisi, notlar };
}

// ---------------- Yardımcılar ----------------

function stagedDosyalar() {
  try {
    return execSync("git -c core.quotepath=false diff --cached --name-only", { cwd: KOK, encoding: "utf8" })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function yakindaDegisenler(dakika) {
  let dosyalar;
  try {
    dosyalar = execSync("git -c core.quotepath=false ls-files", { cwd: KOK, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
  const hedef = dosyalar.filter(
    (f) =>
      f.startsWith("app/") ||
      f.startsWith("lib/") ||
      f.startsWith("bilesenler/") ||
      f.startsWith("i18n/") ||
      f.startsWith("tools/"),
  );
  const sonuc = [];
  for (const f of hedef) {
    const yas = yasDakika(f);
    if (yas && typeof yas === "object") continue;
    if (yas !== null && yas < dakika) sonuc.push({ yol: f, yas });
  }
  return sonuc.sort((a, b) => a.yas - b.yas);
}

// ---------------- CLI ----------------

const args = process.argv.slice(2);
const agentFlagIndex = args.indexOf("--agent");
let aktifAjan = null;
if (agentFlagIndex !== -1) {
  const agentArg = args[agentFlagIndex + 1]?.toLowerCase();
  aktifAjan = AJANLAR.get(agentArg) ?? null;
  if (!aktifAjan) {
    console.error("[cakisma-kontrol] --agent için copilot, opencode veya cline belirtin.");
    process.exit(2);
  }
  args.splice(agentFlagIndex, 2);
}

if (args.includes("--staged")) {
  const dosyalar = stagedDosyalar();
  if (dosyalar.length === 0) {
    console.log("[cakisma] staged dosya yok.");
    process.exit(0);
  }
  const sorunlu = dosyalar
    .map((dosya) => satirKarari(dosya, aktifAjan))
    .filter((k) => k.isaret === "🔴" || k.isaret === "⛔" || k.karar.startsWith("TANIMSIZ"));

  if (sorunlu.length === 0) {
    console.log(`[cakisma] ${dosyalar.length} staged dosya denetlendi -> harita ihlali YOK.`);
    process.exit(0);
  }

  console.log("");
  console.log("[cakisma] SAHIPLIK UYARISI (commit ENGELLENMEDI, yalnizca bilgilendirme):");
  for (const k of sorunlu) {
    console.log(`  ${k.isaret} ${k.yol}  (${k.yasMetin}) -> ${k.karar}`);
    for (const n of k.notlar) console.log(`      - ${n}`);
  }
  console.log("");
  process.exit(aktifAjan ? 1 : 0);
}

function gidilecekYol(yol) {
  if (!yol) return yol;
  return yol.replace(/\\/g, "/");
}

const yollar = args.filter((a) => !a.startsWith("--"));

if (yollar.length > 0) {
  console.log("");
  console.log("=== CAKISMA ONLEME KARARI ===");
  for (const y of yollar) {
    const k = satirKarari(y, aktifAjan);
    console.log("");
    console.log(`${k.isaret} ${k.yol}`);
    console.log(`   son degisim : ${k.yasMetin}`);
    console.log(`   karar       : ${k.karar}`);
    for (const n of k.notlar) console.log(`   - ${n}`);
    if (aktifAjan && k.karar !== "Senin alanın") process.exitCode = 1;
  }
  console.log("");
  console.log("Kural: kırmızı = YAZMA | sarı = KİLİT AL / ROLÜ BELİRT | yeşil = atanmış rol için güvenli");
  console.log("");
  process.exit(process.exitCode ?? 0);
}

console.log("");
console.log("=== AKTIF DOSYA HAREKETI (son 30 dk) ===");
const hareket = yakindaDegisenler(30);
if (hareket.length === 0) {
  console.log("  (son 30 dk icinde degisen kaynak dosyasi yok)");
} else {
  for (const h of hareket) {
    const k = satirKarari(h.yol, aktifAjan);
    console.log(`  ${k.isaret} ${h.yas.toFixed(1).padStart(5)} dk | ${h.yol}  -> ${k.karar}`);
  }
}
console.log("");
console.log("=== SAHIPLIK OZETI ===");
for (const [ajan, kurallar] of Object.entries(harita.sahiplik ?? {})) {
  console.log(`  ${ajan}`);
  console.log(`      ${kurallar.join(", ")}`);
}
console.log(`  ORTAK (kilit gerekli): ${(harita.ortakAlanlar ?? []).join(", ")}`);
for (const [ajan, not] of Object.entries(harita.yazmayanAjanlar ?? {})) {
  console.log(`  ${ajan}: ${not}`);
}
console.log("");
console.log("Belirli dosya icin: node tools/cakisma-kontrol.mjs <yol>");
console.log("Yazma yetkisi icin: node tools/cakisma-kontrol.mjs --agent <copilot|opencode|cline> <yol>");
console.log("");
