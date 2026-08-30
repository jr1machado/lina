# Vault Security Center

The **Vault Security Center** shows the real, live status of the subsystem
that protects privileged credentials stored in the platform — never a key,
PIN, or secret value, only status.

## What each field means

| Field | Meaning |
|---|---|
| **Vault Status** | `HEALTHY` when the configured backend is reachable and authenticated; `DEGRADED` on any connection/authentication failure. While `DEGRADED`, every operation that requires decrypting a secret (connect, reveal, rotate, set a new secret) is **denied** — the platform never falls back to a cached secret to keep working while the Vault is down. |
| **Crypto Provider** | Which backend is active: `Database` (local storage, encrypted with the application's own `SECRET_KEY`), `HashiCorp Vault`, `Azure Key Vault`, or `Amazon Secrets Manager`. |
| **Hardware-backed** | Only shown when the backend is HashiCorp Vault. Reads the real `seal-status` from the Vault server: `Yes` when the auto-unseal mechanism is not plain Shamir (i.e. something like a PKCS#11/HSM or a cloud KMS protects Vault's own root key); `No` when it's Shamir (software-only). Never an assumption — read live from Vault itself. |
| **Encryption Algorithm** | The algorithm used by the application's own crypto layer (AES-256-GCM), independent of the chosen backend. |
| **Last Crypto Health Check** | When the status above was computed — every page load queries Vault live. |

## How to configure

1. Go to **Settings → Features → Vault**.
2. Check **Enabled** and pick a **Backend**: `HashiCorp Vault`, `Azure Key
   Vault`, or `Amazon Secrets Manager`. Leave it disabled to use local
   storage (encrypted, but under a single global key — see the
   recommendation below).
3. Fill in the fields specific to the chosen backend (server address,
   token/credential, mount point for HashiCorp Vault).
4. Click **Test** before saving — this validates connectivity without
   touching any existing secret.
5. After saving, use **Sync** to migrate secrets that currently live in the
   local database into the configured Vault. Sync is **one-way** (local →
   Vault); once complete, the local database no longer holds the secret
   value.
6. Come back to the Vault Security Center and confirm **Vault Status:
   HEALTHY** before considering the migration done.

## Best practices

- **Production should use HashiCorp Vault with HSM/KMS-backed auto-unseal**,
  not plain local storage. Local storage depends entirely on the
  application's `SECRET_KEY` — whoever has that key plus a copy of the
  database can decrypt everything. With Vault, an attacker would need to
  compromise **both** systems.
- **Never** store the Vault token in plaintext outside the environment's
  `.env.local` — it must never reach Git, logs, or the Docker image.
- Monitor the **Vault Status** field — if it drops to `DEGRADED`, any new
  session that needs a secret stops working immediately (intentional:
  fail closed, never fail open).
- After rotating the Vault token/credential on the server side, update the
  configuration here and click **Test** again before trusting the status.

## Related permissions (granular credential RBAC)

Viewing/using a secret is not one single permission — it's several,
independent from each other, so a custom role can be granted exactly what
it needs:

| Permission | What it allows |
|---|---|
| `accounts.view_accountsecret` | See the credential's value (reveal). Already requires MFA step-up automatically. |
| `accounts.copy_accountsecret` | Shows the copy button in the reveal dialog. Without it, the button simply doesn't appear. |
| `accounts.set_accountsecret` | Replace a credential's value (including "Clear Secret"). Does not require seeing the previous value. |
| `accounts.change_account` | Edit account metadata (name, username, rotation policy, tags) — does **not** grant access to the secret itself. |

A Platform Administrator does **not** automatically receive
`view_accountsecret`/`copy_accountsecret` just by administering the
platform — these permissions must be granted explicitly to a role, which
reduces the blast radius of a compromised administrative account.

## Secret reveal

- Reveal has a **configurable display time**
  (`SECURITY_SECRET_REVEAL_TTL_SECONDS`, default 15 seconds) — after that,
  the value re-masks itself automatically on screen.
- There's a **rate limit**: at most 5 reveals per minute per user, across
  any number of different credentials.
- Every reveal is audited (`SECRET_REVEALED` event) with who, when, and
  which credential — never the value itself.

## Break-glass accounts

An account flagged **Break Glass** never connects directly — even if the
user already has standing access authorization for that asset. Connecting
requires an approved access request (the same Ticket mechanism used for
Access Rules), with two additional protections:

- **The requester can never approve their own request**, even if they hold
  approver permission.
- **The approver must hold real authority over the requested asset** — just
  being listed as a generic approver isn't enough.

Use Break Glass for very high-privilege accounts (domain admin, firewall
root, DBA) that should only ever be used in an emergency, never day-to-day.
