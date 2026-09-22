import { supabase } from '@/lib/supabase';
import type {
  Category,
  Product,
  ProductVariant,
  SiteSettings,
  UnitType,
  ProductStatus,
  MediaAsset,
} from '@/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface ProductRow {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  category_id: string;
  description_en: string;
  description_ur: string;
  unit_type: string;
  spec_note_en: string | null;
  spec_note_ur: string | null;
  price_retail: number;
  price_wholesale: number | null;
  video_url: string | null;
  video_public_id?: string | null;
  status: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

interface VariantRow {
  id: string;
  product_id: string;
  name_en: string;
  name_ur: string;
  hex_swatch: string | null;
  images: unknown;
  display_order: number;
}

interface SettingsRow {
  id: number;
  store_name: string;
  logo_url: string;
  whatsapp_number: string;
  about_en: string;
  about_ur: string;
  contact_info: { address?: string; phone?: string; email?: string };
  social_links: { facebook?: string; instagram?: string };
  home_banners: { image: string; caption_en: string; caption_ur: string }[];
  updated_at: string;
}

// ============================================================
// In-memory cache with TTL — eliminates redundant DB queries
// within a page session. Storefront data rarely changes.
// ============================================================

const CACHE_TTL = 60_000; // 60 seconds

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function hasCached(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return false;
  }
  return true;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

function dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = factory().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

