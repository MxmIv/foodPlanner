/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return process.env.NODE_ENV === "development"
        ? [
          {
            source: "/(.*)",
            headers: [
              {
                key: "Access-Control-Allow-Origin",
                value: "*", // ✅ Allows external API requests ONLY in dev mode
              },
              {
                key: "Access-Control-Allow-Methods",
                value: "GET, POST, OPTIONS",
              },
              {
                key: "Access-Control-Allow-Headers",
                value: "X-Requested-With, Content-Type, Accept",
              },
            ],
          },
        ]
        : [];
  },
};

module.exports = nextConfig;
