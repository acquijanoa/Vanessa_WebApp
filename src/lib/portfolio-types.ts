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
  /** Public URL path e.g. /uploads/portfolio/uuid.jpg */
  imageUrl: string;
  createdAt: string;
};

export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  social_celebraciones: "Social & Celebraciones",
  profesional_corporativo: "Profesional & Corporativo",
  editorial_moda: "Editorial & Moda",
  artistico_caracterizacion: "Artístico & Caracterización",
};

export function isPortfolioCategory(v: string): v is PortfolioCategory {
  return (PORTFOLIO_CATEGORIES as readonly string[]).includes(v);
}
