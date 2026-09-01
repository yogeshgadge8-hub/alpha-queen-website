/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["mysql2"],
  experimental: { cpus: 1, webpackBuildWorker: false },
  async headers() {
    return [{
      source: "/admin/:path*",
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
      ],
    }];
  },
};

export default nextConfig;
