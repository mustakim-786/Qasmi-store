import { useState, type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import {
  buildWhatsAppMessage,
  getWhatsAppLink,
  shareToWhatsApp,
} from '@/lib/whatsapp';
import { useStoreData } from '@/context/StoreDataContext';
import type { Category, Product, ProductVariant } from '@/types';

interface OrderButtonProps {
  product: Product;
  category?: Category;
  variant: ProductVariant | undefined;
  quantity: number;
  price: number;
  priceType: 'retail' | 'wholesale';
  className?: string;
  children?: ReactNode;
}

export function OrderButton({
  product,
  category,
  variant,
  quantity,
  price,
  priceType,
  className = '',
  children,
}: OrderButtonProps) {
  const { lang } = useLang();
  const { settings } = useStoreData();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      const productUrl = `${window.location.origin}/product/${encodeURIComponent(product.slug)}`;
      const message = buildWhatsAppMessage(
        product,
        category,
        variant,
        quantity,
        product.unit_type,
        price,
        priceType,
        productUrl,
        lang,
        settings.store_name
      );
      const waLink = getWhatsAppLink(settings.whatsapp_number, message);
      await shareToWhatsApp(variant?.images?.[0]?.url || '', message, waLink);
    } catch {
      window.open(getWhatsAppLink(settings.whatsapp_number, `Hi ${settings.store_name}! I'd like to order ${product.name_en}.`), '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  };

  const disabled = product.status === 'out_of_stock' || loading || !settings;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`btn-primary ${className}`}
      aria-label="Order on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      {loading
        ? lang === 'en' ? 'Opening...' : 'کھول رہا ہے...'
        : children || (lang === 'en' ? 'Order on WhatsApp' : 'واٹس ایپ پر آرڈر کریں')}
    </button>
  );
}
