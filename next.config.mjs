/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["lighthouse", "@paulirish/trace_engine"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        lighthouse: "commonjs lighthouse",
        "@paulirish/trace_engine": "commonjs @paulirish/trace_engine",
      });
    }
    return config;
  },
};

export default nextConfig;
