import { Command } from "commander";
import { getManagementToken, getProjectRef, saveManagementToken } from "../lib/config.js";

// ─── Management API client ────────────────────────────────────────────────────

async function managementPatch(projectRef: string, token: string, body: Record<string, string>): Promise<void> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
}

// ─── Shared HTML layout ───────────────────────────────────────────────────────

const wrap = (content: string) => `<div style="background:#0E384A;margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;">
    <div style="background:linear-gradient(180deg,#45B6E5 0%,#009EE0 100%);padding:40px 32px;text-align:center;">
      <div style="display:inline-block;width:72px;height:72px;background:rgba(255,255,255,0.2);border-radius:18px;line-height:72px;font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">M</div>
      <div style="margin-top:16px;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">moovup</div>
      <div style="margin-top:4px;font-size:14px;color:rgba(255,255,255,0.85);">Every step counts.</div>
    </div>
    ${content}
  </div>
  <p style="text-align:center;margin-top:20px;font-size:12px;color:rgba(255,255,255,0.4);">© Moovup · Tous droits réservés</p>
</div>`;

const ctaBlock = (title: string, body: string, btnLabel: string, btnUrl: string, note?: string) =>
  wrap(`<div style="padding:36px 32px;">
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0E384A;letter-spacing:-0.3px;">${title}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#4A6070;line-height:1.6;">${body}</p>
    <a href="${btnUrl}" style="display:block;background:linear-gradient(135deg,#45B6E5,#009EE0);color:#fff;text-decoration:none;text-align:center;padding:16px 24px;border-radius:14px;font-size:16px;font-weight:700;letter-spacing:-0.3px;">${btnLabel}</a>
    ${note ? `<p style="margin:20px 0 0;font-size:12px;color:#8AA5B5;text-align:center;">${note}</p>` : ""}
  </div>`);

const securityBlock = (title: string, body: string) =>
  wrap(`<div style="padding:36px 32px;">
    <div style="background:#FFF8E1;border-left:4px solid #FFB300;border-radius:8px;padding:14px 16px;margin-bottom:24px;font-size:13px;color:#7A5800;font-weight:600;">⚠️ Avis de sécurité</div>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0E384A;letter-spacing:-0.3px;">${title}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#4A6070;line-height:1.6;">${body}<br/><br/>Si tu n'es pas à l'origine de cette action, contacte-nous immédiatement et sécurise ton compte.</p>
    <a href="https://moovup-challenge.vercel.app" style="display:block;background:#F0F7FF;color:#009EE0;text-decoration:none;text-align:center;padding:14px 24px;border-radius:14px;font-size:15px;font-weight:700;">Accéder à mon compte</a>
  </div>`);

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, { subject: string; content: string }> = {
  confirmation: {
    subject: "Confirme ton adresse — Moovup",
    content: ctaBlock(
      "Bienvenue ! 👋",
      "Plus qu'une étape avant de rejoindre le challenge. Confirme ton adresse email pour activer ton compte.",
      "Confirmer mon adresse",
      "{{ .ConfirmationURL }}",
      "Ce lien expire dans 24h. Si tu n'as pas créé de compte, ignore cet email."
    ),
  },
  invite: {
    subject: "Tu es invité à rejoindre Moovup 🏃",
    content: ctaBlock(
      "Tu es invité 🎉",
      "Quelqu'un t'a invité à rejoindre le challenge de pas Moovup. Crée ton compte et commence à accumuler des points !",
      "Accepter l'invitation",
      "{{ .ConfirmationURL }}",
      "Ce lien expire dans 24h."
    ),
  },
  magic_link: {
    subject: "Ton lien de connexion Moovup ✨",
    content: ctaBlock(
      "Ton lien magique 🔗",
      "Clique sur le bouton ci-dessous pour te connecter instantanément. Aucun mot de passe requis.",
      "Me connecter",
      "{{ .ConfirmationURL }}",
      "Ce lien est valable une seule fois et expire dans 1h.<br/>Si tu n'as pas demandé ce lien, ignore cet email."
    ),
  },
  email_change: {
    subject: "Confirme ton nouvel email — Moovup",
    content: ctaBlock(
      "Nouvelle adresse email",
      "Tu as demandé à changer ton adresse email. Confirme la nouvelle adresse <strong>{{ .NewEmail }}</strong> en cliquant ci-dessous.",
      "Confirmer le changement",
      "{{ .ConfirmationURL }}",
      "Si tu n'as pas fait cette demande, sécurise ton compte immédiatement."
    ),
  },
  recovery: {
    subject: "Réinitialise ton mot de passe — Moovup",
    content: ctaBlock(
      "Réinitialisation du mot de passe",
      "Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour en choisir un nouveau.",
      "Choisir un nouveau mot de passe",
      "{{ .ConfirmationURL }}",
      "Ce lien expire dans 1h. Si tu n'as pas fait cette demande, ignore cet email."
    ),
  },
  reauthentication: {
    subject: "Code de vérification Moovup",
    content: wrap(`<div style="padding:36px 32px;text-align:center;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0E384A;letter-spacing:-0.3px;">Vérification requise</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#4A6070;line-height:1.6;">Utilise ce code pour confirmer ton identité avant d'effectuer cette action sensible.</p>
      <div style="background:#F0F7FF;border-radius:14px;padding:20px;margin-bottom:24px;">
        <div style="font-size:36px;font-weight:800;color:#009EE0;letter-spacing:8px;">{{ .Token }}</div>
      </div>
      <p style="margin:0;font-size:12px;color:#8AA5B5;">Ce code expire dans 10 minutes. Ne le partage avec personne.</p>
    </div>`),
  },
  password_changed: {
    subject: "Ton mot de passe a été modifié — Moovup",
    content: securityBlock(
      "Mot de passe modifié",
      "Le mot de passe de ton compte Moovup a été changé avec succès."
    ),
  },
  email_changed: {
    subject: "Ton adresse email a été modifiée — Moovup",
    content: securityBlock(
      "Adresse email modifiée",
      "L'adresse email de ton compte a été changée pour <strong>{{ .NewEmail }}</strong>."
    ),
  },
  phone_changed: {
    subject: "Ton numéro de téléphone a été modifié — Moovup",
    content: securityBlock(
      "Numéro de téléphone modifié",
      "Le numéro de téléphone associé à ton compte a été modifié."
    ),
  },
  identity_linked: {
    subject: "Une nouvelle connexion a été associée à ton compte — Moovup",
    content: securityBlock(
      "Nouvelle connexion ajoutée",
      "Une nouvelle méthode de connexion a été associée à ton compte."
    ),
  },
  identity_unlinked: {
    subject: "Une connexion a été retirée de ton compte — Moovup",
    content: securityBlock(
      "Connexion retirée",
      "Une méthode de connexion a été retirée de ton compte."
    ),
  },
  mfa_added: {
    subject: "Authentification à deux facteurs activée — Moovup",
    content: securityBlock(
      "Double authentification activée",
      "La double authentification (2FA) a été activée sur ton compte."
    ),
  },
  mfa_removed: {
    subject: "Authentification à deux facteurs désactivée — Moovup",
    content: securityBlock(
      "Double authentification désactivée",
      "La double authentification (2FA) a été désactivée sur ton compte."
    ),
  },
};

