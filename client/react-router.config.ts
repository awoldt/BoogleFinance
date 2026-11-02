import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  allowedActionOrigins: [
    "booglefinance.com",
    "www.booglefinance.com",
    "watchlist-production-2251.up.railway.app",
  ],
} satisfies Config;
