import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";

export const templateResource = new Command("template").description("Render Jinja2 templates");

templateResource
  .command("render <template>")
  .description("Render a Jinja2 template (e.g. \"{{ states('sun.sun') }}\")")
  .action(async (template) => {
    try {
      const data = await client.post("/template", { template }) as string;
      console.log(data);
    } catch (err) { handleError(err); }
  });
