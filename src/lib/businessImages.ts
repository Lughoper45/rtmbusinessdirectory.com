import type { Business } from "@/types/directory";

const CATEGORY_IMAGE_FALLBACKS: Array<{ match: RegExp; url: string }> = [
  { match: /restaurant|food|cafe|dining/i, url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&auto=format&q=80" },
  { match: /health|medical|clinic|healtcare/i, url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop&auto=format&q=80" },
  { match: /shop|retail|store/i, url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop&auto=format&q=80" },
  { match: /home|hvac|repair|contractor|service/i, url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&auto=format&q=80" },
  { match: /beauty|spa|salon/i, url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=800&fit=crop&auto=format&q=80" },
  { match: /professional|finance|legal|consult/i, url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop&auto=format&q=80" },
];

const DEFAULT_BUSINESS_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format&q=80";

export function getBusinessImageFallback(business: Pick<Business, "category">) {
  return CATEGORY_IMAGE_FALLBACKS.find((entry) => entry.match.test(business.category))?.url ?? DEFAULT_BUSINESS_IMAGE;
}

export function getBusinessImageUrl(business: Pick<Business, "image" | "category">) {
  return business.image?.trim() ? business.image : getBusinessImageFallback(business);
}
