// app/api/orders/new/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(req: Request) {
  const form = await req.formData();
  const json = JSON.parse(form.get("data") as string);
  const imgs = form.getAll("images") as string[];

  const urls: string[] = [];

  for (const b64 of imgs) {
    const buffer = Buffer.from(b64.split(",")[1], "base64");
    const fileName = `order-${Date.now()}-${Math.random()}.jpg`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: "image/jpeg",
      })
    );

    urls.push(`${process.env.R2_PUBLIC_URL}/${fileName}`);
  }

  const { error } = await supabase
    .from("orders")
    .insert([{ ...json, style_imgs: urls }]);

  if (error) return NextResponse.json({ success: false, error: error.message });

  return NextResponse.json({ success: true });
}
