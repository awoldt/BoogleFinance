import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // resource routes, matched ahead of :ticker since static segments rank higher
  route("api/search", "routes/api.search.ts"),
  route("api/watchlist", "routes/api.watchlist.ts"),
  route(":ticker", "routes/ticker.tsx"),
] satisfies RouteConfig;
