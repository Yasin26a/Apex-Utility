export const PRIMARY_CANONICAL_ORIGIN = 'https://apexutility.live';

/**
 * Clean and normalize a slug or path string
 */
function cleanSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+/i, '') // strip protocol/domain if present
    .replace(/^\/+|\/+$/g, '')
    .split('?')[0]
    .split('#')[0];
}

/**
 * Computes the single authoritative canonical URL for search engines and social cards.
 * Guarantees:
 * 1. Strict HTTPS protocol.
 * 2. Primary canonical origin (https://apexutility.live) - NEVER subdomains (regex., ai., png., etc.) and NEVER www.
 * 3. Clean paths without query parameters (?id=..., ?art=..., ?utm_...) or hash fragments.
 * 4. Resolves legacy /guides?id=slug and /<slug>?id=<slug> to the clean canonical /<slug>.
 */
export function getCanonicalUrl(
  pathname?: string,
  activeTab?: string,
  readingArticleId?: string
): string {
  // 1. If an article is explicitly active, canonical is https://apexutility.live/${articleId}
  if (readingArticleId) {
    return `${PRIMARY_CANONICAL_ORIGIN}/${cleanSlug(readingArticleId)}`;
  }

  // 2. Inspect query parameters if running in browser
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const queryArticleId = searchParams.get('id') || searchParams.get('art') || searchParams.get('article');
    if (queryArticleId) {
      return `${PRIMARY_CANONICAL_ORIGIN}/${cleanSlug(queryArticleId)}`;
    }
  }

  const path = (pathname || (typeof window !== 'undefined' ? window.location.pathname : '')) || '/';
  const clean = cleanSlug(path);

  // 3. Root homepage or dashboard
  if (!clean || clean === 'dashboard' || activeTab === 'dashboard') {
    return PRIMARY_CANONICAL_ORIGIN;
  }

  // 4. Guides catalog index page
  if (clean === 'guides' || activeTab === 'guides') {
    return `${PRIMARY_CANONICAL_ORIGIN}/guides`;
  }

  // 5. Tool tab or direct article slug
  const targetSlug = cleanSlug(activeTab && activeTab !== 'dashboard' ? activeTab : clean);
  return `${PRIMARY_CANONICAL_ORIGIN}/${targetSlug}`;
}

/**
 * Dynamically injects or updates the <link rel="canonical"> tag in document head.
 */
export function injectStrictCanonical(url: string) {
  if (typeof window === 'undefined') return;
  let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Enforces canonical domain redirection on client-side:
 * - Redirects http: to https:
 * - Redirects subdomains (*.apexutility.live) and www. to apexutility.live
 * - Rewrites dirty query parameters (?id=slug) to clean canonical paths
 */
export function enforceCanonicalEnvironment() {
  if (typeof window === 'undefined') return;

  const { hostname, protocol, pathname, search, hash } = window.location;

  // Only apply host redirection on production apexutility.live domains
  const isApexDomain = hostname === 'apexutility.live' || hostname.endsWith('.apexutility.live');

  if (isApexDomain) {
    const isHttp = protocol === 'http:';
    const isSubdomain = hostname !== 'apexutility.live';

    if (isHttp || isSubdomain) {
      // 301/replace navigation to single primary canonical origin
      const targetUrl = `${PRIMARY_CANONICAL_ORIGIN}${pathname}${search}${hash}`;
      window.location.replace(targetUrl);
      return;
    }
  }

  // Clean dirty query parameters like /guides?id=slug or /slug?id=slug
  const searchParams = new URLSearchParams(search);
  const articleId = searchParams.get('id') || searchParams.get('art') || searchParams.get('article');
  if (articleId && (pathname === '/guides' || pathname === `/${articleId}`)) {
    searchParams.delete('id');
    searchParams.delete('art');
    searchParams.delete('article');
    const remainingQuery = searchParams.toString();
    const cleanUrl = `/${cleanSlug(articleId)}${remainingQuery ? `?${remainingQuery}` : ''}${hash}`;
    window.history.replaceState(null, '', cleanUrl);
  }
}
