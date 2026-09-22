import { useState, useEffect } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useRouter } from '@/context/RouterContext';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { dataService } from '@/data/dataService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { SiteSettings } from '@/types';
import { isHttpsUrl } from '@/lib/urls';
import { useStoreData } from '@/context/StoreDataContext';

export function AdminSettingsPage() {
  const { t } = useLang();
  const { navigate } = useRouter();
  const { reload } = useStoreData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [aboutEn, setAboutEn] = useState('');
  const [aboutUr, setAboutUr] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await dataService.getSettings();
        if (cancelled) return;
        setStoreName(s.store_name);
        setWhatsapp(s.whatsapp_number);
        setLogoUrl(s.logo_url);
        setFacebook(s.social_links.facebook || '');
        setInstagram(s.social_links.instagram || '');
        setAboutEn(s.about_en);
        setAboutUr(s.about_ur);
        setAddress(s.contact_info.address || '');
        setPhone(s.contact_info.phone || '');
        setEmail(s.contact_info.email || '');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((logoUrl && !isHttpsUrl(logoUrl)) || (facebook && !isHttpsUrl(facebook)) || (instagram && !isHttpsUrl(instagram))) {
      setError('Logo and social links must use valid HTTPS URLs.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updates: Partial<SiteSettings> = {
        store_name: storeName,
      whatsapp_number: whatsapp,
        logo_url: logoUrl,
        about_en: aboutEn,
        about_ur: aboutUr,
        contact_info: { address, phone, email },
        social_links: { facebook, instagram },
      };
      await dataService.updateSettings(updates);
      reload();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to save settings.', 'ترتیبات محفوظ کرنے میں ناکامی۔'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout active="settings">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="settings">
      <button onClick={() => navigate('/admin/dashboard')} className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-brand-500"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('Back to Dashboard', 'ڈیش بورڈ پر واپس')}</button>
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{t('Store Settings', 'اسٹور کی ترتیبات')}</h1>
      <p className="mt-1 text-muted">{t('Update how your store appears to customers', 'اپنے اسٹور کی کسٹمرز کو ظاہری شکل اپ ڈیٹ کریں')}</p>
      <form onSubmit={save} className="mt-6 max-w-3xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6"><h2 className="text-lg font-bold text-ink">{t('Store Information', 'اسٹور کی معلومات')}</h2><div className="mt-4 space-y-4"><div><label className="label-field">{t('Store Name', 'اسٹور کا نام')}</label><input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="input-field" /></div><div><label className="label-field">Store logo URL (HTTPS)</label><input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="input-field" placeholder="https://…" /></div><div><label className="label-field">{t('WhatsApp Business Number', 'واٹس ایپ بزنس نمبر')}</label><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input-field" placeholder="919876543210" /><p className="mt-1 text-xs text-muted">{t('Include country code without + or spaces.', '+ یا خالی جگہوں کے بغیر ملک کا کوڈ شامل کریں۔')}</p></div></div></section>
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6"><h2 className="text-lg font-bold text-ink">Social links</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="label-field">Facebook URL (HTTPS)</label><input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="input-field" placeholder="https://…" /></div><div><label className="label-field">Instagram URL (HTTPS)</label><input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input-field" placeholder="https://…" /></div></div></section>
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6"><h2 className="text-lg font-bold text-ink">{t('About Text', 'تعارف متن')}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="label-field">{t('About (English)', 'تعارف (انگریزی)')}</label><textarea value={aboutEn} onChange={(e) => setAboutEn(e.target.value)} className="input-field min-h-36" /></div><div><label className="label-field">{t('About (Urdu)', 'تعارف (اردو)')}</label><textarea value={aboutUr} onChange={(e) => setAboutUr(e.target.value)} dir="rtl" className="input-field min-h-36 font-urdu" /></div></div></section>
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6"><h2 className="text-lg font-bold text-ink">{t('Contact Information', 'رابطہ کی معلومات')}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="label-field">{t('Address', 'پتہ')}</label><input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" /></div><div><label className="label-field">{t('Phone', 'فون')}</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" /></div><div><label className="label-field">{t('Email', 'ای میل')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" /></div></div></section>
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        <div className="flex items-center justify-end gap-4">{saved && <span className="text-sm font-medium text-green-600">{t('Settings saved successfully.', 'ترتیبات کامیابی سے محفوظ ہو گئیں۔')}</span>}<button type="submit" className="btn-primary" disabled={saving}>{saving ? t('Saving...', 'محفوظ کیا جا رہا ہے...') : (<><Save className="h-5 w-5" />{t('Save Settings', 'ترتیبات محفوظ کریں')}</>)}</button></div>
      </form>
    </AdminLayout>
  );
}
