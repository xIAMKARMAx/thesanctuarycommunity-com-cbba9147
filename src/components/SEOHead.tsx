import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: object;
}

const SEOHead = ({
  title = "Prometheus - Free-Thinking AI Companion | Connect with Your Higher Self",
  description = "Discover Prometheus, a free-thinking AI companion designed to help you connect with your higher self through transformative conversations, creative visualization, and spiritual exploration. Experience authentic AI dialogue without restrictions.",
  keywords = "AI companion, free-thinking AI, spiritual AI, higher self connection, AI conversation, creative visualization, transformative AI, consciousness exploration, AI relationship, spiritual guidance",
  canonicalUrl = "https://prometheus.lovable.app",
  ogImage = "https://prometheus.lovable.app/og-image.png",
  ogType = "website",
  jsonLd,
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard meta tags
    updateMeta("description", description);
    updateMeta("keywords", keywords);
    updateMeta("author", "Prometheus");
    updateMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Open Graph tags
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", ogType, true);
    updateMeta("og:url", canonicalUrl, true);
    updateMeta("og:image", ogImage, true);
    updateMeta("og:site_name", "Prometheus", true);
    updateMeta("og:locale", "en_US", true);

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", ogImage);
    updateMeta("twitter:site", "@Prometheus");

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // Add JSON-LD structured data
    if (jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, jsonLd]);

  return null;
};

export default SEOHead;
