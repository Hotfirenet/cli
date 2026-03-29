# cli

A collection of CLI tools for APIs and services. Built with Bun + TypeScript. Works standalone or as lightweight tools for AI assistants — each CLI exposes focused actions without heavy MCP context overhead.

Each CLI follows the same structure: auth management, typed resources, global `--json` flag, and tokens stored locally in `~/.config/tokens/`.

## CLIs

| CLI | Description | Resources |
|-----|-------------|-----------|
| [brevo](./brevo) | CLI for the brevo API | account, attributes, campaigns, contacts, crm-companies, crm-deals, crm-notes, crm-tasks, ecommerce, events, folders, lists, segments, senders, sms-campaigns, templates, transactional, webhooks, whatsapp-campaigns |
| [ha](./ha) | CLI for the ha API | config, events, history, instances, services, states, template |
| [n8n](./n8n) | CLI for the n8n API | audit, credentials, executions, projects, tags, users, variables, workflows |
| [nanobanana](./nanobanana) | CLI for the nanobanana API | edit, generate |

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
