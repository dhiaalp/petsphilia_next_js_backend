import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";
const adminUrl = process.env.MEDUSA_ADMIN_URL || "http://localhost:7001";
const railwayPublicUrl = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : "";
const databaseUrl = process.env.DATABASE_URL || "";
const redisUrl = process.env.REDIS_URL || "";

export default defineConfig({
  projectConfig: {
    databaseUrl,
    redisUrl,
    http: {
      storeCors: [storefrontUrl, railwayPublicUrl].filter(Boolean).join(","),
      adminCors: [storefrontUrl, adminUrl, railwayPublicUrl].filter(Boolean).join(","),
      authCors: [storefrontUrl, adminUrl, railwayPublicUrl].filter(Boolean).join(","),
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              upload_dir: "uploads",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
          },
        ],
      },
    },
  ],
});

