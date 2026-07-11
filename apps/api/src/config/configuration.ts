export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '8000', 10),
    version: '1.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  swagger: {
    title: 'Rest API Docs',
    description:
      'This provides comprehensive documentation for all rest API endpoints',
    path: 'api-docs',
    theme: 'dark',
  },
});
