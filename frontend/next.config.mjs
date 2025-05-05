/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.gran-cereal-del-caribe.vercel.app",
          },
        ],
        destination: "https://gran-cereal-del-caribe.vercel.app/:path*",
        permanent: true,
        // Asegúrate de que la redirección no afecte las rutas de API
        // Excluye las rutas de API
        basePath: false, // Permite que la redirección no aplique a rutas específicas
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*", // Rutas de la API
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://www.grancerealdelcaribe.com", // Cambia el valor si es necesario
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
