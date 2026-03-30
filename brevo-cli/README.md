# brevo-cli

CLI for the brevo API. Made with [api2cli.dev](https://api2cli.dev).

## Install

```bash
npx api2cli install <user>/brevo-cli
```

This clones the repo, builds the CLI, links it to your PATH, and installs the AgentSkill to your coding agents.

## Install AgentSkill only

```bash
npx skills add <user>/brevo-cli
```

## Usage

```bash
brevo-cli auth set "your-token"
brevo-cli auth test
brevo-cli --help
```

## Resources

Run `brevo-cli --help` to see available resources.

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`
