/** Slugs stored in DB / JSON; labels are Spanish for the public site. */
export const PORTFOLIO_CATEGORIES = [
  "social_celebraciones",
  "profesional_corporativo",
  "editorial_moda",
  "artistico_caracterizacion",
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export type PortfolioItem = {
  id: string;
  category: PortfolioCategory;
  title: string;
  description: string;
  /** Ordered image URLs; [0] is the cover on the homepage grid. */
  imageUrls: string[];
  /** Lower values appear first when listing portfolio entries. */
  sortOrder: number;
  createdAt: string;
};

/** Cover image for cards and admin thumbnails. */
export function portfolioCoverUrl(item: PortfolioItem): string {
  return item.imageUrls[0] ?? "";
}

export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  social_celebraciones: "Social & Celebraciones",
  profesional_corporativo: "Profesional & Corporativo",
  editorial_moda: "Editorial & Moda",
  artistico_caracterizacion: "Artístico & Caracterización",
};

export function isPortfolioCategory(v: string): v is PortfolioCategory {
  return (PORTFOLIO_CATEGORIES as readonly string[]).includes(v);
}
