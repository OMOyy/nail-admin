// lib/r2Client.ts
import { S3Client } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,               // ❗ 你的 R2 Public Bucket Endpoint
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,    // ❗ Access Key
    secretAccessKey: process.env.R2_SECRET_KEY!,   // ❗ Secret Key
  },
});
