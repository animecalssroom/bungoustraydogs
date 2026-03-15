/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase timeout for static page generation during `next build`
  staticPageGenerationTimeout: 120,
  images: {
    domains: [
      'your-project.supabase.co',
      'lh3.googleusercontent.com',
      'cdn.discordapp.com'
    ],
  },
  async redirects() {
    return [
      {
        source: '/lore',
        destination: '/records?tab=lore',
        permanent: true,
      },
      {
        source: '/lore/submit',
        destination: '/records/lore/submit',
        permanent: true,
      },
      {
        source: '/registry',
        destination: '/records?tab=field-notes',
        permanent: true,
      },
      {
        source: '/registry/submit',
        destination: '/records/field-notes/submit',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
