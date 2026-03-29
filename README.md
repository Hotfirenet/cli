# cli

A collection of personal CLI tools for interacting with various APIs, built with Bun + TypeScript + Commander.js.

Each CLI follows the same structure: auth management, typed resources, global `--json` flag, and tokens stored locally in `~/.config/tokens/`.

## CLIs

| CLI | API | Resources |
|-----|-----|-----------|
| [brevo](./brevo) | Brevo | Contacts, lists, campaigns, transactional, SMS, templates, CRM, ecommerce, webhooks |
| [n8n](./n8n) | n8n | Workflows, executions, credentials, tags, variables, users, projects, audit |
| [ha](./ha) | Home Assistant | States, services, events, history, logbook, templates, config — multi-instance |
| [nanobanana](./nanobanana) | Nanobanana | Generate, edit |

## Usage

Each CLI stores its token in `~/.config/tokens/<name>-cli` (mode 600).

```bash
# Authenticate
brevo-cli auth set <api-key>
n8n-cli auth set <api-key>
ha-cli instances add home --url http://homeassistant.local:8123 --token <token>

# Example commands
brevo-cli contacts list
n8n-cli workflows list --active
ha-cli states filter light
ha-cli services call light turn_on --entity light.salon
```

## Build & link

```bash
cd <name>
bun install
bun build src/index.ts --outfile dist/index.js --target bun
ln -sf $(pwd)/dist/index.js ~/.local/bin/<name>-cli
```

## Requirements

[Bun](https://bun.sh) ≥ 1.0
