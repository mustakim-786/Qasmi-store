import { memo, useState } from 'react';
import { Star } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { Link } from '@/context/RouterContext';
import { OrderButton } from '@/components/OrderButton';
import { getUnitLabel } from '@/lib/whatsapp';
import type { Product, Category } from '@/types';

function ProductCardComponent({
  product,
  category,
}: {
  product: Product;
  category?: Category;
}) {
  const { lang, t } = useLang();
  const firstVariant = product.variants[0];
  const image = firstVariant?.images?.[0]?.url || category?.cover_image || '';
  const hasWholesale = product.price_wholesale != null;
  const startingPrice = hasWholesale ? product.price_wholesale! : product.price_retail;
  const isOutOfStock = product.status === 'out_of_stock';
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="card group flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden">
        <div className="aspect-[3/4] overflow-hidden bg-brand-50">
          {!imageLoaded && image && (
            <div className="absolute inset-0 animate-pulse bg-brand-100" />
          )}
          {image && (
            <img
              src={image}
              alt={lang === 'en' ? product.name_en : product.name_ur}
              width={300}
              height={400}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
        {product.featured && (
          <span className="badge badge-featured absolute top-2.5 start-2.5">
            <Star className="h-3 w-3" />
            {t('Featured', 'نمایاں')}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="badge badge-stock text-sm">
              {t('Out of Stock', 'نمبرد نہیں')}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link to={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink leading-snug">
            {lang === 'en' ? product.name_en : product.name_ur}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-xs text-muted">{t('From', 'سے')}</span>
          <span className="text-lg font-bold text-brand-500">₹{startingPrice}</span>
          <span className="text-xs text-muted">
            /{getUnitLabel(product.unit_type, lang)}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <OrderButton
            product={product}
            category={category}
            variant={firstVariant}
            quantity={1}
            price={startingPrice}
            priceType={hasWholesale ? 'wholesale' : 'retail'}
            className="w-full text-sm"
          >
            <span className="flex items-center gap-1.5">
              {t('Order', 'آرڈر')}
            </span>
          </OrderButton>
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
