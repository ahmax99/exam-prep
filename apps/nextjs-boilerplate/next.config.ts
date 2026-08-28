import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty'],
  cacheComponents: true,
  reactStrictMode: true,
  reactCompiler: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'microphone=(), camera=(), geolocation=()'
        }
      ]
    }
  ],
  compiler: {
    ...(process.env.NODE_ENV === 'production' && {
      removeConsole: {
        exclude: ['error', 'warn']
      }
    })
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            memo: true
          }
        }
      ]
    })
    return config
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**'
      },
      {
        hostname: 'images.unsplash.com',
        protocol: 'https',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com'
      }
    ]
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  }
}

export default nextConfig
