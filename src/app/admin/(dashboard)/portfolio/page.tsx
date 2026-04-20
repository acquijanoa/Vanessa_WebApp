import { PortfolioAdminClient } from "./PortfolioAdminClient";
import { getPortfolioItems } from "@/lib/portfolio-data";

export default async function AdminPortfolioPage() {
  const items = await getPortfolioItems({ includeUnpublished: true });
  return <PortfolioAdminClient initialItems={items} />;
}
