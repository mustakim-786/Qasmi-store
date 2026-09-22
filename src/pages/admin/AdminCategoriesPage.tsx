import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { dataService } from '@/data/dataService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FileUploadArea, type UploadedFile } from '@/components/FileUploadArea';
import { isHttpsUrl } from '@/lib/urls';
import type { Category } from '@/types';

export function AdminCategoriesPage() {
  const { t } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverFiles, setCoverFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    const cats = await dataService.getCategories();
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openForm = (category?: Category) => {
    setEditing(category || null);
    setIsNew(!category);
    setNameEn(category?.name_en || '');
    setNameUr(category?.name_ur || '');
    setCoverImage(category?.cover_image || '');
    setCoverFiles([]);
    setError('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameUr) { setError(t('Both names are required.', 'دونوں نام ضروری ہیں۔')); return; }
    if (coverFiles.some((file) => file.uploadStatus === 'uploading')) { setError('Wait for the cover upload to finish.'); return; }
    if (coverFiles.some((file) => file.uploadStatus === 'error')) { setError('Remove or retry the failed cover upload.'); return; }
    const uploadedCover = coverFiles.find((file) => file.cloudinaryUrl)?.cloudinaryUrl;
    const resolvedCover = uploadedCover || coverImage;
    if (resolvedCover && !isHttpsUrl(resolvedCover)) { setError('Cover image must use a valid HTTPS URL.'); return; }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await dataService.createCategory({
          slug: dataService.slugify(nameEn),
          name_en: nameEn,
          name_ur: nameUr,
          cover_image: resolvedCover || 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800',
          display_order: categories.length + 1,
        });
      } else if (editing) {
        await dataService.updateCategory(editing.id, {
          name_en: nameEn,
          name_ur: nameUr,
          slug: dataService.slugify(nameEn),
          cover_image: resolvedCover,
        });
      }
      await loadCategories();
      setEditing(null);
      setIsNew(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to save category.', 'قسم محفوظ کرنے میں ناکامی۔'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: Category) => {
    if (!window.confirm(t('Delete this category? It must have no products.', 'یہ قسم حذف کریں؟ اس میں کوئی مصنوعات نہیں ہونی چاہئیں۔'))) return;
    try {
      const success = await dataService.deleteCategory(category.id);
      if (!success) {
        setError(t('Remove all products from this category first.', 'پہلے اس قسم سے تمام مصنوعات ہٹائں۔'));
        return;
      }
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to delete category.', 'قسم حذف کرنے میں ناکامی۔'));
    }
  };

  if (loading && !editing && !isNew) {
    return (
      <AdminLayout active="categories">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (editing || isNew) return (
    <AdminLayout active="categories">
      <button onClick={() => { setEditing(null); setIsNew(false); }} className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-brand-500"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('Back to Categories', 'اقسام پر واپس')}</button>
      <h1 className="text-2xl font-bold text-ink">{isNew ? t('Add Category', 'قسم شامل کریں') : t('Edit Category', 'قسم میں ترمیم')}</h1>
      <form onSubmit={save} className="mt-6 max-w-2xl space-y-5 rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <div><label className="label-field">{t('Name (English) *', 'نام (انگریزی) *')}</label><input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="input-field" required /></div>
        <div><label className="label-field">{t('Name (Urdu) *', 'نام (اردو) *')}</label><input value={nameUr} onChange={(e) => setNameUr(e.target.value)} dir="rtl" className="input-field font-urdu" required /></div>
        <FileUploadArea label="Cover image" accept="image/jpeg,image/png,image/webp,image/avif" multiple={false} onFilesChange={setCoverFiles} files={coverFiles} type="image" />
        <div><label className="label-field">{t('Cover Image URL', 'کور تصویر URL')}</label><input type="url" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="input-field" placeholder="https://images..." /><p className="mt-1 text-xs text-muted">Use the secure uploader above, or provide an HTTPS URL.</p></div>
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        <div className="flex gap-3"><button type="button" onClick={() => { setEditing(null); setIsNew(false); }} className="btn-outline flex-1" disabled={saving}>{t('Cancel', 'منسوخ')}</button><button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? t('Saving...', 'محفوظ کیا جا رہا ہے...') : t('Save Category', 'قسم محفوظ کریں')}</button></div>
      </form>
    </AdminLayout>
  );

  return (
    <AdminLayout active="categories">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-ink sm:text-3xl">{t('Categories', 'اقسام')}</h1><p className="mt-1 text-muted">{t('Organize your product catalog', 'اپنی مصنوعات کی فہرست منظم کریں')}</p></div><button onClick={() => openForm()} className="btn-primary"><Plus className="h-5 w-5" /><span className="hidden sm:inline">{t('Add Category', 'قسم شامل کریں')}</span></button></div>
      {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => <div key={category.id} className="overflow-hidden rounded-2xl bg-white shadow-card"><img src={category.cover_image} alt={category.name_en} className="h-40 w-full object-cover" /><div className="p-4"><p className="font-bold text-ink">{category.name_en}</p><p className="font-urdu text-muted">{category.name_ur}</p><p className="mt-2 text-xs text-muted">Order: {category.display_order}</p><div className="mt-3 flex gap-2"><button onClick={() => openForm(category)} className="btn-ghost flex-1 text-sm"><Pencil className="h-4 w-4" />{t('Edit', 'ترمیم')}</button><button onClick={() => remove(category)} className="rounded-xl px-3 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div></div>)}
      </div>
    </AdminLayout>
  );
}
