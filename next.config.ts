import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Emit the minimal server and traced runtime dependencies used by Docker.
  output: "standalone",
  turbopack: {
    // A yarn.lock also exists at D:\ (outside the repo), which makes Turbopack
    // misdetect the workspace root — pin it to this project explicitly.
    root: path.join(__dirname),
  },
};

export default withNextIntl(nextConfig);
