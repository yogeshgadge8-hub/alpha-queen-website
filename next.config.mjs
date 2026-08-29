/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next-hostinger",
  output: "standalone",
  serverExternalPackages: ["mysql2"],
  experimental: { cpus: 1, webpackBuildWorker: false },
};

export default nextConfig;