// ─── API field mapping ────────────────────────────────────────────────────────

const FIELD_MAP: Record<string, { subject: string; content: string }> = {
  confirmation:      { subject: "mailer_subjects_confirmation",   content: "mailer_templates_confirmation_content" },
  invite:            { subject: "mailer_subjects_invite",          content: "mailer_templates_invite_content" },
  magic_link:        { subject: "mailer_subjects_magic_link",      content: "mailer_templates_magic_link_content" },
  email_change:      { subject: "mailer_subjects_email_change",    content: "mailer_templates_email_change_content" },
  recovery:          { subject: "mailer_subjects_recovery",        content: "mailer_templates_recovery_content" },
  reauthentication:  { subject: "mailer_subjects_reauthentication",content: "mailer_templates_reauthentication_content" },
  password_changed:  { subject: "mailer_subjects_password_changed", content: "mailer_templates_password_changed_content" },
  email_changed:     { subject: "mailer_subjects_email_changed",   content: "mailer_templates_email_changed_content" },
  phone_changed:     { subject: "mailer_subjects_phone_changed",   content: "mailer_templates_phone_changed_content" },
  identity_linked:   { subject: "mailer_subjects_identity_linked", content: "mailer_templates_identity_linked_content" },
  identity_unlinked: { subject: "mailer_subjects_identity_unlinked", content: "mailer_templates_identity_unlinked_content" },
  mfa_added:         { subject: "mailer_subjects_mfa_added",       content: "mailer_templates_mfa_added_content" },
  mfa_removed:       { subject: "mailer_subjects_mfa_removed",     content: "mailer_templates_mfa_removed_content" },
};

// ─── Commands ─────────────────────────────────────────────────────────────────

export const emailResource = new Command("email").description("Manage Supabase email templates (Management API)");

emailResource
  .command("push-templates")
  .description("Push all Moovup branded email templates to the linked project")
  .option("--only <types>", "Comma-separated list of template types to push (e.g. magic_link,recovery)")
  .option("--dry-run", "Print the payload without sending", false)
  .action(async (opts: { only?: string; dryRun: boolean }) => {
    const token = getManagementToken();
    if (!token) {
      console.error("No management token. Set SUPABASE_MANAGEMENT_TOKEN env var or run:\n  supabase-cli profile set-management-token --token sbp_...");
      process.exit(1);
    }
    const ref = getProjectRef();
    if (!ref) {
      console.error("Cannot extract project ref from profile URL. Expected format: https://<ref>.supabase.co");
      process.exit(1);
    }

    const types = opts.only ? opts.only.split(",").map((s) => s.trim()) : Object.keys(TEMPLATES);
    const invalid = types.filter((t) => !TEMPLATES[t]);
    if (invalid.length) {
      console.error(`Unknown template type(s): ${invalid.join(", ")}\nValid: ${Object.keys(TEMPLATES).join(", ")}`);
      process.exit(1);
    }

    const body: Record<string, string> = {};
    for (const type of types) {
      const tpl = TEMPLATES[type]!;
      const fields = FIELD_MAP[type]!;
      body[fields.subject] = tpl.subject;
      body[fields.content] = tpl.content;
    }

    if (opts.dryRun) {
      console.log(JSON.stringify({ project_ref: ref, payload: body }, null, 2));
      return;
    }

    process.stdout.write(`Pushing ${types.length} template(s) to ${ref}... `);
    await managementPatch(ref, token, body);
    console.log("✓");
    for (const t of types) console.log(`  ✓ ${t}`);
  });

emailResource
  .command("set-management-token")
  .description("Save a Supabase management token (sbp_...) to the active profile")
  .requiredOption("--token <s>", "Management API token (sbp_...)")
  .action((opts: { token: string }) => {
    saveManagementToken(opts.token);
    console.log("✓ Management token saved.");
  });

emailResource
  .command("list")
  .description("List available template types")
  .action(() => {
    console.log("\nAvailable email template types:\n");
    for (const [type, tpl] of Object.entries(TEMPLATES)) {
      console.log(`  ${type.padEnd(20)}  ${tpl.subject}`);
    }
    console.log();
  });
