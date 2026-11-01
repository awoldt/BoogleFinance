import type { Config } from "@react-router/dev/config";

export default {
  // SSR: loaders run on the node server, which is the only thing that talks
  // to the Go API
  ssr: true,
} satisfies Config;
