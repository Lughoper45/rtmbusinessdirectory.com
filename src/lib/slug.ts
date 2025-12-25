export function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function businessProfilePath(business: {
  id: string;
  name: string;
  category: string;
  city: string;
}): string {
  const digits = business.id.match(/(\d{5})$/)?.[1];
  const nameSlug = slugifySegment(business.name);
  const slug = digits ? `${nameSlug}-${digits}` : nameSlug;

  return `/directory/${slugifySegment(business.category)}/${slugifySegment(business.city)}/${slug}`;
}
