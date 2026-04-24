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

const COLS = ["id", "id_customer", "id_country", "alias", "firstname", "lastname", "address1", "city", "postcode"];

function collect(val: string, prev: string[]) { return [...prev, val]; }

export const addressesResource = new Command("addresses").description(
  "Manage addresses (customers, orders)",
);

// LIST
addressesResource
  .command("list")
  .description("List addresses")
  .option("--limit <n>", "Results per page", "25")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--sort <field>", "Sort field", "id_DESC")
  .option("--filter <expr>", "Filter: field=value (repeatable)", collect, [] as string[])
  .option("--customer <id>", "Filter by customer ID (shorthand for --filter id_customer=<id>)")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", `
Examples:
  prestashop-cli addresses list --customer 42
  prestashop-cli addresses list --filter "id_country=8"`)
  .action(async (opts) => {
    try {
      const filters = [...(opts.filter as string[])];
      if (opts.customer) filters.push(`id_customer=${opts.customer}`);
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, sort: opts.sort, filter: filters });
      const data = await client.get("/addresses", params);
      const items = unwrapList(data, "addresses");
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
addressesResource
  .command("get <id>")
  .description("Get an address by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/addresses/${id}`);
      const addr = unwrapSingle(data, "address");
      output(normalizePsObject(addr), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// CREATE
addressesResource
  .command("create")
  .description("Create an address")
  .requiredOption("--data <json>", "JSON object or path to JSON file")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Example:
  prestashop-cli addresses schema > address.json
  # Fill in the fields, then:
  prestashop-cli addresses create --data address.json`)
  .action(async (opts) => {
    try {
      const fields = await parseDataArg(opts.data);
      const xml = buildXml("address", fields as Record<string, never>);
      const result = await client.post("/addresses", xml);
      const addr = unwrapSingle(result, "address");
      output(normalizePsObject(addr), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE
addressesResource
  .command("update <id>")
  .description("Update an address (read-modify-write)")
  .requiredOption("--data <json>", "JSON fields to merge, or path to JSON file")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const current = unwrapSingle(await client.get(`/addresses/${id}`), "address");
      const base = prepareForPut(current);
      const changes = await parseDataArg(opts.data);
      Object.assign(base, changes);
      const xml = buildXml("address", base as Record<string, never>);
      const result = await client.put(`/addresses/${id}`, xml);
      const updated = unwrapSingle(result, "address");
      output(normalizePsObject(updated), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// DELETE
addressesResource
  .command("delete <id>")
  .description("Delete an address by ID")
  .option("--yes", "Skip confirmation")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      if (!opts.yes) {
        process.stdout.write(`Delete address #${id}? [y/N] `);
        const answer = await new Promise<string>((r) =>
          process.stdin.once("data", (d) => r(d.toString().trim())),
        );
        if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
      }
      await client.delete(`/addresses/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SCHEMA
addressesResource
  .command("schema")
  .description("Show the blank address schema")
  .option("--synopsis", "Show synopsis with field types")
  .action(async (opts) => {
    try {
      const xml = await client.getRaw("/addresses", { schema: opts.synopsis ? "synopsis" : "blank" });
      console.log(xml);
    } catch (err) {
      handleError(err);
    }
  });