function invalidatePattern(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

// ============================================================
// Mappers
// ============================================================

function toMediaAsset(value: unknown, resourceType: 'image' | 'video'): MediaAsset | undefined {
  if (typeof value === 'string') {
    return value.trim() ? { url: value, resourceType } : undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as { url?: unknown; publicId?: unknown; public_id?: unknown; resourceType?: unknown; resource_type?: unknown };
  if (typeof raw.url !== 'string' || !raw.url.trim()) return undefined;
  return {
    url: raw.url,
    publicId: typeof raw.publicId === 'string' ? raw.publicId : typeof raw.public_id === 'string' ? raw.public_id : undefined,
    resourceType: raw.resourceType === 'video' || raw.resource_type === 'video' ? 'video' : resourceType,
  };
}

function toMediaAssets(value: unknown, resourceType: 'image' | 'video'): MediaAsset[] {
  if (!Array.isArray(value)) return [];
  return value.map((asset) => toMediaAsset(asset, resourceType)).filter((asset): asset is MediaAsset => Boolean(asset));
}

function mapProduct(row: ProductRow, variants: VariantRow[]): Product {
  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name_en,
    name_ur: row.name_ur,
    category_id: row.category_id,
    description_en: row.description_en,
    description_ur: row.description_ur,
    unit_type: row.unit_type as UnitType,
    spec_note_en: row.spec_note_en || undefined,
    spec_note_ur: row.spec_note_ur || undefined,
    price_retail: Number(row.price_retail),
    price_wholesale: row.price_wholesale != null ? Number(row.price_wholesale) : undefined,
    video: row.video_url ? { url: row.video_url, publicId: row.video_public_id || undefined, resourceType: 'video' } : undefined,
    status: row.status as ProductStatus,
    featured: row.featured,
    created_at: row.created_at,
    updated_at: row.updated_at,
    variants: variants
      .sort((a, b) => a.display_order - b.display_order)
      .map((v) => ({
        id: v.id,
        product_id: v.product_id,
        name_en: v.name_en,
        name_ur: v.name_ur,
        hex_swatch: v.hex_swatch || undefined,
        images: toMediaAssets(v.images, 'image'),
      })),
  };
}

async function fetchVariantsForProducts(productIds: string[]): Promise<Map<string, VariantRow[]>> {
  const map = new Map<string, VariantRow[]>();
  if (productIds.length === 0) return map;

  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .in('product_id', productIds)
    .order('display_order', { ascending: true });

  if (error) throw error;
  (data as VariantRow[]).forEach((v) => {
    const arr = map.get(v.product_id) || [];
    arr.push(v);
    map.set(v.product_id, arr);
  });
  return map;
}

async function fetchVariantsForProduct(productId: string): Promise<VariantRow[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data as VariantRow[];
}

async function mapProductsWithVariants(rows: ProductRow[]): Promise<Product[]> {
  const variantMap = await fetchVariantsForProducts(rows.map((r) => r.id));
  return rows.map((r) => mapProduct(r, variantMap.get(r.id) || []));
}

// ============================================================
// Data Service
// ============================================================

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export interface CatalogQuery {
  categoryId?: string;
  search?: string;
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page: number;
  pageSize: number;
}

type ProductMutation = {
  slug?: string;
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
  variants: Array<Pick<ProductVariant, 'name_en' | 'name_ur' | 'hex_swatch' | 'images'>>;
};

function productRpcPayload(product: ProductMutation) {
  return {
    slug: product.slug || slugify(product.name_en),
    name_en: product.name_en,
    name_ur: product.name_ur,
    category_id: product.category_id,
    description_en: product.description_en,
    description_ur: product.description_ur,
    unit_type: product.unit_type,
    spec_note_en: product.spec_note_en || '',
    spec_note_ur: product.spec_note_ur || '',
    price_retail: product.price_retail,
    price_wholesale: product.price_wholesale ?? null,
    video: product.video || null,
    status: product.status,
    featured: product.featured,
  };
}

export const dataService = {
  // ---------- Categories ----------
  async getCategories(): Promise<Category[]> {
    const key = 'categories';
    const cached = getCached<Category[]>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      const result = data as Category[];
      setCached(key, result);
      return result;
    });
  },

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const key = `category_slug:${slug}`;
    const cached = getCached<Category | undefined>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      const result = (data as Category) || undefined;
      setCached(key, result);
      return result;
    });
  },

  async getCategoryById(id: string): Promise<Category | undefined> {
    const key = `category_id:${id}`;
    const cached = getCached<Category | undefined>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      const result = (data as Category) || undefined;
      setCached(key, result);
      return result;
    });
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        slug: cat.slug,
        name_en: cat.name_en,
        name_ur: cat.name_ur,
        cover_image: cat.cover_image,
        display_order: cat.display_order,
      })
      .select()
      .single();
    if (error) throw error;
    invalidatePattern('categor');
    invalidatePattern('catalog');
    cache.delete('stats');
    return data as Category;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const { data, error } = await supabase
      .from('categories')
      .update({
        slug: updates.slug,
        name_en: updates.name_en,
        name_ur: updates.name_ur,
        cover_image: updates.cover_image,
        display_order: updates.display_order,
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    invalidatePattern('categor');
    invalidatePattern('catalog');
    cache.delete('stats');
    return (data as Category) || undefined;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);
    if (countError) throw countError;
    if (count && count > 0) return false;

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    invalidatePattern('categor');
    invalidatePattern('catalog');
    cache.delete('stats');
    return true;
  },

  // ---------- Products ----------
  async getProducts(): Promise<Product[]> {
    const key = 'products_all';
    const cached = getCached<Product[]>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const result = await mapProductsWithVariants(data as ProductRow[]);
      setCached(key, result);
      return result;
    });
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const key = `products_cat:${categoryId}`;
    const cached = getCached<Product[]>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .in('status', ['active', 'out_of_stock'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      const result = await mapProductsWithVariants(data as ProductRow[]);
      setCached(key, result);
      return result;
    });
  },

  async getProductsByCategoryPaginated(
    categoryId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<Product>> {
    const key = `products_cat_paginated:${categoryId}:${page}:${pageSize}`;
    const cached = getCached<PaginatedResult<Product>>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const [productsResult, countResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('category_id', categoryId)
          .in('status', ['active', 'out_of_stock'])
          .order('created_at', { ascending: false })
          .range(from, to),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', categoryId)
          .in('status', ['active', 'out_of_stock']),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (countResult.error) throw countResult.error;

      const rows = productsResult.data as ProductRow[];
      const items = await mapProductsWithVariants(rows);
      const total = countResult.count || 0;
      const result: PaginatedResult<Product> = {
        items,
        total,
        hasMore: from + items.length < total,
        page,
        pageSize,
      };
      setCached(key, result);
      return result;
    });
  },

  async getCatalog(query: CatalogQuery): Promise<PaginatedResult<Product>> {
    const normalized = {
      ...query,
      search: query.search?.trim() || undefined,
      colors: query.colors?.filter(Boolean) || [],
      page: Math.max(1, query.page),
      pageSize: Math.min(48, Math.max(1, query.pageSize)),
      sort: query.sort || 'newest',
    };
    const key = `catalog:${JSON.stringify(normalized)}`;
    const cached = getCached<PaginatedResult<Product>>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase.rpc('catalog_product_ids', {
        p_category_id: normalized.categoryId || null,
        p_query: normalized.search || null,
        p_colors: normalized.colors,
        p_min_price: normalized.minPrice ?? null,
        p_max_price: normalized.maxPrice ?? null,
        p_sort: normalized.sort,
        p_page: normalized.page,
        p_page_size: normalized.pageSize,
      });
      if (error) throw error;
      const rows = (data || []) as { product_id: string; total_count: number }[];
      const ids = rows.map((row) => row.product_id);
      const products = await this.getProductsByIds(ids);
      const byId = new Map(products.map((product) => [product.id, product]));
      const items = ids.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
      const total = rows.length ? Number(rows[0].total_count) : 0;
      const result = { items, total, hasMore: normalized.page * normalized.pageSize < total, page: normalized.page, pageSize: normalized.pageSize };
      setCached(key, result);
      return result;
    });
  },

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const key = `product_slug:${slug}`;
    const cached = getCached<Product | undefined>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .in('status', ['active', 'out_of_stock'])
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setCached(key, undefined);
        return undefined;
      }
      const row = data as ProductRow;
      const variants = await fetchVariantsForProduct(row.id);
      const result = mapProduct(row, variants);
      setCached(key, result);
      return result;
    });
  },

  async getProductById(id: string): Promise<Product | undefined> {
    const key = `product_id:${id}`;
    const cached = getCached<Product | undefined>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setCached(key, undefined);
        return undefined;
      }
      const row = data as ProductRow;
      const variants = await fetchVariantsForProduct(row.id);
      const result = mapProduct(row, variants);
      setCached(key, result);
      return result;
    });
  },

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const sortedIds = [...ids].sort();
    const key = `products_ids:${sortedIds.join(',')}`;
    const cached = getCached<Product[]>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', ids)
        .in('status', ['active', 'out_of_stock']);
      if (error) throw error;
      const result = await mapProductsWithVariants(data as ProductRow[]);
      setCached(key, result);
      return result;
    });
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const key = 'products_featured';
    const cached = getCached<Product[]>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .in('status', ['active', 'out_of_stock'])
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      const result = await mapProductsWithVariants(data as ProductRow[]);
      setCached(key, result);
      return result;
    });
  },

  async getRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<Product[]> {
    const key = `products_related:${productId}:${limit}`;
    const cached = getCached<Product[]>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .neq('id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      const result = await mapProductsWithVariants(data as ProductRow[]);
      setCached(key, result);
      return result;
    });
  },

  async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    const key = `search:${query}:${limit}`;
    const cached = getCached<Product[]>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      // Use full-text search via the search_vector column
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .textSearch('search_vector', query, { type: 'plain' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      const result = await mapProductsWithVariants(data as ProductRow[]);
      setCached(key, result);
      return result;
    });
  },

  async searchProductsPaginated(
    query: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<Product>> {
    const key = `search_paginated:${query}:${page}:${pageSize}`;
    const cached = getCached<PaginatedResult<Product>>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const [searchResult, countResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .textSearch('search_vector', query, { type: 'plain' })
          .in('status', ['active', 'out_of_stock'])
          .order('created_at', { ascending: false })
          .range(from, to),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .textSearch('search_vector', query, { type: 'plain' })
          .in('status', ['active', 'out_of_stock']),
      ]);

      if (searchResult.error) throw searchResult.error;
      if (countResult.error) throw countResult.error;

      const rows = searchResult.data as ProductRow[];
      const items = await mapProductsWithVariants(rows);
      const total = countResult.count || 0;
      const result: PaginatedResult<Product> = {
        items,
        total,
        hasMore: from + items.length < total,
        page,
        pageSize,
      };
      setCached(key, result);
      return result;
    });
  },

  async createProduct(product: ProductMutation): Promise<Product> {
    const { data: productId, error } = await supabase.rpc('save_product', {
      p_product_id: null,
      p_product: productRpcPayload(product),
      p_variants: product.variants.map((variant) => ({
        name_en: variant.name_en,
        name_ur: variant.name_ur,
        hex_swatch: variant.hex_swatch || null,
        images: variant.images,
      })),
    });
    if (error || !productId) throw error || new Error('Product could not be saved.');
    invalidatePattern('product');
    invalidatePattern('search');
    invalidatePattern('catalog');
    cache.delete('stats');
    const saved = await this.getProductById(productId as string);
    if (!saved) throw new Error('Product was saved but could not be reloaded.');
    return saved;
  },

  async updateProduct(
    id: string,
    updates: ProductMutation
  ): Promise<Product | undefined> {
    const { data: productId, error } = await supabase.rpc('save_product', {
      p_product_id: id,
      p_product: productRpcPayload(updates),
      p_variants: updates.variants.map((variant) => ({
        name_en: variant.name_en,
        name_ur: variant.name_ur,
        hex_swatch: variant.hex_swatch || null,
        images: variant.images,
      })),
    });
    if (error) throw error;
    if (!productId) return undefined;
    invalidatePattern('product');
    invalidatePattern('search');
    invalidatePattern('catalog');
    cache.delete('stats');
    const result = await this.getProductById(id);
    return result;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    invalidatePattern('product');
    invalidatePattern('search');
    invalidatePattern('catalog');
    cache.delete('stats');
    return true;
  },

  // ---------- Site Settings ----------
  async getSettings(): Promise<SiteSettings> {
    const key = 'settings';
    const cached = getCached<SiteSettings>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      let result: SiteSettings;
      if (!data) {
        result = {
          store_name: '',
          logo_url: '',
          whatsapp_number: '',
          about_en: '',
          about_ur: '',
          contact_info: {},
          social_links: {},
          home_banners: [],
        };
      } else {
        const row = data as SettingsRow;
        result = {
          store_name: row.store_name,
          logo_url: row.logo_url,
          whatsapp_number: row.whatsapp_number,
          about_en: row.about_en,
          about_ur: row.about_ur,
          contact_info: row.contact_info || {},
          social_links: row.social_links || {},
          home_banners: row.home_banners || [],
        };
      }
      setCached(key, result);
      return result;
    });
  },

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    const { data, error } = await supabase
      .from('site_settings')
      .update({
        store_name: updates.store_name,
        logo_url: updates.logo_url,
        whatsapp_number: updates.whatsapp_number,
        about_en: updates.about_en,
        about_ur: updates.about_ur,
        contact_info: updates.contact_info,
        social_links: updates.social_links,
        home_banners: updates.home_banners,
      })
      .eq('id', 1)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Failed to update settings');
    const row = data as SettingsRow;
    const result: SiteSettings = {
      store_name: row.store_name,
      logo_url: row.logo_url,
      whatsapp_number: row.whatsapp_number,
      about_en: row.about_en,
      about_ur: row.about_ur,
      contact_info: row.contact_info || {},
      social_links: row.social_links || {},
      home_banners: row.home_banners || [],
    };
    cache.delete('settings');
    return result;
  },

  // ---------- Stats (lightweight — no variant fetching) ----------
  async getStats() {
    const key = 'stats';
    const cached = getCached<{ total: number; perCategory: { category: Category; count: number }[]; outOfStock: number; featured: number }>(key);
    if (hasCached(key)) return cached!;
    return dedupe(key, async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats');
      if (error || !data) throw error || new Error('Unable to load dashboard statistics.');
      const stats = data as { total?: number; outOfStock?: number; featured?: number; perCategory?: { category: Category; count: number }[] };
      const result = {
        total: Number(stats.total || 0),
        outOfStock: Number(stats.outOfStock || 0),
        featured: Number(stats.featured || 0),
        perCategory: Array.isArray(stats.perCategory) ? stats.perCategory : [],
      };
      setCached(key, result);
      return result;
    });
  },

  // ---------- Cache management ----------
  clearCache() {
    cache.clear();
    inflight.clear();
  },

  // ---------- Utility ----------
  slugify,
};
