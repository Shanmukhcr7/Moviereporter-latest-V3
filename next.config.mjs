import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  publicExcludes: ['!uploads/**/*'], // Exclude dynamic uploads from precache
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'movielovers.in',
      },
      {
        protocol: 'https',
        hostname: 'www.moviereporter.in',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'pub-560b5c22eff64d55959e15f4b0c22877.r2.dev',
      },
    ],
  },
}

export default withPWA(nextConfig)
