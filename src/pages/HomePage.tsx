import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Star, MessageCircle, Clock } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link } from '@/context/RouterContext';
import { ProductCard } from '@/components/ProductCard';
import { dataService } from '@/data/dataService';
import { useStoreData } from '@/context/StoreDataContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import type { Product, SiteSettings } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const defaultSettings: SiteSettings = {
  store_name: 'Qasmi General Store',
  logo_url: '',
  whatsapp_number: '',
  about_en: '',
  about_ur: '',
  contact_info: {},
  social_links: {},
  home_banners: [],
};

export function HomePage() {
  const { lang, t } = useLang();
  const [bannerIndex, setBannerIndex] = useState(0);
  const { settings: rawSettings, categories } = useStoreData();
  const settings = rawSettings || defaultSettings;
  const banners = settings.home_banners;
  const { viewedIds } = useRecentlyViewed();

  const [featured, setFeatured] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const feat = await dataService.getFeaturedProducts();
        if (!cancelled) setFeatured(feat);
      } catch {
        if (!cancelled) setFeaturedError('Featured products are unavailable right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (viewedIds.length === 0) {
        setRecentlyViewed([]);
        return;
      }
      try {
        const products = await dataService.getProductsByIds(viewedIds);
        if (cancelled) return;
        const ordered = viewedIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => p !== undefined).slice(0, 4);
        setRecentlyViewed(ordered);
      } catch { if (!cancelled) setRecentlyViewed([]); }
    })();
    return () => { cancelled = true; };
  }, [viewedIds]);

  return (
    <div>
      {/* Hero banner carousel */}
      {banners.length > 0 && (
        <section className="relative h-[55vh] min-h-[360px] w-full overflow-hidden">
          {banners.map((banner, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === bannerIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={banner.image}
                alt={lang === 'en' ? banner.caption_en : banner.caption_ur}
                className="h-full w-full object-cover"
                fetchPriority={i === 0 ? 'high' : 'auto'}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-deep/20 to-transparent" />
            </div>
          ))}

          <div className="absolute bottom-0 start-0 end-0 p-6 pb-8 sm:p-10 animate-slide-up">
            <div className="container-padding">
              <div className="max-w-xl">
                <span className="badge badge-featured mb-3">
                  <Sparkles className="h-3 w-3" />
                  {t('Welcome to', 'خوش آمدید')}
                </span>
                <h1 className="text-3xl font-bold text-white text-balance sm:text-4xl md:text-5xl">
                  {settings.store_name}
                </h1>
                <p className="mt-2 text-lg text-white/90">
                  {lang === 'en' ? banners[bannerIndex]?.caption_en : banners[bannerIndex]?.caption_ur}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {categories[0] && <Link to={`/category/${categories[0].slug}`} className="btn-primary">{t('Shop Now', 'ابھی خریدیں')}<ArrowRight className="h-5 w-5 rtl:rotate-180" /></Link>}
                  <a
                    href={getGeneralWhatsAppLink(settings, lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {t('Contact Us', 'ہم سے رابطہ کریں')}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {banners.length > 1 && (
            <div className="absolute bottom-4 end-6 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === bannerIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                  }`}
                  aria-label={`Banner ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Category tiles */}
      <section className="section-padding container-padding py-12 animate-fade-in">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('Shop by Category', 'اقسام کے لحاظ سے خریدیں')}</h2>
          <p className="mt-1 text-muted">{t('Browse our collections', 'ہماری مجموعے دیکھیں')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <div key={cat.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <Link
                to={`/category/${cat.slug}`}
                className="group relative block overflow-hidden rounded-3xl shadow-card transition-all duration-300 hover:shadow-lift hover:-translate-y-1"
              >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={cat.cover_image}
                  alt={lang === 'en' ? cat.name_en : cat.name_ur}
                  width={400}
                  height={300}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-deep/10 to-transparent" />
              <div className="absolute bottom-0 start-0 end-0 p-5">
                <h3 className="text-xl font-bold text-white">
                  {lang === 'en' ? cat.name_en : cat.name_ur}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-sm text-accent">
                  {t('Browse', 'دیکھیں')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </div>
              </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="section-padding container-padding pb-8 animate-fade-in">
          <div className="mb-5 flex items-center gap-2">
            <Clock className="h-6 w-6 text-brand-500" />
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('Recently Viewed', 'حال ہی میں دیکھے گئے')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {recentlyViewed.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                category={categories.find((c) => c.id === product.category_id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {loading ? (
        <section className="bg-soft section-padding py-12">
          <div className="container-padding">
            <LoadingSpinner />
          </div>
        </section>
      ) : featuredError ? (
        <section className="bg-soft section-padding py-8"><div className="container-padding"><p className="text-center text-sm text-muted" role="status">{featuredError}</p></div></section>
      ) : featured.length > 0 && (
        <section className="bg-soft section-padding py-12 animate-fade-in">
          <div className="container-padding">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold text-ink sm:text-3xl">
                  <Star className="h-6 w-6 text-brand-500" />
                  {t('Featured Products', 'نمایاں مصنوعات')}
                </h2>
                <p className="mt-1 text-muted">{t('Handpicked favorites from our collection', 'ہمارے مجموعے سے منتخب پسندیدہ')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {featured.map((product, i) => (
                <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <ProductCard
                    product={product}
                    category={categories.find((c) => c.id === product.category_id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About snippet */}
      <section className="section-padding container-padding py-12 animate-fade-in">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('About Our Store', 'ہمارے اسٹور کے بارے میں')}</h2>
          <p className="mt-4 text-muted leading-relaxed">
            {lang === 'en' ? settings.about_en : settings.about_ur}
          </p>
          <Link to="/about" className="btn-outline mt-6">
            {t('Read More', 'مزید پڑھیں')}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-brand-500 section-padding py-12 animate-fade-in">
        <div className="container-padding text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t('Ready to Order?', 'آرڈر کے لیے تیار ہیں؟')}
          </h2>
          <p className="mt-2 text-white/80">
            {t('Tap any product and order directly via WhatsApp — it\'s that easy!', 'کسی بھی مصنوعہ پر ٹیپ کریں اور براہ راست واٹس ایپ پر آرڈر کریں — اتنا آسان!')}
          </p>
          <a
            href={getGeneralWhatsAppLink(settings, lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-brand-500 shadow-soft transition-all hover:bg-brand-50 hover:scale-105 active:scale-95"
          >
            <MessageCircle className="h-5 w-5" />
            {t('Start Chatting', 'چیٹ شروع کریں')}
          </a>
        </div>
      </section>
    </div>
  );
}
