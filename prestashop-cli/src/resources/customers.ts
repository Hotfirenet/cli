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

const COLS = ["id", "firstname", "lastname", "email", "active", "newsletter", "date_add"];

function collect(val: string, prev: string[]) { return [...prev, val]; }

export const customersResource = new Command("customers").description(
  "Manage customers",
);

// LIST
customersResource
  .command("list")
  .description("List customers")
  .option("--limit <n>", "Results per page", "25")
  .option("--offset <n>", "Pagination offset", "0")
  .option("--sort <field>", "Sort field, e.g. id_DESC or lastname_ASC", "id_DESC")
  .option("--filter <expr>", "Filter: field=value (repeatable)", collect, [] as string[])
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", `
Examples:
  prestashop-cli customers list
  prestashop-cli customers list --filter "active=1" --limit 50
  prestashop-cli customers list --filter "email%=@gmail.com" --json`)
  .action(async (opts) => {
    try {
      const params = buildListParams({ limit: opts.limit, offset: opts.offset, sort: opts.sort, filter: opts.filter, date: true });
      const data = await client.get("/customers", params);
      const items = unwrapList(data, "customers");
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
customersResource
  .command("get <id>")
  .description("Get a customer by ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/customers/${id}`);
      const customer = unwrapSingle(data, "customer");
      output(normalizePsObject(customer), { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// CREATE
customersResource
  .command("create")
  .description("Create a customer")
  .option("--firstname <name>", "First name")
  .option("--lastname <name>", "Last name")
  .option("--email <email>", "Email address")
  .option("--passwd <pass>", "Password (MD5 or plain — PS hashes it)")
  .option("--id-gender <id>", "Gender ID (1=Male, 2=Female)")
  .option("--data <json>", "JSON object or file with all fields (overrides individual flags)")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli customers create --firstname John --lastname Doe --email john@example.com --passwd secret
  prestashop-cli customers create --data ./customer.json`)
  .action(async (opts) => {
    try {
      let fields: Record<string, unknown>;
      if (opts.data) {
        fields = await parseDataArg(opts.data);
      } else {
        fields = {};
        if (opts.firstname) fields.firstname = opts.firstname;
        if (opts.lastname) fields.lastname = opts.lastname;
        if (opts.email) fields.email = opts.email;
        if (opts.passwd) fields.passwd = opts.passwd;
        if (opts.idGender) fields.id_gender = opts.idGender;
      }
      const xml = buildXml("customer", fields as Record<string, never>);
      const result = await client.post("/customers", xml);
      const customer = unwrapSingle(result, "customer");
      output(normalizePsObject(customer), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// UPDATE
customersResource
  .command("update <id>")
  .description("Update a customer (read-modify-write)")
  .option("--active <0|1>", "Enable or disable the account")
  .option("--newsletter <0|1>", "Subscribe/unsubscribe to newsletter")
  .option("--data <json>", "JSON fields to merge, or path to JSON file")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  prestashop-cli customers update 10 --active 0
  prestashop-cli customers update 10 --newsletter 1
  prestashop-cli customers update 10 --data '{"firstname":"Jane"}'`)
  .action(async (id, opts) => {
    try {
      const current = unwrapSingle(await client.get(`/customers/${id}`), "customer");
      const base = prepareForPut(current);

      if (opts.active !== undefined) base.active = opts.active;
      if (opts.newsletter !== undefined) base.newsletter = opts.newsletter;

      if (opts.data) {
        const changes = await parseDataArg(opts.data);
        Object.assign(base, changes);
      }

      const xml = buildXml("customer", base as Record<string, never>);
      const result = await client.put(`/customers/${id}`, xml);
      const updated = unwrapSingle(result, "customer");
      output(normalizePsObject(updated), { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// DELETE
customersResource
  .command("delete <id>")
  .description("Delete a customer by ID")
  .option("--yes", "Skip confirmation")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      if (!opts.yes) {
        process.stdout.write(`Delete customer #${id}? [y/N] `);
        const answer = await new Promise<string>((r) =>
          process.stdin.once("data", (d) => r(d.toString().trim())),
        );
        if (!["y", "yes"].includes(answer.toLowerCase())) { console.log("Aborted."); return; }
      }
      await client.delete(`/customers/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// SCHEMA
customersResource
  .command("schema")
  .description("Show the blank customer schema")
  .option("--synopsis", "Show synopsis with field types")
  .action(async (opts) => {
    try {
      const xml = await client.getRaw("/customers", { schema: opts.synopsis ? "synopsis" : "blank" });
      console.log(xml);
    } catch (err) {
      handleError(err);
    }
  });
