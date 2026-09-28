import BilgiSayfasi from "@/bilesenler/genel/BilgiSayfasi";

export default function IhtiyatSandigiSayfasi() {
  return <BilgiSayfasi baslik="İhtiyat Sandığı ve B3" ikon="account_balance" aciklama="B3 kayıtlı işverenlerle ilgili temel yönlendirme ve doğrulama bilgileri." maddeler={["İşverenin güncel kayıt ve prim durumunu resmi kanallardan teyit edin.", "İlan üzerindeki B3 rozeti platform içi doğrulama sinyalidir.", "Kişisel belge ve ödeme taleplerini paylaşmadan önce kurumu doğrulayın."]} />;
}
