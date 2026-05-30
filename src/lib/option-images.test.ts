import { mkdtempSync, rmSync } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteOptionImage, optionImagePath, saveOptionImage } from "@/lib/option-images";

let dir = "";

const pngBytes = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d
]);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "lenormand-images-"));
  process.env.LENORMAND_UPLOAD_DIR = dir;
});

afterEach(() => {
  delete process.env.LENORMAND_UPLOAD_DIR;
  rmSync(dir, { recursive: true, force: true });
});

describe("option image storage", () => {
  it("stores validated option images outside the public directory", async () => {
    const file = new File([pngBytes], "oracle.png", { type: "image/png" });
    const saved = await saveOptionImage({ file, date: "2026-05-31", optionKey: "D" });
    const path = optionImagePath(saved.filename);

    expect(saved.mimeType).toBe("image/png");
    expect(saved.filename).toMatch(/^2026-05-31-D-[a-f0-9]+\.png$/);
    expect(path).toContain(join("uploads", "reading-options"));
    await expect(readFile(path || "")).resolves.toBeInstanceOf(Buffer);
  });

  it("rejects files whose content does not match the image type", async () => {
    const file = new File(["not an image"], "fake.png", { type: "image/png" });

    await expect(saveOptionImage({ file, date: "2026-05-31", optionKey: "A" })).rejects.toThrow(
      /有效图片/
    );
  });

  it("cleans up uploaded files without failing on missing files", async () => {
    const file = new File([pngBytes], "oracle.png", { type: "image/png" });
    const saved = await saveOptionImage({ file, date: "2026-05-31", optionKey: "A" });
    const path = optionImagePath(saved.filename);

    await deleteOptionImage(saved.filename);

    await expect(access(path || "")).rejects.toThrow();
    await expect(deleteOptionImage(saved.filename)).resolves.toBeUndefined();
  });
});
