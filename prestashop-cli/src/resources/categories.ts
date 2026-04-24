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

const COLS = ["id", "id_parent", "name", "active", "position"];

function collect(val: string, prev: string[]) { return [...prev, val]; }

export const categoriesResource = new Command("categories").description(
  "Manage product categories",
);

// LIST
categoriesResource
  .command("list")
  .description("List categories")
  .option("--limit <n>", "Results per page", "50")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--sort <field>", "Sort field, e.g. id_ASC or position_ASC", "id_ASC")
  .option("--filter <expr>", "Filter: field=value (repeatable)", collect, [] as string[])
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", `
Examples:
  prestashop-cli categories list
  prestashop-cli categories list --filter "active=1" --filter "id_parent=2"`)
  .action(async (opts) => {
    try {
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, sort: opts.sort, filter: opts.filter });
      const data = await client.get("/categories", params);
      const items = unwrapList(data, "categories");
      const rows = items.map((item) => {
        const n = normalizePsObject(item as Record<string, unknown>);
        return Object.fromEntries(COLS.filter((c) => c in n).map((c) => [c, n[c]]));
      });
      output(rows, { json: opts.json, format: opts.format, fields: opts.fields?.split(",") });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// GET
categoriesResource
  .command("get <id>")
  .description("Get a category by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/categories/${id}`);
      const cat = unwrapSingle(data, "category");
      output(normalizePsObject(cat), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// CREATE
categoriesResource
  .command("create")
  .description("Create a category")
  .option("--name <name>", "Category name (plain string, wrapped in lang 1)")
  .option("--parent <id>", "Parent category ID")
  .option("--active <0|1>", "Active (default 1)", "1")
  .option("--data <json>", "JSON object or file (overrides individual flags)")
  .option("--lang <id>", "Language ID for --name", "1")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli categories create --name "Summer Sale" --parent 2
  prestashop-cli categories create --data ./category.json`)
  .action(async (opts) => {
    try {
      let fields: Record<string, unknown>;
      if (opts.data) {
        fields = await parseDataArg(opts.data);
      } else {
        fields = { active: opts.active };
        if (opts.name) fields.name = [{ id: Number(opts.lang), value: opts.name }];
        if (opts.parent) fields.id_parent = opts.parent;
      }
      const xml = buildXml("category", fields as Record<string, never>);
      const result = await client.post("/categories", xml);
      const cat = unwrapSingle(result, "category");
      output(normalizePsObject(cat), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE
categoriesResource
  .command("update <id>")
  .description("Update a category (read-modify-write)")
  .option("--active <0|1>", "Enable or disable the category")
  .option("--data <json>", "JSON fields to merge, or path to JSON file")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli categories update 5 --active 0
  prestashop-cli categories update 5 --data '{"position":"3"}'`)
  .action(async (id, opts) => {
    try {
      const current = unwrapSingle(await client.get(`/categories/${id}`), "category");
      const base = prepareForPut(current);

      if (opts.active !== undefined) base.active = opts.active;

      if (opts.data) {
        const changes = await parseDataArg(opts.data);
        Object.assign(base, changes);
      }

      const xml = buildXml("category", base as Record<string, never>);
      const result = await client.put(`/categories/${id}`, xml);
      const updated = unwrapSingle(result, "category");
      output(normalizePsObject(updated), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// DELETE
categoriesResource
  .command("delete <id>")
  .description("Delete a category by ID")
  .option("--yes", "Skip confirmation")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      if (!opts.yes) {
        process.stdout.write(`Delete category #${id}? [y/N] `);
        const answer = await new Promise<string>((r) =>
          process.stdin.once("data", (d) => r(d.toString().trim())),
        );
        if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
      }
      await client.delete(`/categories/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SCHEMA
categoriesResource
  .command("schema")
  .description("Show the blank category schema")
  .option("--synopsis", "Show synopsis with field types")
  .action(async (opts) => {
    try {
      const xml = await client.getRaw("/categories", { schema: opts.synopsis ? "synopsis" : "blank" });
      console.log(xml);
    } catch (err) {
      handleError(err);
    }
  });
