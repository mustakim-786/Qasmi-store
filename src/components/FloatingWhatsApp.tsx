import { MessageCircle } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useStoreData } from '@/context/StoreDataContext';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';

export function FloatingWhatsApp() {
  const { lang } = useLang();
  const { settings } = useStoreData();

  if (!settings) return null;

  return (
    <a
      href={getGeneralWhatsAppLink(settings, lang)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 end-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lift transition-all hover:bg-brand-600 hover:scale-110 active:scale-95"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute -top-1 -end-1 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-accent" />
      </span>
    </a>
  );
}
