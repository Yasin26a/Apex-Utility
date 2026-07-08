import React, { useEffect } from 'react';

interface SEOHeaderProps {
  title: string;
  description?: string;
  keyword?: string;
  category?: string;
  colorClass?: string;
}

export const SEOHeader: React.FC<SEOHeaderProps> = ({
  title,
  description,
  keyword,
  category,
  colorClass = 'text-brand'
}) => {
  useEffect(() => {
    // 1. Update browser tab title
    const originalTitle = document.title;
    if (title) {
      document.title = `${title} | Apex Utility Labs`;
    }

    // 2. Manage meta description tag
    let descMeta = document.querySelector('meta[name="description"]');
    const originalDesc = descMeta ? descMeta.getAttribute('content') : null;
    if (description) {
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', description);
    }

    // 3. Manage meta keywords tag
    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    const originalKeywords = keywordsMeta ? keywordsMeta.getAttribute('content') : null;
    const computedKeywords = keyword || (title ? title.toLowerCase().split(' ').join(', ') : '');
    if (computedKeywords) {
      if (!keywordsMeta) {
        keywordsMeta = document.createElement('meta');
        keywordsMeta.setAttribute('name', 'keywords');
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.setAttribute('content', computedKeywords);
    }

    // Restore original values when unmounted or when dependencies update
    return () => {
      document.title = originalTitle;
      if (descMeta) {
        if (originalDesc !== null) {
          descMeta.setAttribute('content', originalDesc);
        } else {
          descMeta.remove();
        }
      }
      if (keywordsMeta) {
        if (originalKeywords !== null) {
          keywordsMeta.setAttribute('content', originalKeywords);
        } else {
          keywordsMeta.remove();
        }
      }
    };
  }, [title, description, keyword]);

  return (
    <div className="space-y-1 mb-6">
      {category && (
        <span className={`text-[10px] font-mono font-bold tracking-widest ${colorClass} uppercase`}>
          {category}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
        {title}
      </h1>
      {description && (
        <p className="text-slate-400 text-xs sm:text-sm">
          {description}
        </p>
      )}
    </div>
  );
};
