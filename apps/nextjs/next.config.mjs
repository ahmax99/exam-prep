/** @type {import('next').NextConfig} */
const nextConfig = {
  // Amplify's SSR compute doesn't forward app-level env vars to the deployed
  // function's runtime, only to the build — never add DATABASE_URL here.
  env: {
    AWS_REGION: process.env.AWS_REGION,
    BASE_URL: process.env.BASE_URL,
    DATABASE_URL_SECRET_NAME: process.env.DATABASE_URL_SECRET_NAME,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
  reactStrictMode: true,
  experimental: {
    reactCompiler: true
  },
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
