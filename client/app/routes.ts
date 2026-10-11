import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route(":ticker", "routes/ticker.tsx"),
] satisfies RouteConfig;
