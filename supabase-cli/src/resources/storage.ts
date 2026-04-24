import { Command } from "commander";
import { writeFileSync } from "fs";
import { basename } from "path";
import { client } from "../lib/client.js";
import { output, handleError } from "../lib/output.js";

export const storageResource = new Command("storage")
  .description("Manage Supabase Storage buckets and files")
  .addHelpText("after", `
Examples:
  supabase-cli storage buckets list
  supabase-cli storage buckets create avatars --public
  supabase-cli storage buckets delete avatars
  supabase-cli storage files list avatars
  supabase-cli storage files list avatars --prefix users/
  supabase-cli storage files download avatars users/photo.jpg
  supabase-cli storage files delete avatars users/photo.jpg
`);

// ─── Buckets ──────────────────────────────────────────────────────────────────

const bucketsCmd = new Command("buckets").description("Manage buckets");

bucketsCmd
  .command("list")
  .description("List all buckets")
  .action(async () => {
    try {
      const data = await client.get("/storage/v1/bucket");
      output(data, { label: "buckets" });
    } catch (e) { handleError(e); }
  });

bucketsCmd
  .command("create <name>")
  .description("Create a bucket")
  .option("--public", "Make bucket publicly accessible", false)
  .option("--file-size-limit <bytes>", "Max file size in bytes")
  .action(async (name, opts) => {
    try {
      const body: Record<string, unknown> = { id: name, name, public: opts.public };
      if (opts.fileSizeLimit) body.file_size_limit = parseInt(opts.fileSizeLimit);
      const data = await client.post("/storage/v1/bucket", body);
      output(data, { label: "bucket" });
    } catch (e) { handleError(e); }
  });

bucketsCmd
  .command("get <name>")
  .description("Get bucket details")
  .action(async (name) => {
    try {
      const data = await client.get(`/storage/v1/bucket/${name}`);
      output(data, { label: "bucket" });
    } catch (e) { handleError(e); }
  });

bucketsCmd
  .command("delete <name>")
  .description("Delete a bucket (must be empty)")
  .action(async (name) => {
    try {
      await client.delete(`/storage/v1/bucket/${name}`);
      console.log(`Bucket "${name}" deleted.`);
    } catch (e) { handleError(e); }
  });

// ─── Files ────────────────────────────────────────────────────────────────────

const filesCmd = new Command("files").description("Manage files within buckets");

filesCmd
  .command("list <bucket>")
  .description("List files in a bucket")
  .option("--prefix <path>", "Folder prefix", "")
  .option("--limit <n>", "Max files", "100")
  .option("--offset <n>", "Skip files", "0")
  .action(async (bucket, opts) => {
    try {
      const body = { prefix: opts.prefix, limit: parseInt(opts.limit), offset: parseInt(opts.offset) };
      const data = await client.post(`/storage/v1/object/list/${bucket}`, body);
      output(data, { label: "files" });
    } catch (e) { handleError(e); }
  });

filesCmd
  .command("download <bucket> <path>")
  .description("Download a file to disk")
  .option("--out <filename>", "Output filename (default: basename of path)")
  .action(async (bucket, filePath, opts) => {
    try {
      const res = await fetch(
        `${(await import("../lib/config.js")).getBaseUrl()}/storage/v1/object/${bucket}/${filePath}`,
        { headers: { apikey: (await import("../lib/config.js")).getToken()!, Authorization: `Bearer ${(await import("../lib/config.js")).getToken()!}` } }
      );
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const outFile = opts.out ?? basename(filePath);
      writeFileSync(outFile, buf);
      console.log(`Downloaded ${filePath} → ${outFile} (${buf.length} bytes)`);
    } catch (e) { handleError(e); }
  });

filesCmd
  .command("delete <bucket> <path>")
  .description("Delete a file")
  .action(async (bucket, filePath) => {
    try {
      await client.delete(`/storage/v1/object/${bucket}/${filePath}`);
      console.log(`Deleted ${bucket}/${filePath}`);
    } catch (e) { handleError(e); }
  });

storageResource.addCommand(bucketsCmd);
storageResource.addCommand(filesCmd);
