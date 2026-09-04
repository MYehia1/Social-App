import nodemailer, { type Transporter } from 'nodemailer'
import { env, isProduction, mailEnabled } from '../../config/config'
import { OTP_TTL_MS } from '../otp'

let transporter: Transporter | null = null

/** How the code phrases its own lifetime, so the email can never drift from it. */
const OTP_TTL_MINUTES = Math.round(OTP_TTL_MS / 60_000)
const OTP_TTL_LABEL = `${OTP_TTL_MINUTES} minute${OTP_TTL_MINUTES === 1 ? '' : 's'}`

/** Names the variable that is actually missing, rather than "not configured". */
function missingMailVars(): string[] {
  return [!env.SMTP_USER && 'SMTP_USER', !env.SMTP_PASSWORD && 'SMTP_PASSWORD'].filter(
    (name): name is string => Boolean(name),
  )
}

function getTransporter(): Transporter | null {
  if (!mailEnabled) return null
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // 465 is implicit TLS; everything else upgrades with STARTTLS.
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER as string, pass: env.SMTP_PASSWORD as string },
    // Nodemailer's defaults run to two minutes. Mail is never worth holding a
    // request open that long, and callers here already treat failure as
    // non-fatal, so fail fast and let the log carry it.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  return transporter
}

/**
 * The last verification result, so `/health` can report whether mail actually
 * works rather than whether it is merely configured — a wrong app password
 * leaves the config populated and the transport dead.
 */
let transportVerified = false

export function mailTransportVerified(): boolean {
  return transportVerified
}

/**
 * Checks the credentials once at boot instead of on the first signup.
 *
 * Signup deliberately swallows mail failures so a bad transport cannot strand
 * a user mid-registration. That is right for the user and terrible for the
 * operator: a wrong app password produces a signup that looks successful and
 * an email that never arrives. Verifying here surfaces it in the boot log,
 * where it is actionable.
 */
export async function verifyMailTransport(): Promise<boolean> {
  const transport = getTransporter()

  if (!transport) {
    transportVerified = false
    console.warn(
      `✉️  SMTP disabled (${missingMailVars().join(' and ')} empty) — ` +
        'verification codes will be printed to this log.',
    )
    return false
  }

  try {
    await transport.verify()
    transportVerified = true
    console.log(`✉️  SMTP ready — sending as ${env.MAIL_FROM}`)
    return true
  } catch (error) {
    // Do not take the process down: every other feature still works, and a
    // mail outage should not block local development.
    console.error(
      `✉️  SMTP credentials rejected by ${env.SMTP_HOST}: ${(error as Error).message}\n` +
        '   Gmail needs an App Password (16 characters, no spaces) from ' +
        'https://myaccount.google.com/apppasswords, not the account password.',
    )
    transportVerified = false
    return false
  }
}

interface Mail {
  to: string
  subject: string
  text: string
  html: string
}

/**
 * Sends an email, or logs it when SMTP is not configured.
 *
 * Local development should not require a mail server, so the fallback prints
 * the message to the server log — which is enough to complete a signup while
 * testing. In production a missing transport is an error, not a fallback.
 */
