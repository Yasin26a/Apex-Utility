import React from 'react';
import { ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';
import { AFFILIATE_PRODUCTS, AffiliateProduct } from '../config/affiliates';
import { useAnalytics } from '../hooks/useAnalytics';

interface AffiliateRecommendationsProps {
  page: string;
  className?: string;
  onNavigateTab?: (path: string) => void;
}

export const AffiliateRecommendations: React.FC<AffiliateRecommendationsProps> = ({
  page,
  className = '',
  onNavigateTab
}) => {
  const { trackAffiliateClick } = useAnalytics();

  // Filter products relevant to the current page
  const matchingProducts = AFFILIATE_PRODUCTS.filter(
    item => item.targetPages.includes(page) || item.targetPages.includes('*')
  );

  // If no matching affiliate products exist, render NOTHING (zero layout shift, no empty box)
  if (!matchingProducts || matchingProducts.length === 0) {
    return null;
  }

  const handleLinkClick = (product: AffiliateProduct) => {
    trackAffiliateClick(product.id, page);
  };

  const handleDisclosureClick = (e: React.MouseEvent) => {
    if (onNavigateTab) {
      e.preventDefault();
      onNavigateTab('affiliate-disclosure');
    }
  };

  return (
    <section
      aria-label="Partner Recommendations & Disclosures"
      className={`my-10 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 p-6 sm:p-8 space-y-6 ${className}`}
    >
      {/* FTC Transparent Disclosure Notice */}
      <div className="flex items-start gap-3 pb-4 border-b border-zinc-800/80 text-xs text-zinc-400">
        <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="space-y-0.5">
          <div className="font-semibold text-zinc-200">Affiliate Disclosure &amp; Editorial Transparency</div>
          <p className="leading-relaxed">
            We may earn an affiliate commission if you purchase through our links, at zero additional cost to you. We only recommend professional tools that meet our technical standards. Read our{' '}
            <a
              href="/affiliate-disclosure"
              onClick={handleDisclosureClick}
              className="text-red-400 hover:text-red-300 underline font-medium"
            >
              Affiliate Disclosure
            </a>.
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {matchingProducts.map(product => (
          <div
            key={product.id}
            className="flex flex-col justify-between p-5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  {product.category}
                </span>
                {product.badge && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-red-950/60 border border-red-900/40 text-red-300">
                    {product.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-white text-base group-hover:text-red-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.pricingNote && (
                <div className="text-[11px] text-zinc-500 font-mono">
                  {product.pricingNote}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800/60">
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={() => handleLinkClick(product)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white transition-colors cursor-pointer border border-zinc-700"
              >
                <span>{product.callToAction || 'Learn More'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AffiliateRecommendations;
