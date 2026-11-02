import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // static routes, matched ahead of :ticker since static segments rank higher
  route("privacy", "routes/privacy.tsx"),
  route("api/search", "routes/api.search.ts"),
  route("api/watchlist", "routes/api.watchlist.ts"),
  route(":ticker", "routes/ticker.tsx"),
] satisfies RouteConfig;
