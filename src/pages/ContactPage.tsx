import { useState, useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';
import { dataService } from '@/data/dataService';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import { MessageCircle, MapPin, Phone, Mail } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { SiteSettings } from '@/types';

export function ContactPage() {
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
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{t('Contact Us', 'ہم سے رابطہ کریں')}</h1>
        <p className="mt-2 text-muted">
          {t('We\'d love to hear from you. Reach out via WhatsApp or the details below.', 'ہم آپ سے سننا پسند کریں گے۔ واٹس ایپ یا نیچے دی گئی تفصیلات کے ذریعے رابطہ کریں۔')}
        </p>

        <div className="mt-6 rounded-3xl bg-soft p-6">
          <div className="space-y-4">
            {settings.contact_info.address && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted">{t('Address', 'پتہ')}</p>
                  <p className="text-ink">{settings.contact_info.address}</p>
                </div>
              </div>
            )}
            {settings.contact_info.phone && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted">{t('Phone', 'فون')}</p>
                  <p className="text-ink">{settings.contact_info.phone}</p>
                </div>
              </div>
            )}
            {settings.contact_info.email && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted">{t('Email', 'ای میل')}</p>
                  <p className="text-ink">{settings.contact_info.email}</p>
                </div>
              </div>
            )}
          </div>

          <a
            href={getGeneralWhatsAppLink(settings, lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 w-full"
          >
            <MessageCircle className="h-5 w-5" />
            {t('Message us on WhatsApp', 'واٹس ایپ پر پیغام بھیجیں')}
          </a>
        </div>
      </div>
    </div>
  );
}
