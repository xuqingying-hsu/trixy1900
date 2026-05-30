import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, normalize } from "node:path";
import { type OptionKey } from "@/lib/options";

const maxImageSize = 5 * 1024 * 1024;
const uploadSubdir = join("uploads", "reading-options");

const mimeToExtension = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export type SavedOptionImage = {
  filename: string;
  mimeType: string;
};

function dataRoot() {
  if (process.env.LENORMAND_UPLOAD_DIR) {
    return process.env.LENORMAND_UPLOAD_DIR;
  }

  const dbPath = process.env.LENORMAND_DB_PATH;
  if (dbPath) {
    return isAbsolute(dbPath)
      ? dirname(dbPath)
      : join(/*turbopackIgnore: true*/ process.cwd(), dirname(dbPath));
  }

  return join(/*turbopackIgnore: true*/ process.cwd(), "data");
}

export function optionImagesDir() {
  return join(dataRoot(), uploadSubdir);
}

function isSafeFilename(filename: string) {
  return filename.length > 0 && basename(filename) === filename && !filename.includes("..");
}

export function optionImagePath(filename: string) {
  if (!isSafeFilename(filename)) {
    return null;
  }

  const directory = optionImagesDir();
  const fullPath = normalize(join(directory, filename));
  return fullPath.startsWith(normalize(directory)) ? fullPath : null;
}

function hasValidSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export function hasUploadedImage(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function saveOptionImage(params: {
  file: File;
  date: string;
  optionKey: OptionKey;
  oldFilename?: string | null;
}): Promise<SavedOptionImage> {
  const mimeType = params.file.type;
  const extension = mimeToExtension.get(mimeType);

  if (!extension) {
    throw new Error("指示物图片仅支持 JPG、PNG 或 WEBP。");
  }
  if (params.file.size > maxImageSize) {
    throw new Error("指示物图片不能超过 5MB。");
  }

  const buffer = Buffer.from(await params.file.arrayBuffer());
  if (!hasValidSignature(buffer, mimeType)) {
    throw new Error("上传文件内容不是有效图片。");
  }

  const safeDate = params.date.replace(/[^0-9-]/g, "");
  const filename = `${safeDate}-${params.optionKey}-${randomBytes(8).toString("hex")}.${extension}`;
  const directory = optionImagesDir();
  mkdirSync(directory, { recursive: true });
  await writeFile(join(directory, filename), buffer, { flag: "wx" });

  if (params.oldFilename) {
    await deleteOptionImage(params.oldFilename);
  }

  return { filename, mimeType };
}

export async function readOptionImage(filename: string) {
  const filePath = optionImagePath(filename);
  if (!filePath || !existsSync(filePath)) {
    return null;
  }
  return readFile(filePath);
}

export async function deleteOptionImage(filename: string | null | undefined) {
  if (!filename) {
    return;
  }

  const filePath = optionImagePath(filename);
  if (!filePath) {
    return;
  }

  try {
    await unlink(filePath);
  } catch {
    // Best-effort cleanup; stale DB rows should not block editing or publishing.
  }
}

export function imageMimeTypeFromFilename(filename: string) {
  const extension = extname(filename).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".webp") {
    return "image/webp";
  }
  return "application/octet-stream";
}
