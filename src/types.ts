export type Lang = 'en' | 'ur';
export type UnitType = 'meter' | 'piece' | 'ml' | 'bottle' | 'custom';
export type ProductStatus = 'active' | 'draft' | 'out_of_stock';
export type MediaResourceType = 'image' | 'video';

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  cover_image: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name_en: string;
  name_ur: string;
  hex_swatch?: string;
  images: MediaAsset[];
}

export interface MediaAsset {
  url: string;
  publicId?: string;
  resourceType: MediaResourceType;
}

export interface Product {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  category_id: string;
  description_en: string;
  description_ur: string;
  unit_type: UnitType;
  spec_note_en?: string;
  spec_note_ur?: string;
  price_retail: number;
  price_wholesale?: number;
  video?: MediaAsset;
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
}

export interface HomeBanner {
  image: string;
  caption_en: string;
  caption_ur: string;
}

export interface SiteSettings {
  store_name: string;
  logo_url: string;
  whatsapp_number: string;
  about_en: string;
  about_ur: string;
  contact_info: {
    address?: string;
    phone?: string;
    email?: string;
  };
  social_links: {
    facebook?: string;
    instagram?: string;
  };
  home_banners: HomeBanner[];
}

export interface Database {
  categories: Category[];
  products: Product[];
  site_settings: SiteSettings;
}
