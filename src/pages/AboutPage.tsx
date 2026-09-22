import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { dataService } from '@/data/dataService';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import { MessageCircle, MapPin, Phone, Mail } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { SiteSettings } from '@/types';

export function AboutPage() {
  const { lang, t } = useLang();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await dataService.getSettings();
        if (!cancelled) setSettings(s);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || !settings) {
    return (
      <div className="container-padding section-padding">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container-padding section-padding py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{t('About Us', 'ہمارے بارے میں')}</h1>

        <div className="mt-6 overflow-hidden rounded-3xl shadow-card">
          <img
            src={settings.home_banners[0]?.image || ''}
            alt={settings.store_name}
            className="h-64 w-full object-cover sm:h-80"
          />
        </div>

        <div className="mt-6 space-y-4 text-ink leading-relaxed">
          <p className="text-lg">
            {lang === 'en' ? settings.about_en : settings.about_ur}
          </p>
        </div>

        {/* Contact section */}
        <div className="mt-10 rounded-3xl bg-soft p-6">
          <h2 className="text-xl font-bold text-ink">{t('Get in Touch', 'رابطہ کریں')}</h2>
          <div className="mt-4 space-y-3">
            {settings.contact_info.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
                <span className="text-ink">{settings.contact_info.address}</span>
              </div>
            )}
            {settings.contact_info.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-brand-500" />
                <span className="text-ink">{settings.contact_info.phone}</span>
              </div>
            )}
            {settings.contact_info.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-brand-500" />
                <span className="text-ink">{settings.contact_info.email}</span>
              </div>
            )}
          </div>
          <a
            href={getGeneralWhatsAppLink(settings, lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-5"
          >
            <MessageCircle className="h-5 w-5" />
            {t('Chat on WhatsApp', 'واٹس ایپ پر چیٹ کریں')}
          </a>
        </div>
      </div>
    </div>
  );
}
