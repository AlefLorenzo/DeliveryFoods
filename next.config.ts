import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Forçar Prisma como pacote externo do servidor
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcrypt'],

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // BLOQUEAR COMPLETAMENTE módulos nativos no cliente
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /@prisma\/client|prisma|better-sqlite3|node-gyp-build|sqlite3|bcrypt/,
        })
      );

      // Fallback agressivo
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@prisma/client': false,
        'prisma': false,
        'better-sqlite3': false,
        'node-gyp-build': false,
        'sqlite3': false,
        'bcrypt': false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
