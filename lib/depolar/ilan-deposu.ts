export type TeknikYetenekGrubu = {
  grup: string;
  etiketler: string[];
};

export type EskiIlanEkMeta = {
  tanitim: string;
  pozisyonTanimi: string[];
  teknikYetenekler: TeknikYetenekGrubu[];
  sirketAciklamasi: string;
  ilceUzunIsim: string;
  sektorAciklama: string;
  calismaSekliAciklama: string;
  izinTipiAciklama: string;
};
