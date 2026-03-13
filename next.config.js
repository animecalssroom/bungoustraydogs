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
}

module.exports = nextConfig
