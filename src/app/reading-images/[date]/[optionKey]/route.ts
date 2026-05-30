import { notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getReading } from "@/lib/db";
import { imageMimeTypeFromFilename, readOptionImage } from "@/lib/option-images";
import { isOptionKey } from "@/lib/options";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string; optionKey: string }> }
) {
  const { date, optionKey } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isOptionKey(optionKey)) {
    notFound();
  }

  const reading = getReading(date);
  const option = reading?.options.find((item) => item.option_key === optionKey);

  if (!reading || !option?.image_filename) {
    notFound();
  }

  if (reading.status !== "published" && !(await isAdminAuthenticated())) {
    notFound();
  }

  const image = await readOptionImage(option.image_filename);
  if (!image) {
    notFound();
  }

  return new Response(new Uint8Array(image), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": option.image_mime_type || imageMimeTypeFromFilename(option.image_filename),
      "X-Content-Type-Options": "nosniff"
    }
  });
}
