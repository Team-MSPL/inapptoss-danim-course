type KKdaySearchBodyProps = {
  country_keys?: string[];
  city_keys?: string[];
  cat_keys?: string[];
  page_size?: number;
  date_from?: string | null;
  date_to?: string | null;
  guide_langs?: string[];
  price_from?: string | number | null;
  price_to?: string | number | null;
  keywords?: string;
  sort?: string;
  start?: number;
  durations?: string[];
  facets?: string[];
  stats?: string[];
  locale?: string;
  state?: string;
  has_pkg?: boolean;
  tourism?: boolean;
  have_translate?: boolean;
  instant_booking?: boolean;
  product_categories?: string[];
};

export function buildKKdaySearchBody(params: KKdaySearchBodyProps) {
  // 빈 값, undefined, 빈 배열, 빈 문자열은 아예 body에 안 넣는다!
  const body: Record<string, any> = {
    facets: params.facets && params.facets.length > 0 ? params.facets : undefined,
    country_keys: params.country_keys && params.country_keys.length > 0 ? params.country_keys : undefined,
    city_keys: params.city_keys && params.city_keys.length > 0 ? params.city_keys : undefined,
    cat_keys: params.cat_keys && params.cat_keys.length > 0 ? params.cat_keys : undefined,
    page_size: params.page_size || 20,
    date_from: params.date_from ?? undefined,
    date_to: params.date_to ?? undefined,
    guide_langs: params.guide_langs && params.guide_langs.length > 0 ? params.guide_langs : undefined,
    price_from: params.price_from ?? undefined,
    price_to: params.price_to ?? undefined,
    keywords: params.keywords || undefined,
    sort: params.sort || undefined,
    start: typeof params.start === 'number' ? params.start : 0,
    durations: params.durations && params.durations.length > 0 ? params.durations : undefined,
    stats: params.stats && params.stats.length > 0 ? params.stats : undefined,
    locale: params.locale || undefined,
    state: params.state || undefined,
    has_pkg: typeof params.has_pkg === 'boolean' ? params.has_pkg : undefined,
    tourism: typeof params.tourism === 'boolean' ? params.tourism : undefined,
    have_translate: typeof params.have_translate === 'boolean' ? params.have_translate : undefined,
    instant_booking: typeof params.instant_booking === 'boolean' ? params.instant_booking : undefined,
    product_categories: params.product_categories && params.product_categories.length > 0 ? params.product_categories : undefined,
  };

  Object.keys(body).forEach(
    (k) =>
      (body[k] === undefined ||
        body[k] === '' ||
        (Array.isArray(body[k]) && body[k].length === 0)) &&
      delete body[k]
  );

  return body;
}