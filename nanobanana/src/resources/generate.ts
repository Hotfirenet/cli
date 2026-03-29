import { Command } from "commander";
import { writeFileSync } from "fs";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { globalFlags } from "../lib/config.js";

export const MODELS: Record<string, string> = {
  flash:  "gemini-2.5-flash-image",        // Nano Banana — rapidité, faible latence
  flash2: "gemini-3.1-flash-image-preview", // Nano Banana 2 — haute efficacité
  pro:    "gemini-3-pro-image-preview",     // Nano Banana Pro — assets professionnels
};

// Tailles supportées par modèle
const FLASH_SIZES = ["512", "1K", "2K", "4K"];
const OTHER_SIZES = ["1K", "2K", "4K"];

const ASPECT_RATIOS = ["1:1","1:4","1:8","2:3","3:2","3:4","4:1","4:3","4:5","5:4","8:1","9:16","16:9","21:9"];

export function buildImageParts(data: any): { imgPart: any; textPart: any; thoughtParts: any[] } {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return {
    imgPart:      parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/")),
    textPart:     parts.find((p: any) => p.text && !p.thought),
    thoughtParts: parts.filter((p: any) => p.thought),
  };
}

export const generateCommand = new Command("generate")
  .alias("gen")
  .description("Génère une image depuis un prompt texte (Nano Banana)")
  .argument("<prompt>", "Prompt de génération — décrire la scène en détail, pas de mots-clés")
  .option("-m, --model <model>", "Modèle : flash | flash2 | pro", "flash")
  .option("-s, --size <size>", "Taille : 512 (flash only) | 1K | 2K | 4K", "1K")
  .option("-r, --ratio <ratio>", `Ratio : ${ASPECT_RATIOS.join(" | ")}`, "1:1")
  .option("-o, --output <file>", "Fichier de sortie", "output.png")
  .option("--thinking <level>", "Niveau de réflexion : minimal | high")
  .option("--search", "Active Google Search grounding (données temps réel)")
  .option("--image-search", "Active Image Search grounding (flash2 uniquement)")
  .action(async (prompt: string, opts) => {
    try {
      const modelId = MODELS[opts.model];
      if (!modelId) {
        console.error(`Modèle inconnu: ${opts.model}. Disponibles: ${Object.keys(MODELS).join(", ")}`);
        process.exit(1);
      }

      // Validation taille selon modèle
      const validSizes = opts.model === "flash" ? FLASH_SIZES : OTHER_SIZES;
      if (!validSizes.includes(opts.size)) {
        console.error(`Taille "${opts.size}" invalide pour le modèle ${opts.model}. Valides: ${validSizes.join(", ")}`);
        process.exit(1);
      }

      // Validation ratio
      if (!ASPECT_RATIOS.includes(opts.ratio)) {
        console.error(`Ratio "${opts.ratio}" invalide. Valides: ${ASPECT_RATIOS.join(", ")}`);
        process.exit(1);
      }

      if (globalFlags.verbose) {
        console.error(`Modèle: ${modelId}`);
        console.error(`Taille: ${opts.size}, Ratio: ${opts.ratio}`);
        console.error(`Prompt: ${prompt}`);
      }

      const genConfig: Record<string, unknown> = {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: opts.ratio, imageSize: opts.size },
      };

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

      const body: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: genConfig,
      };

      if (opts.search || opts.imageSearch) {
        const searchTypes: string[] = [];
        if (opts.search) searchTypes.push("webSearch");
        if (opts.imageSearch) searchTypes.push("imageSearch");
        body.tools = [{ googleSearch: { searchTypes } }];
      }

      process.stderr.write(`Génération en cours...`);
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
        console.log(`✓ Image sauvegardée : ${opts.output} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
        if (textPart?.text) console.log(textPart.text);
        if (globalFlags.verbose && thoughtParts.length) {
          console.log(`\n[Pensées intermédiaires: ${thoughtParts.length} étapes]`);
        }
      }

      // Grounding metadata
      const grounding = data?.candidates?.[0]?.groundingMetadata;
      if (grounding?.groundingChunks?.length && !globalFlags.json) {
        console.log(`\nSources (${grounding.groundingChunks.length}):`);
        grounding.groundingChunks.slice(0, 3).forEach((c: any) => {
          if (c.web) console.log(`  - ${c.web.title}: ${c.web.uri}`);
        });
      }
    } catch (err) {
      handleError(err, globalFlags.json);
    }
  });
