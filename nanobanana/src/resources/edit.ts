import { Command } from "commander";
import { readFileSync, writeFileSync } from "fs";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { globalFlags } from "../lib/config.js";
import { MODELS, buildImageParts } from "./generate.js";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp", gif: "image/gif",
};

function toInlineData(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return {
    mime_type: MIME_TYPES[ext] ?? "image/png",
    data: readFileSync(path).toString("base64"),
  };
}

export const editCommand = new Command("edit")
  .description("Retouche une ou plusieurs images avec un prompt (max 14 images)")
  .argument("<prompt>", "Instruction de modification")
  .requiredOption("-i, --input <files...>", "Image(s) source (max 14, max 10 objets ou 4-6 personnages)")
  .option("-m, --model <model>", "Modèle : flash | flash2 | pro", "flash2")
  .option("-o, --output <file>", "Fichier de sortie", "output.png")
  .option("--thinking <level>", "Niveau de réflexion : minimal | high")
  .action(async (prompt: string, opts) => {
    try {
      const modelId = MODELS[opts.model];
      if (!modelId) {
        console.error(`Modèle inconnu: ${opts.model}. Disponibles: ${Object.keys(MODELS).join(", ")}`);
        process.exit(1);
      }

      const inputs: string[] = Array.isArray(opts.input) ? opts.input : [opts.input];
      if (inputs.length > 14) {
        console.error("Maximum 14 images de référence.");
        process.exit(1);
      }

      if (globalFlags.verbose) {
        console.error(`Modèle: ${modelId}`);
        inputs.forEach(f => console.error(`Image: ${f}`));
        console.error(`Prompt: ${prompt}`);
      }

      const parts: unknown[] = [{ text: prompt }];
      for (const file of inputs) {
        parts.push({ inline_data: toInlineData(file) });
      }

      const genConfig: Record<string, unknown> = { responseModalities: ["TEXT", "IMAGE"] };
      if (opts.thinking) {
        if (opts.model === "pro") {
          console.error(`⚠️  --thinking non supporté par le modèle pro, option ignorée.`);
        } else {
          genConfig.thinkingConfig = {
            thinkingLevel: opts.thinking,
            includeThoughts: globalFlags.verbose,
          };
        }
      }

      const body = {
        contents: [{ parts }],
        generationConfig: genConfig,
      };

      process.stderr.write(`Retouche en cours...`);
      const data = await client.post(`/models/${modelId}:generateContent`, body) as any;
      process.stderr.write(` OK\n`);

      const { imgPart, textPart, thoughtParts } = buildImageParts(data);

      if (!imgPart) {
        console.error("Aucune image retournée.");
        if (textPart) console.log(textPart.text);
        process.exit(1);
      }

      const imageBuffer = Buffer.from(imgPart.inlineData.data, "base64");
      writeFileSync(opts.output, imageBuffer);

      if (globalFlags.json) {
        console.log(JSON.stringify({
          file: opts.output, model: modelId,
          mimeType: imgPart.inlineData.mimeType,
          size: imageBuffer.length,
          text: textPart?.text ?? null,
          thoughts: thoughtParts.length,
        }));
      } else {
        console.log(`✓ Image retouchée : ${opts.output} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
        if (textPart?.text) console.log(textPart.text);
        if (globalFlags.verbose && thoughtParts.length) {
          console.log(`\n[Pensées intermédiaires: ${thoughtParts.length} étapes]`);
        }
      }
    } catch (err) {
      handleError(err, globalFlags.json);
    }
  });
