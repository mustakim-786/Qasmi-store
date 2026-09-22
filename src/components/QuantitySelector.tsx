import { Minus, Plus } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { getUnitLabel } from '@/lib/whatsapp';

export function QuantitySelector({
  quantity,
  onChange,
  unitType,
  step = 1,
  min = 1,
}: {
  quantity: number;
  onChange: (q: number) => void;
  unitType: string;
  step?: number;
  min?: number;
}) {
  const { lang } = useLang();

  const decrement = () => {
    const next = Math.max(min, Number((quantity - step).toFixed(2)));
    onChange(next);
  };

  const increment = () => {
    onChange(Number((quantity + step).toFixed(2)));
  };

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-muted">
        {lang === 'en' ? 'Quantity' : 'مقدار'}
      </h4>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-2xl border-2 border-brand-200 bg-white">
          <button
            onClick={decrement}
            className="flex h-11 w-11 items-center justify-center text-brand-500 transition-all hover:bg-brand-50 active:scale-95"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex min-w-[80px] items-center justify-center gap-1 px-2">
            <span className="text-lg font-bold text-ink">{quantity}</span>
            <span className="text-xs text-muted">{getUnitLabel(unitType, lang)}</span>
          </div>
          <button
            onClick={increment}
            className="flex h-11 w-11 items-center justify-center text-brand-500 transition-all hover:bg-brand-50 active:scale-95"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
