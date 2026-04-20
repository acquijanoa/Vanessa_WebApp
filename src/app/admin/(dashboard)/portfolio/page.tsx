import { PortfolioAdminClient } from "./PortfolioAdminClient";
import { getPortfolioItems } from "@/lib/portfolio-data";

export default async function AdminPortfolioPage() {
  const items = await getPortfolioItems();
  return <PortfolioAdminClient initialItems={items} />;
}
