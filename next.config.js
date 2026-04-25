/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actions support (if you use them in owner panel)
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },

  // Reduce cold-start size — tree-shake unused icons etc.
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },

  images: {
    // Only allow trusted image sources
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // Reduce image optimization CPU on free tier
    minimumCacheTTL: 86400,
  },

  // Prevent repeated RSC payload fetches for stable pages
  staticPageGenerationTimeout: 60,

  async headers() {
    return [
      {
        // Archive entries are stable — cache aggressively at CDN
        source: '/archive/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // Faction hub pages must not be cached (contains private data)
        source: '/faction/:factionId',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        // Owner and admin pages — never cache
        source: '/owner/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ]
  },

  // Avoid Webpack bundle bloat that slows cold starts
  webpack(config) {
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      maxSize: 250_000,
    }
    return config
  },
}

module.exports = nextConfig
