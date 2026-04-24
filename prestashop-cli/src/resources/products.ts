import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import {
  buildXml,
  buildListParams,
  normalizePsObject,
  unwrapList,
  unwrapSingle,
  prepareForPut,
  parseDataArg,
} from "../lib/xml.js";

const COLS = ["id", "reference", "name", "price", "active", "quantity"];

function collect(val: string, prev: string[]) { return [...prev, val]; }

function normalizeList(items: unknown[]): Record<string, unknown>[] {
  return items.map((item) => {
    const n = normalizePsObject(item as Record<string, unknown>);
    return Object.fromEntries(COLS.filter((c) => c in n).map((c) => [c, n[c]]));
  });
}

export const productsResource = new Command("products").description(
  "Manage products (catalog)",
);

// LIST
productsResource
  .command("list")
  .description("List products")
  .option("--limit <n>", "Results per page", "25")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--sort <field>", "Sort field, e.g. id_DESC or price_ASC", "id_DESC")
  .option("--filter <expr>", "Filter: field=value (repeatable)", collect, [] as string[])
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", `
Examples:
  prestashop-cli products list
  prestashop-cli products list --limit 50 --offset 0
  prestashop-cli products list --filter "active=1" --filter "id_category_default=3"
  prestashop-cli products list --sort price_ASC --json`)
  .action(async (opts) => {
    try {
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, sort: opts.sort, filter: opts.filter });
      const data = await client.get("/products", params);
      const items = unwrapList(data, "products");
      const rows = normalizeList(items);
      output(rows, { json: opts.json, format: opts.format, fields: opts.fields?.split(",") });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// GET
productsResource
  .command("get <id>")
  .description("Get a product by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  prestashop-cli products get 1")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/products/${id}`);
      const product = unwrapSingle(data, "product");
      const normalized = normalizePsObject(product);
      output(normalized, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// CREATE
productsResource
  .command("create")
  .description("Create a product from a JSON file or inline JSON")
  .requiredOption("--data <json>", "JSON object or path to JSON file with product fields")
  .option("--lang <id>", "Language ID for string fields (auto-wrapped as multilingual)", "1")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli products create --data '{"name":[{"id":1,"value":"My Product"}],"price":"19.99","id_tax_rules_group":"1","id_category_default":"2"}'
  prestashop-cli products create --data ./new-product.json`)
  .action(async (opts) => {
    try {
      const fields = await parseDataArg(opts.data);
      const xml = buildXml("product", fields as Record<string, never>);
      const result = await client.post("/products", xml);
      const product = unwrapSingle(result, "product");
      output(normalizePsObject(product), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE
productsResource
  .command("update <id>")
  .description("Update a product (read-modify-write)")
  .option("--data <json>", "JSON fields to merge, or path to JSON file")
  .option("--active <0|1>", "Enable or disable the product")
  .option("--price <price>", "Update base price (excl. tax)")
  .option("--reference <ref>", "Update product reference")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli products update 42 --active 0
  prestashop-cli products update 42 --price 29.99
  prestashop-cli products update 42 --data '{"on_sale":"1"}'
  prestashop-cli products update 42 --data ./changes.json`)
  .action(async (id, opts) => {
    try {
      // Read current product
      const current = unwrapSingle(await client.get(`/products/${id}`), "product");
      const base = prepareForPut(current);

      // Apply flag-based changes
      if (opts.active !== undefined) base.active = opts.active;
      if (opts.price !== undefined) base.price = opts.price;
      if (opts.reference !== undefined) base.reference = opts.reference;

      // Apply --data changes (merge on top)
      if (opts.data) {
        const changes = await parseDataArg(opts.data);
        Object.assign(base, changes);
      }

      const xml = buildXml("product", base as Record<string, never>);
      const result = await client.put(`/products/${id}`, xml);
      const updated = unwrapSingle(result, "product");
      output(normalizePsObject(updated), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// DELETE
productsResource
  .command("delete <id>")
  .description("Delete a product by ID")
  .option("--yes", "Skip confirmation")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  prestashop-cli products delete 42 --yes")
  .action(async (id, opts) => {
    try {
      if (!opts.yes) {
        process.stdout.write(`Delete product #${id}? [y/N] `);
        const answer = await new Promise<string>((r) =>
          process.stdin.once("data", (d) => r(d.toString().trim())),
        );
        if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
      }
      await client.delete(`/products/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SCHEMA
productsResource
  .command("schema")
  .description("Show the blank product schema (all available fields)")
  .option("--synopsis", "Show synopsis with field types and validation rules")
  .addHelpText("after", "\nExamples:\n  prestashop-cli products schema\n  prestashop-cli products schema --synopsis > product-schema.xml")
  .action(async (opts) => {
    try {
      const schema = opts.synopsis ? "synopsis" : "blank";
      const xml = await client.getRaw("/products", { schema });
      console.log(xml);
    } catch (err) {
      handleError(err);
    }
  });

// SEARCH
productsResource
  .command("search <query>")
  .description("Search products by keyword")
  .option("--lang <id>", "Language ID for search", "1")
  .option("--limit <n>", "Max results", "25")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  prestashop-cli products search \"blue shirt\"")
  .action(async (query, opts) => {
    try {
      const data = await client.get("/search", {
        language: opts.lang,
        query,
        ressources: "products",
        limit: `0,${opts.limit}`,
        output_format: "JSON",
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
