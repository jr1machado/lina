# Session Recording

Hash Access records sessions **selectively**, not all-or-nothing. The
decision is always computed on the backend, at the moment the connection
token is issued — neither the operator nor the gateway (KoKo/Lion) choose
whether a session records.

## When a session is recorded

A session is recorded when **any** of these is true:

1. The **account** used for the connection is flagged **Privileged**
   (`Account.privileged`).
2. The target **asset** is flagged **Critical** (`Asset.is_critical`).
3. The connect method is **browser-vnc** (browser-based access to web
   appliances such as Fortinet, Check Point, VMware, Palo Alto) — these
   sessions **always** record, with no tag required, because admin access
   to a security appliance is inherently equivalent to privileged access.

If none of the three is true, the session does **not** record — this is
intentional: recording everything indiscriminately adds storage cost and
review noise without a real security gain.

## How to flag an account as privileged

On the account's edit screen, check **Privileged**. This also affects other
platform behavior (risk KRIs, automated-rotation eligibility).

## How to flag an asset as critical

Unlike the account flag, **marking an asset critical requires an approved
ticket** — it's not a free checkbox. This exists so the decision "this
asset is important enough to record everything" isn't made unilaterally by
whoever is configuring the asset day-to-day.

1. Open the asset and request the criticality change.
2. An approver (defined by the ticket approval flow) must accept it.
3. Once approved, every new session against that asset records, regardless
   of which account is used.

## Where recordings live and how to replay them

- SSH/Telnet sessions (KoKo) record as **asciicast** (plain text, light,
  replayed like a terminal).
- RDP/VNC sessions (Lion, including browser-vnc) record as a **Guacamole
  instruction stream**, replayed by the native player — not an encoded
  video (no FFmpeg), so there's no configurable bitrate/fps control today.
- Playback happens on the **Sessions** screen (Terminal tab), via the
  replay button on each recorded session.

## Watermark

Every recorded session (and every exceptional secret reveal) can show a
discreet watermark over the screen with the user, tenant/organization, and
timestamp — makes reusing a captured screenshot/video without attribution
harder.

- Global setting: **Settings → Security → Watermark**
  (`SECURITY_WATERMARK_ENABLED`).
- **Per-asset override**: a specific asset can force the watermark on or
  off, independent of the global setting — useful for a test asset that
  should never show a watermark, or the opposite. This field can only be
  changed by an **Org Admin**.

## Clipboard and file transfer

Controlled **per access grant** (Access Rule / AssetPermission), not a
global toggle — each grant independently sets:

| Action | Effect |
|---|---|
| **Copy** | Allows copying from the remote session to the local clipboard (RDP/VNC). |
| **Paste** | Allows pasting from the local clipboard into the remote session (RDP/VNC). |
| **Upload** | Allows sending a file to the asset (RDP/SFTP). |
| **Download** | Allows downloading a file from the asset (RDP/SFTP). |
| **Delete** | Allows deleting a file over SFTP. |

These restrictions are enforced **at the protocol level** by the gateways
(Guacamole for RDP/VNC, native SFTP for SSH) — not just a UI filter, the
protocol itself refuses the operation when it's turned off.

## Best practices

- Flag as **Privileged** every account with real administrative access
  (root, Administrator, service accounts with elevated privilege).
- Reserve **Critical** status for assets whose sessions must be auditable
  even from a non-privileged account (e.g. a production server where any
  access matters, regardless of which account touched it).
- Turn **Copy/Paste/Upload/Download** off by default on access grants to
  critical assets, and enable them selectively when there's a real
  operational need.
- Use the watermark in any environment subject to audit/compliance — the
  display cost is minimal and the attribution value if a screenshot/video
  leaks is real.
