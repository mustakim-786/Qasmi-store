import type { Lang, Product, ProductVariant, Category, SiteSettings } from '@/types';

export function buildWhatsAppMessage(
  product: Product,
  category: Category | undefined,
  variant: ProductVariant | undefined,
  quantity: number,
  unitType: string,
  price: number,
  priceType: 'retail' | 'wholesale',
  productUrl: string,
  lang: Lang,
  storeName: string
): string {
  if (lang === 'ur') {
    return `السلام علیکم ${storeName}! میں یہ آرڈر کرنا چاہتا ہوں:

مصنوعہ: ${product.name_ur}
قسم: ${category?.name_ur ?? ''}
رنگ: ${variant?.name_ur ?? '—'}
مقدار: ${quantity} ${unitType}
قیمت: ₹${price} (${priceType === 'retail' ? 'پچھٹاؤ' : 'تھوک'} فی ${unitType})
لنک: ${productUrl}`;
  }

  return `Hi ${storeName}! I'd like to order:

Product: ${product.name_en}
Category: ${category?.name_en ?? ''}
Color: ${variant?.name_en ?? '—'}
Quantity: ${quantity} ${unitType}
Price: ₹${price} (${priceType} per ${unitType})
Product Link: ${productUrl}`;
}

export function getWhatsAppLink(number: string, message: string): string {
  const cleanNumber = number.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export async function shareToWhatsApp(
  imageUrl: string,
  message: string,
  waLink: string
): Promise<void> {
  // Try native share with file
  if (navigator.canShare) {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      const file = new File([blob], 'product.jpg', { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: message,
          files: [file],
        });
        return;
      }
    } catch {
      // Fall through to wa.me link
    }
  }

  // Fallback: open wa.me link
  window.open(waLink, '_blank');
}

export function getGeneralWhatsAppLink(settings: SiteSettings, lang: Lang): string {
  const cleanNumber = settings.whatsapp_number.replace(/[^0-9]/g, '');
  const message =
    lang === 'ur'
      ? `السلام علیکم ${settings.store_name}! مجھے آپ کی مصنوعات کے بارے میں معلومات چاہیے۔`
      : `Hi ${settings.store_name}! I'd like to know more about your products.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function getUnitLabel(unitType: string, lang: Lang): string {
  const labels: Record<string, { en: string; ur: string }> = {
    meter: { en: 'meter', ur: 'میٹر' },
    piece: { en: 'piece', ur: 'ٹکڑا' },
    ml: { en: 'ml', ur: 'ml' },
    bottle: { en: 'bottle', ur: 'بوتل' },
    custom: { en: 'unit', ur: 'یونٹ' },
  };
  const label = labels[unitType] || labels.custom;
  return lang === 'en' ? label.en : label.ur;
}
