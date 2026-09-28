import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode
} from "react";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

type Seviye = "mineral" | "cam";

function yuzeySeviyesi(seviye: Seviye | undefined): string {
  return seviye === "cam" ? "camsi" : "";
}

// ─── Label ───
export function Etiket({
  htmlFor,
  className,
  children,
  gerekli = false
}: {
  htmlFor?: string;
  className?: string;
  children: ReactNode;
  gerekli?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={sb("etiket", className)}>
      {children}
      {gerekli && <span className="text-hata ms-1">*</span>}
    </label>
  );
}

// ─── Text Input ───
type GirdiOzellikleri = InputHTMLAttributes<HTMLInputElement> & {
  seviye?: Seviye;
  yanYaziSolu?: ReactNode;
  yanYaziSagi?: ReactNode;
};

export function Girdi({
  seviye = "mineral",
  yanYaziSolu,
  yanYaziSagi,
  className,
  type = "text",
  disabled,
  ...kalan
}: GirdiOzellikleri) {
  const girdiBilesimiSinifi = sb("girdi", yuzeySeviyesi(seviye), className);

  return (
    <div className="flex items-center gap-2">
      {yanYaziSolu && <span className="shrink-0 text-metadata text-mineral-500">{yanYaziSolu}</span>}
      <input type={type} className={girdiBilesimiSinifi} disabled={disabled} {...kalan} />
      {yanYaziSagi && <span className="shrink-0 text-metadata text-mineral-500">{yanYaziSagi}</span>}
    </div>
  );
}

// ─── Textarea ───
type AciklamaSahasi = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  satir?: number;
  seviye?: Seviye;
};

export function AciklamaSahasi({
  satir = 4,
  seviye = "mineral",
  className,
  disabled,
  ...kalan
}: AciklamaSahasi) {
  const alanSinifi = sb("girdi", yuzeySeviyesi(seviye), "min-h-24 resize-y", className);

  return <textarea rows={satir} className={alanSinifi} disabled={disabled} {...kalan} />;
}

// ─── Help Text ───
export function YardimciMetin({
  className,
  hata = false,
  children
}: {
  className?: string;
  hata?: boolean;
  children: ReactNode;
}) {
  return (
    <p className={sb("yardimci-metin", hata ? "text-hata" : "text-mineral-500", className)}>
      {children}
    </p>
  );
}

// ─── Select/Dropdown ───
type Secenek = {
  deger: string;
  etiket: string;
  devre?: boolean;
};

type SecimiOzellikleri = SelectHTMLAttributes<HTMLSelectElement> & {
  secenekler: Secenek[];
  seviye?: Seviye;
  bosEtiket?: string;
};

export function Secim({
  secenekler,
  seviye = "mineral",
  bosEtiket = "Seçiniz...",
  className,
  disabled,
  ...kalan
}: SecimiOzellikleri) {
  const secimiSinifi = sb("girdi", yuzeySeviyesi(seviye), "cursor-pointer", className);

  return (
    <select className={secimiSinifi} disabled={disabled} {...kalan}>
      <option value="">{bosEtiket}</option>
      {secenekler.map((sec) => (
        <option key={sec.deger} value={sec.deger} disabled={sec.devre}>
          {sec.etiket}
        </option>
      ))}
    </select>
  );
}

// ─── Checkbox ───
type OnerBilesimiOzellikleri = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  etiket: string;
};

export function OnerBilesi({ id, etiket, className, ...kalan }: OnerBilesimiOzellikleri) {
  return (
    <div className={sb("flex items-center gap-2", className)}>
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 cursor-pointer rounded border border-mineral-300 accent-bedford-temel"
        {...kalan}
      />
      <label htmlFor={id} className="cursor-pointer text-body text-bedford-temel">
        {etiket}
      </label>
    </div>
  );
}

// ─── Radio Button ───
type RadyoBilesimiOzellikleri = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  etiket: string;
};

export function RadyoBilesi({ id, etiket, className, ...kalan }: RadyoBilesimiOzellikleri) {
  return (
    <div className={sb("flex items-center gap-2", className)}>
      <input
        id={id}
        type="radio"
        className="h-4 w-4 cursor-pointer border border-mineral-300 accent-bedford-temel"
        {...kalan}
      />
      <label htmlFor={id} className="cursor-pointer text-body text-bedford-temel">
        {etiket}
      </label>
    </div>
  );
}
