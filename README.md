# cli

Personal API CLIs built with Bun + TypeScript + Commander.js.

| CLI | Description |
|-----|-------------|
| [brevo](./brevo) | Brevo API — contacts, campaigns, transactional, CRM, ecommerce |
| [n8n](./n8n) | n8n — workflows, executions, credentials, audit |

## Install a CLI

```bash
cd brevo && bun install
bun build src/index.ts --outfile dist/index.js --target bun
ln -sf $(pwd)/dist/index.js ~/.local/bin/brevo-cli
```

## Requirements

[Bun](https://bun.sh) ≥ 1.0
