/**
 * Affiliate Product Catalog Configuration
 * Strictly follows FTC and AdSense compliance:
 * - Empty by default (no dummy or fake affiliate links)
 * - Any future offers must link to real services with transparent disclosures
 * - All outbound links automatically tagged with rel="sponsored noopener noreferrer"
 */

export interface AffiliateProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'network' | 'creator' | 'hosting' | 'vpn' | 'developer' | 'general';
  affiliateUrl: string;
  badge?: string;
  targetPages: string[]; // Slugs of pages where this product can appear (e.g., 'whop-video-clipping-tool', 'internet-speed-test')
  callToAction: string;
  pricingNote?: string;
}

// STRICT RULE: Empty by default. No fake recommendations or fabricated pricing.
export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [];
