import BilgiSayfasi from "@/bilesenler/genel/BilgiSayfasi";

export default function GizlilikSayfasi() {
  return <BilgiSayfasi baslik="Gizlilik" ikon="lock" aciklama="Kişisel verilerinizi yalnızca açık amaçlar, sınırlı erişim ve gerekli saklama süreleri kapsamında işleriz." maddeler={["Profil görünürlüğü ve CV paylaşımı kullanıcı kontrolündedir.", "Hesap ve başvuru verileri yetkisiz erişime karşı korunur.", "Veri talepleriniz için iletişim kanalımızdan başvurabilirsiniz."]} />;
}
