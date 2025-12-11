// /app/api/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// R2 Client
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const orderRaw = form.get("data") as string;
    const orderData = JSON.parse(orderRaw);

    const files = form.getAll("images") as File[];

    let r2Urls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `order-${Date.now()}-${Math.random()}.jpg`;

      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filename,
        Body: buffer,
        ContentType: file.type
      }));

      r2Urls.push(`${process.env.R2_PUBLIC_URL}/${filename}`);
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([{ ...orderData, style_imgs: r2Urls }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unknown Error" },
      { status: 500 }
    );
  }
}
