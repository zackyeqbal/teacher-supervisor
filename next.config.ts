import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Log tiap fetch server-side (termasuk query Supabase) + durasinya di terminal dev.
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
