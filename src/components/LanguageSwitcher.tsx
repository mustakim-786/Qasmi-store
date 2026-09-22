import { useLang } from '@/context/LanguageContext';

export function LanguageSwitcher() {
  const { lang, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-500 transition-all hover:bg-brand-100 active:scale-95"
      aria-label="Switch language"
      style={{ minHeight: 36 }}
    >
      <span className={lang === 'en' ? 'font-bold' : 'opacity-50'}>EN</span>
      <span className="text-muted/40">|</span>
      <span className={lang === 'ur' ? 'font-bold font-urdu' : 'opacity-50'}>اردو</span>
    </button>
  );
}
