import { useState } from 'react';
import { Menu, X, MessageCircle, Search } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link, useRouter } from '@/context/RouterContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useStoreData } from '@/context/StoreDataContext';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import type { SiteSettings } from '@/types';

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

export function Header() {
  const { lang, t } = useLang();
  const { navigate } = useRouter();
  const { settings: rawSettings, categories } = useStoreData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const settings = rawSettings || defaultSettings;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/95 backdrop-blur-md">
      <div className="container-padding section-padding flex h-16 items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={settings.logo_url || '/qasmi_logo.jpeg'}
            alt={settings.store_name}
            className="h-12 w-auto rounded-lg object-contain"
            style={{ maxHeight: '48px' }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          <Link to="/" className="nav-link">{t('Home', 'ہوم')}</Link>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.slug}`} className="nav-link">
              {lang === 'en' ? cat.name_en : cat.name_ur}
            </Link>
          ))}
          <Link to="/about" className="nav-link">{t('About', 'تعارف')}</Link>
          <Link to="/contact" className="nav-link">{t('Contact', 'رابطہ')}</Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-brand-500 transition-all hover:bg-brand-50 active:scale-95"
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </button>
          <a
            href={getGeneralWhatsAppLink(settings, lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-all hover:bg-brand-100 active:scale-95"
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          <LanguageSwitcher />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-brand-500 transition-all hover:bg-brand-50 active:scale-95 lg:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-brand-100 bg-white px-4 py-3">
          <form onSubmit={handleSearch} className="container-padding mx-auto">
            <div className="flex items-center gap-2 rounded-xl bg-soft px-4">
              <Search className="h-5 w-5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search products...', 'مصنوعات تلاش کریں...')}
                className="w-full bg-transparent py-3 text-ink placeholder:text-muted/60 focus:outline-none"
                autoFocus
              />
              <button type="submit" className="text-sm font-semibold text-brand-500">
                {t('Go', 'جاؤ')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-brand-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-ink hover:bg-brand-50">
              {t('Home', 'ہوم')}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-ink hover:bg-brand-50"
              >
                {lang === 'en' ? cat.name_en : cat.name_ur}
              </Link>
            ))}
            <Link to="/about" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-ink hover:bg-brand-50">
              {t('About', 'تعارف')}
            </Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-ink hover:bg-brand-50">
              {t('Contact', 'رابطہ')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
