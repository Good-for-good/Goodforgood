/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add a rule to handle private class fields in dependencies
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  // Disable image optimization since we'll be using Firebase Storage
  images: {
    unoptimized: true,
    domains: ['localhost']
  },
}

module.exports = nextConfig 