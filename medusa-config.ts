import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";
const adminUrl = process.env.MEDUSA_ADMIN_URL || "http://localhost:7001";
const railwayPublicUrl = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : "";
const databaseUrl = process.env.DATABASE_URL || "";
const redisUrl = process.env.REDIS_URL || "";
const s3Bucket = process.env.S3_BUCKET_NAME || "";
const s3Region = process.env.AWS_REGION || "";
const s3Endpoint = process.env.S3_ENDPOINT || "";
const stripeApiKey = process.env.STRIPE_API_KEY || "";
const fileProxyUrl =
  process.env.FILE_PROXY_URL || `${storefrontUrl.replace(/\/$/, "")}/api/files`;
const hasS3Config =
  Boolean(s3Bucket) &&
  Boolean(s3Region) &&
  Boolean(process.env.AWS_ACCESS_KEY_ID) &&
  Boolean(process.env.AWS_SECRET_ACCESS_KEY);

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
          hasS3Config
            ? {
                resolve: "@medusajs/file-s3",
                id: "s3",
                options: {
                  file_url: process.env.FILE_PROXY_URL || fileProxyUrl.replace(/\/$/, ""),
                  bucket: s3Bucket,
                  region: s3Region,
                  access_key_id: process.env.AWS_ACCESS_KEY_ID,
                  secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
                  prefix: "uploads/",
                  ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
                  additional_client_config: {
                    forcePathStyle: false,
                  },
                },
              }
            : {
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
    ...(stripeApiKey
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: stripeApiKey,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
});
