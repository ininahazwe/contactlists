import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",

  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  },

  google: {
    clientId: required("GOOGLE_CLIENT_ID"),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    allowedWorkspaceDomain: process.env.ALLOWED_GOOGLE_WORKSPACE_DOMAIN ?? "",
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "",
    region: process.env.S3_REGION ?? "",
    bucket: process.env.S3_BUCKET ?? "contact-platform-documents",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },

  resendApiKey: process.env.RESEND_API_KEY ?? "",
} as const;
