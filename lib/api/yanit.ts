import { NextResponse } from "next/server";
import type { IstekBaglami } from "@/lib/sunucu/loglama";

export type ApiHataKodu = "GECERSIZ_ISTEK" | "YAPILANDIRMA_HATASI" | "SUNUCU_HATASI";

export function apiJson<T>(veri: T, durum = 200, baglam?: IstekBaglami) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  if (baglam?.istekKimligi) headers.set("x-request-id", baglam.istekKimligi);
  return NextResponse.json(veri, { status: durum, headers });
}

export function apiHatasi(
  mesaj: string,
  durum: number,
  hataKodu: ApiHataKodu = "SUNUCU_HATASI",
  baglam?: IstekBaglami,
) {
  return apiJson({ basarili: false, hata: mesaj, hataKodu }, durum, baglam);
}
