/**
 * Business and Legal Identity Configuration
 * Used across legal pages (Privacy Policy, Terms of Service, Cookie Policy, Affiliate Disclosure)
 * and compliance headers.
 */

export interface BusinessDetails {
  brandName: string;
  legalEntity: string;
  siteName: string;
  domain: string;
  fullDomainUrl: string;
  contactEmail: string;
  effectiveDate: string;
  lastUpdatedDate: string;
  country: string;
  hostingProvider: string;
  adNetwork: string;
  adSensePublisherId: string;
  analyticsTool: string;
  paymentProvider: string;
}

export const BUSINESS_DETAILS: BusinessDetails = {
  brandName: 'Apex Utility Labs',
  legalEntity: 'Apex Utility Labs LLC',
  siteName: 'APEX UTILITY',
  domain: 'apexutility.live',
  fullDomainUrl: 'https://apexutility.live',
  contactEmail: 'Yasinalam67@gmail.com',
  effectiveDate: 'January 1, 2026',
  lastUpdatedDate: 'November 7, 2026',
  country: 'United States',
  hostingProvider: 'Cloudflare Pages & Edge Infrastructure',
  adNetwork: 'Google AdSense',
  adSensePublisherId: 'ca-pub-3493943620806779',
  analyticsTool: 'Google Analytics 4 & Cloudflare Web Analytics (Cookieless)',
  paymentProvider: 'None (100% Free Client-Side Utilities)'
};
