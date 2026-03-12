/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'production' ? '.next-build' : '.next',
  images: {
    domains: [
      'your-project.supabase.co',
      'lh3.googleusercontent.com',
      'cdn.discordapp.com'
    ],
  },
}

module.exports = nextConfig
