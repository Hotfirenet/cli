import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const ecommerceResource = new Command("ecommerce")
  .description("Manage ecommerce orders, products and categories");

// Orders
ecommerceResource
  .command("orders")
  .description("List ecommerce orders")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--sort <order>", "Sort: asc or desc", "desc")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/orders/status", { limit: opts.limit, offset: opts.offset, sort: opts.sort });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

ecommerceResource
  .command("order-get")
  .description("Get an order by ID")
  .argument("<id>", "Order ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/orders/status/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

ecommerceResource
  .command("order-create")
  .description("Create or update an order status")
  .requiredOption("--order-id <id>", "Order ID")
  .requiredOption("--status <status>", "Order status: pending, preparing, shipped, delivered, cancelled")
  .requiredOption("--email <email>", "Customer email")
  .option("--total <amount>", "Order total amount")
  .option("--date <date>", "Order date (ISO 8601)")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  brevo-cli ecommerce order-create --order-id 42 --status delivered --email customer@example.com")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        orders: [{
          id: opts.orderId,
          status: opts.status,
          email: opts.email,
          ...(opts.total && { amount: parseFloat(opts.total) }),
          ...(opts.date && { date: opts.date }),
        }]
      };
      const data = await client.post("/orders/status/batch", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

// Products
ecommerceResource
  .command("products")
  .description("List ecommerce products")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--sort <order>", "Sort: asc or desc", "desc")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/products", { limit: opts.limit, offset: opts.offset, sort: opts.sort });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

ecommerceResource
  .command("product-get")
  .description("Get a product by ID")
  .argument("<id>", "Product ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(`/products/${id}`);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

ecommerceResource
  .command("product-upsert")
  .description("Create or update a product")
  .requiredOption("--id <id>", "Product ID")
  .requiredOption("--name <name>", "Product name")
  .option("--price <price>", "Product price")
  .option("--url <url>", "Product URL")
  .option("--image-url <url>", "Product image URL")
  .option("--categories <cats>", "Comma-separated category IDs")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        products: [{
          id: opts.id,
          name: opts.name,
          ...(opts.price && { price: parseFloat(opts.price) }),
          ...(opts.url && { url: opts.url }),
          ...(opts.imageUrl && { imageUrl: opts.imageUrl }),
          ...(opts.categories && { categories: opts.categories.split(",") }),
        }]
      };
      const data = await client.post("/products/batch", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

// Categories
ecommerceResource
  .command("categories")
  .description("List ecommerce categories")
  .option("--limit <n>", "Max results", "50")
  .option("--offset <n>", "Offset", "0")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format")
  .action(async (opts) => {
    try {
      const data = await client.get("/categories", { limit: opts.limit, offset: opts.offset });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) { handleError(err, opts.json); }
  });

ecommerceResource
  .command("category-upsert")
  .description("Create or update a category")
  .requiredOption("--id <id>", "Category ID")
  .requiredOption("--name <name>", "Category name")
  .option("--url <url>", "Category URL")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        categories: [{
          id: opts.id,
          name: opts.name,
          ...(opts.url && { url: opts.url }),
        }]
      };
      const data = await client.post("/categories/batch", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });

// Events
ecommerceResource
  .command("track-event")
  .description("Track a custom ecommerce event")
  .requiredOption("--email <email>", "Contact email")
  .requiredOption("--event <name>", "Event name")
  .option("--properties <json>", "Event properties as JSON string")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const body: Record<string, unknown> = {
        email: opts.email,
        event: opts.event,
        ...(opts.properties && { properties: JSON.parse(opts.properties) }),
      };
      const data = await client.post("/trackEvent", body);
      output(data, { json: opts.json });
    } catch (err) { handleError(err, opts.json); }
  });
