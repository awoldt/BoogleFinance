import type { Route } from "./+types/home";
import { FinanceHome } from "~/components/finance-home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Finance" },
    {
      name: "description",
      content: "Search stocks, follow a watchlist, and scan the market.",
    },
  ];
}

export default function Home() {
  return <FinanceHome />;
}
