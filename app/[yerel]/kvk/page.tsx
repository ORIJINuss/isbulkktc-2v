import BilgiSayfasi from "@/bilesenler/genel/BilgiSayfasi";

export default function KvkSayfasi() {
  return <BilgiSayfasi baslik="KVK bilgilendirmesi" ikon="policy" aciklama="Veri işleme amaçlarımızı, haklarınızı ve başvuru yöntemlerini açıkça paylaşırız." maddeler={["Veri sorumlusuna başvurarak erişim, düzeltme ve silme taleplerinizi iletebilirsiniz.", "Açık rıza gerektiren profil görünürlüğü işlemleri ayrı tutulur.", "Zorunlu olmayan veriler hizmetin temel kullanımı için istenmez."]} />;
}
