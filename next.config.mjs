// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Remove this entirely or set to ALLOWALL (deprecated)
          },
        ],
      },
      {
        // Specifically allow embedding for the dashboard route
        source: '/dashboard',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://app.clickup.com https://*.clickup.com;",
          },
        ],
      },
    ];
  },
  
  // If you're using the app directory (Next.js 13+)
  experimental: {
    appDir: true,
  },
};

export default nextConfig;