/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.gran-cereal-del-caribe.vercel.app" }],
        destination: "https://gran-cereal-del-caribe.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
