#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { profileCommand } from "./commands/profile.js";
import { productsResource } from "./resources/products.js";
import { ordersResource } from "./resources/orders.js";
import { customersResource } from "./resources/customers.js";
import { categoriesResource } from "./resources/categories.js";
import { combinationsResource } from "./resources/combinations.js";
import { stockResource } from "./resources/stock.js";
import { carriersResource } from "./resources/carriers.js";
import { addressesResource } from "./resources/addresses.js";
import { orderStatesResource } from "./resources/order-states.js";
import { languagesResource } from "./resources/languages.js";
import { currenciesResource } from "./resources/currencies.js";

const program = new Command();

program
  .name("prestashop-cli")
  .description(
    "CLI for the PrestaShop WebService API — products, orders, customers, stock & more (PS 1.7–9)",
  )
  .version("0.1.0")
  .option("--profile <name>", "Use a specific profile (overrides default)")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
    globalFlags.profile = root.profile ?? null;
  });

// Built-in commands
program.addCommand(authCommand);
program.addCommand(profileCommand);

// Resources
program.addCommand(productsResource);
program.addCommand(ordersResource);
program.addCommand(customersResource);
program.addCommand(categoriesResource);
program.addCommand(combinationsResource);
program.addCommand(stockResource);
program.addCommand(carriersResource);
program.addCommand(addressesResource);
program.addCommand(orderStatesResource);
program.addCommand(languagesResource);
program.addCommand(currenciesResource);

program.parse();
