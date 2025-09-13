/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
export const headers = async () => [
  {
    source: '/(.*)',
    headers: [
      {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'self' https://app.clickup.com",
      },
      {
        key: 'X-Frame-Options',
        value: 'ALLOW-FROM https://app.clickup.com',
      },
    ],
  },
];