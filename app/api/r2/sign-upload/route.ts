export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: Request) {
  console.log("① HIT sign-upload");

  const body = await req.json();
  console.log("② body =", body);

  const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT_URL!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  console.log("③ R2 client created");

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: `test-${Date.now()}.png`,
    ContentType: "image/png",
  });

  console.log("④ command created");

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 });

  console.log("⑤ signed url generated");

  return NextResponse.json({ uploadUrl });
}
