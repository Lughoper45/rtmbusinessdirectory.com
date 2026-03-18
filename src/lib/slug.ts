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
  const nameSlug = slugifySegment(business.name);
  // Encode the full business_id into the slug for reliable lookup
  const slug = `${nameSlug}--${business.id}`;

  return `/directory/${slugifySegment(business.category)}/${slugifySegment(business.city)}/${slug}`;
}
