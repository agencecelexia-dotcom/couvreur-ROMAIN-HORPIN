/**
 * sync-client.ts — Template Couvreur
 * Lit CLIENT.md et genere src/config/client.config.ts + met a jour globals.css
 * Usage: npm run sync-client
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const CLIENT_MD = path.join(ROOT, "CLIENT.md");
const CLIENT_CONFIG_TS = path.join(ROOT, "src", "config", "client.config.ts");
const GLOBALS_CSS = path.join(ROOT, "src", "app", "globals.css");

function parseClientMd(content: string): Record<string, string> {
  const config: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.trim().match(/^([A-Z][A-Z0-9_]+):\s*"(.*)"$/);
    if (match) {
      config[match[1]] = match[2];
    }
  }
  return config;
}

function generateClientConfig(config: Record<string, string>): string {
  const entries = Object.entries(config)
    .map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`)
    .join("\n");

  return `// AUTO-GENERATED — NE PAS MODIFIER MANUELLEMENT
// Genere par scripts/sync-client.ts depuis CLIENT.md
// Pour modifier: editer CLIENT.md puis lancer npm run sync-client

export const clientConfig = {
${entries}
} as const;

export type ClientConfigKey = keyof typeof clientConfig;
`;
}

function updateGlobalsCss(css: string, config: Record<string, string>): string {
  let updated = css;

  if (config.COULEUR_PRIMAIRE_900) {
    updated = updated.replace(
      /--color-primary-900:\s*oklch\([^)]+\);/,
      `--color-primary-900: ${config.COULEUR_PRIMAIRE_900};`
    );
  }
  if (config.COULEUR_ACCENT_500) {
    updated = updated.replace(
      /--color-accent-500:\s*oklch\([^)]+\);/,
      `--color-accent-500: ${config.COULEUR_ACCENT_500};`
    );
  }
  if (config.COULEUR_FOND_50) {
    updated = updated.replace(
      /--color-neutral-50:\s*oklch\([^)]+\);/,
      `--color-neutral-50: ${config.COULEUR_FOND_50};`
    );
  }

  if (config.FONT_TITRES) {
    updated = updated.replace(
      /--font-heading:\s*"[^"]+",/,
      `--font-heading: "${config.FONT_TITRES}",`
    );
  }
  if (config.FONT_CORPS) {
    updated = updated.replace(
      /--font-body:\s*"[^"]+",/,
      `--font-body: "${config.FONT_CORPS}",`
    );
  }

  return updated;
}

function main() {
  console.log("sync-client — Template Couvreur\n");

  if (!fs.existsSync(CLIENT_MD)) {
    console.error("CLIENT.md introuvable a la racine du projet");
    process.exit(1);
  }
  const clientMdContent = fs.readFileSync(CLIENT_MD, "utf-8");
  const config = parseClientMd(clientMdContent);
  console.log(`CLIENT.md lu — ${Object.keys(config).length} variables trouvees`);

  const configDir = path.dirname(CLIENT_CONFIG_TS);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configContent = generateClientConfig(config);
  fs.writeFileSync(CLIENT_CONFIG_TS, configContent, "utf-8");
  console.log("src/config/client.config.ts genere");

  if (fs.existsSync(GLOBALS_CSS)) {
    const cssContent = fs.readFileSync(GLOBALS_CSS, "utf-8");
    const updatedCss = updateGlobalsCss(cssContent, config);
    if (updatedCss !== cssContent) {
      fs.writeFileSync(GLOBALS_CSS, updatedCss, "utf-8");
      console.log("src/app/globals.css mis a jour (couleurs/fonts)");
    } else {
      console.log("src/app/globals.css — aucun changement de couleur/font");
    }
  }

  console.log("\nSynchronisation terminee !");
  console.log("   Lancez npm run dev pour voir les changements\n");
  console.log("Variables synchronisees :");
  for (const [key, value] of Object.entries(config)) {
    const display = value.length > 50 ? value.slice(0, 47) + "..." : value;
    console.log(`   ${key}: "${display}"`);
  }
}

main();
