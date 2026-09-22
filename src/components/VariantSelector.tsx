import { useLang } from '@/context/LanguageContext';
import type { ProductVariant } from '@/types';

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { lang, t } = useLang();

  if (variants.length <= 1) return null;

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-muted">
        {t('Select Color / Variant', 'رنگ / قسم منتخب کریں')}
      </h4>
      <div className="flex flex-wrap gap-2.5">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          return (
            <button
              key={variant.id}
              onClick={() => onSelect(variant.id)}
              className={`flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2.5 transition-all active:scale-95 ${
                isSelected
                  ? 'border-brand-500 bg-brand-50 shadow-soft'
                  : 'border-brand-200 bg-white hover:border-brand-300'
              }`}
              style={{ minHeight: 44 }}
            >
              {variant.hex_swatch && (
                <span
                  className="h-5 w-5 rounded-full border border-brand-200"
                  style={{ backgroundColor: variant.hex_swatch }}
                />
              )}
              <span className={`text-sm font-medium ${isSelected ? 'text-brand-500' : 'text-ink'}`}>
                {lang === 'en' ? variant.name_en : variant.name_ur}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