export async function sendMail({ to, subject, text, html }: Mail): Promise<void> {
  const transport = getTransporter()

  if (!transport) {
    if (isProduction) {
      throw new Error(
        `SMTP is not configured (${missingMailVars().join(' and ')} empty); ` +
          'cannot send mail in production',
      )
    }
    console.info(
      `\n--- email (${missingMailVars().join(' and ')} empty, not sent) ---\n` +
        `to: ${to}\n${subject}\n${text}\n---\n`,
    )
    return
  }

  await transport.sendMail({ from: env.MAIL_FROM, to, subject, text, html })
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/*                                                                     */
/* Gmail is the hard target and it is unforgiving: it strips <style>    */
/* blocks, ignores flexbox and grid, drops most positioning, and its    */
/* Android app re-flows anything wider than the screen. So these are    */
/* built the way email has always had to be built — nested tables,      */
/* every rule inline, no shorthand `background`, explicit widths.       */
/*                                                                     */
/* Brand colours are hard-coded hex rather than the app's oklch tokens: */
/* no mail client understands oklch or CSS variables.                   */
/* ------------------------------------------------------------------ */

const NAVY = '#00296b'
const BLUE = '#00509d'
const GOLD = '#fdc500'
const INK = '#1b2a4a'
const MUTED = '#5b6b85'
const HAIRLINE = '#e3e8f0'
const PAPER = '#f4f6fa'

/* Dark counterparts. Navy cannot simply be reused on a dark ground — at 30%
   lightness it is nearly invisible there — so headings lift to the pale blue
   the app uses for the same job, and the card sits a step above the page. */
const D_PAGE = '#0d1526'
const D_CARD = '#16203a'
const D_TEXT = '#e8ecf5'
const D_MUTED = '#9aa8c2'
const D_HEADING = '#a8c6ff'
const D_HAIRLINE = '#2a3654'

/** Escapes anything that ends up inside the HTML body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The shell every message shares: a centred card on a tinted page, with the
 * wordmark above it and the legal footer below.
 *
 * `role="presentation"` on the layout tables keeps screen readers from
 * announcing them as data tables, and the 600px cap is the width every client
 * renders without horizontal scrolling.
 */
function layout({ title, body }: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<!-- Without these two the client assumes the message is light-only and
     force-inverts it, which is what turns a white card muddy grey. Declaring
     support means Apple Mail and Outlook hand us the dark styling instead. -->
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${title}</title>
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }

  @media (prefers-color-scheme: dark) {
    .e-page  { background-color: ${D_PAGE} !important; }
    .e-card  { background-color: ${D_CARD} !important; border-color: ${D_HAIRLINE} !important; }
    .e-panel { background-color: ${D_PAGE} !important; border-color: ${D_HAIRLINE} !important; }
    .e-head  { color: ${D_HEADING} !important; }
    .e-text  { color: ${D_TEXT} !important; }
    .e-muted { color: ${D_MUTED} !important; }
    .e-code  { color: #ffd500 !important; }
    .e-wordmark { color: ${D_TEXT} !important; }
  }

  /* Gmail's mobile apps strip the media query above and instead prefix every
     rule with [data-ogsc] / [data-ogsb] after inverting the colours
     themselves. Repeating the palette here is the only way to take that back
     — otherwise Gmail picks its own approximations and the gold rule and the
     code block come out washed. */
  [data-ogsc] .e-page  { background-color: ${D_PAGE} !important; }
  [data-ogsc] .e-card  { background-color: ${D_CARD} !important; border-color: ${D_HAIRLINE} !important; }
  [data-ogsc] .e-panel { background-color: ${D_PAGE} !important; border-color: ${D_HAIRLINE} !important; }
  [data-ogsc] .e-head  { color: ${D_HEADING} !important; }
  [data-ogsc] .e-text  { color: ${D_TEXT} !important; }
  [data-ogsc] .e-muted { color: ${D_MUTED} !important; }
  [data-ogsc] .e-code  { color: #ffd500 !important; }
  [data-ogsc] .e-wordmark { color: ${D_TEXT} !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAPER}">
<table role="presentation" class="e-page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER};margin:0;padding:0;width:100%">
  <tr>
    <td align="center" style="padding:32px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">

        <tr>
          <td align="center" style="padding:0 0 20px">
            <span class="e-wordmark" style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.2px;color:${NAVY}">
              Echoo
            </span>
          </td>
        </tr>

        <tr>
          <td class="e-card" style="background-color:#ffffff;border:1px solid ${HAIRLINE};border-radius:14px;padding:0">
            <!-- The gold rule is the only accent in the message, so the eye
                 lands on the card before anything else. -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:${GOLD};height:4px;line-height:4px;font-size:0;border-radius:14px 14px 0 0">&nbsp;</td>
              </tr>
              <tr>
                <td style="padding:32px">
                  <h1 class="e-head" style="margin:0 0 18px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;line-height:1.35;font-weight:600;color:${NAVY}">
                    ${title}
                  </h1>
                  ${body}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:20px 8px 0">
            <p class="e-muted" style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${MUTED}">
              You are receiving this because someone used this address on Echoo.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`.trim()
}

const P = `margin:0 0 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${INK}`
const SMALL = `margin:0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:${MUTED}`

/** The one-time code that completes a signup. */
export function verificationEmail(code: string, name: string): Omit<Mail, 'to'> {
  const text = `Hi ${name},\n\nYour Echoo verification code is ${code}\nIt expires in ${OTP_TTL_LABEL}.\n\nIf you did not create an account, you can ignore this email — no account is created until the code is entered.`

  const body = `
                  <p class="e-text" style="${P}">Hi ${escapeHtml(name)}, use this code to finish creating your account.</p>

                  <!-- The code sits in its own bordered block: it is the one
                       thing the reader came for, and on a phone it has to be
                       readable and selectable without zooming. -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
                    <tr>
                      <td align="center" class="e-panel" style="background-color:${PAPER};border:1px solid ${HAIRLINE};border-radius:10px;padding:22px 12px">
                        <span class="e-code" style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${NAVY};line-height:1">
                          ${code}
                        </span>
                        <br />
                        <span class="e-muted" style="display:inline-block;margin-top:12px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BLUE}">
                          Expires in ${OTP_TTL_LABEL}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <p class="e-muted" style="${SMALL}">
                    Didn't ask for this? Ignore the email — no account is created until the code is entered.
                  </p>`

  return {
    subject: `${code} is your Echoo verification code`,
    text,
    html: layout({ title: 'Confirm your email address', body }),
  }
}

/**
 * Tells someone their password changed.
 *
 * Sent after the fact, not as an approval step: the point is that if the
 * change was not theirs, they find out immediately rather than the next time
 * they fail to sign in. That is why it names the time and says what to do.
 */
export function passwordChangedEmail(name: string, when: Date): Omit<Mail, 'to'> {
  const stamp = when.toUTCString()

  const text = `Hi ${name},\n\nYour Echoo password was changed on ${stamp}.\n\nEvery device that was signed in has been signed out, so you will need to sign in again with the new password.\n\nIf this was not you, reset your password immediately — whoever made this change can currently sign in to your account.`

  const body = `
                  <p class="e-text" style="${P}">Hi ${escapeHtml(name)}, your password was just changed.</p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
                    <tr>
                      <td class="e-panel" style="background-color:${PAPER};border:1px solid ${HAIRLINE};border-radius:10px;padding:16px 18px">
                        <p class="e-muted" style="margin:0 0 4px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.4px;text-transform:uppercase;color:${MUTED}">
                          When
                        </p>
                        <p class="e-head" style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:${NAVY}">
                          ${escapeHtml(stamp)}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p class="e-text" style="${P}">
                    Every device that was signed in has been signed out, so you will need to
                    sign in again with the new password.
                  </p>

                  <!-- Left rule in the danger colour: this is the line that
                       matters if the change was not theirs. -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-left:3px solid #c0392b;padding:2px 0 2px 14px">
                        <p class="e-muted" style="${SMALL}">
                          <strong class="e-text" style="color:${INK}">Wasn't you?</strong>
                          Reset your password straight away — whoever made this change can
                          sign in to your account until you do.
                        </p>
                      </td>
                    </tr>
                  </table>`

  return {
    subject: 'Your Echoo password was changed',
    text,
    html: layout({ title: 'Your password was changed', body }),
  }
}
