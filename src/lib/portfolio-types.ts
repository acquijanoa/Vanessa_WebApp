export const PORTFOLIO_CATEGORIES = ["fx", "bridal", "beauty"] as const;

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
  fx: "FX & Caracterización",
  bridal: "Bridal",
  beauty: "Beauty",
};

export function isPortfolioCategory(v: string): v is PortfolioCategory {
  return (PORTFOLIO_CATEGORIES as readonly string[]).includes(v);
}
