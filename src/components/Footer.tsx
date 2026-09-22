import { MessageCircle, MapPin, Phone, Mail } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link } from '@/context/RouterContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useStoreData } from '@/context/StoreDataContext';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import type { SiteSettings } from '@/types';
import { isHttpsUrl } from '@/lib/urls';

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

export function Footer() {
  const { lang, t } = useLang();
  const { settings: rawSettings, categories } = useStoreData();
  const settings = rawSettings || defaultSettings;

  return (
    <footer className="mt-12 bg-deep text-white">
      <div className="container-padding section-padding py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Store info */}
          <div>
            <div className="flex items-center gap-2">
              <img
                src={settings.logo_url || '/qasmi_logo.jpeg'}
                alt={settings.store_name}
                className="h-12 w-auto rounded-lg object-contain"
                style={{ maxHeight: '48px' }}
              />
            </div>
            <p className="mt-3 text-sm text-white/70 leading-relaxed line-clamp-4">
              {lang === 'en' ? settings.about_en : settings.about_ur}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
              {t('Categories', 'اقسام')}
            </h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {lang === 'en' ? cat.name_en : cat.name_ur}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
              {t('Quick Links', 'فوری روابط')}
            </h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-white/70 hover:text-white">{t('About Us', 'ہمارے بارے میں')}</Link></li>
              <li><Link to="/contact" className="text-sm text-white/70 hover:text-white">{t('Contact', 'رابطہ')}</Link></li>
              <li><Link to="/search" className="text-sm text-white/70 hover:text-white">{t('Search', 'تلاش')}</Link></li>
              <li><Link to="/admin" className="text-sm text-white/70 hover:text-white">{t('Admin', 'ایڈمن')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
              {t('Contact', 'رابطہ')}
            </h3>
            <ul className="space-y-2.5">
              {settings.contact_info.address && (
                <li className="flex items-start gap-2 text-sm text-white/70">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                  <span>{settings.contact_info.address}</span>
                </li>
              )}
              {settings.contact_info.phone && (
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Phone className="h-4 w-4 flex-shrink-0 text-accent" />
                  <span>{settings.contact_info.phone}</span>
                </li>
              )}
              {settings.contact_info.email && (
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Mail className="h-4 w-4 flex-shrink-0 text-accent" />
                  <span>{settings.contact_info.email}</span>
                </li>
              )}
            </ul>
            <a
              href={getGeneralWhatsAppLink(settings, lang)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-600 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              {t('Chat on WhatsApp', 'واٹس ایپ پر چیٹ کریں')}
            </a>
            {(isHttpsUrl(settings.social_links.facebook) || isHttpsUrl(settings.social_links.instagram)) && (
              <div className="mt-4 flex gap-3 text-sm">
                {isHttpsUrl(settings.social_links.facebook) && <a href={settings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">Facebook</a>}
                {isHttpsUrl(settings.social_links.instagram) && <a href={settings.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">Instagram</a>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {settings.store_name}. {t('All rights reserved.', 'جملہ حقوق محفوظ ہیں۔')}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
