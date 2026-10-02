import BilgiSayfasi from "@/bilesenler/genel/BilgiSayfasi";

export default function IhtiyatSandigiSayfasi() {
  return <BilgiSayfasi baslik="İhtiyat Sandığı" ikon="account_balance" aciklama="İşBulKKTC, İhtiyat Sandığı kayıtlarını sorgulamaz veya işverenleri bu kayıtlar üzerinden doğruladığını iddia etmez." maddeler={["Güncel kayıt ve prim durumunu İhtiyat Sandığı'nın resmi kanallarından teyit edin.", "Kişisel belge veya ödeme bilgilerini paylaşmadan önce başvurduğunuz kurumun resmi iletişim bilgilerini kontrol edin."]} />;
}
