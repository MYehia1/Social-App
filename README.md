# Echoo

A full-stack social platform: posts, reactions, mentions, comments, friends and
notifications. React 19 + TypeScript on the front, Express 5 + MongoDB on the back.

<!-- Replace with your live URLs once deployed -->
Live demo: not deployed yet · API: not deployed yet

## Screenshots

| Feed — light | Feed — dark |
| --- | --- |
| ![Feed in light mode](docs/screenshots/02-feed-light.png) | ![Feed in dark mode](docs/screenshots/03-feed-dark.png) |

| Post detail | Profile |
| --- | --- |
| ![Post detail with comments](docs/screenshots/05-post-detail.png) | ![Profile page](docs/screenshots/06-profile.png) |

| Reactions | Who reacted |
| --- | --- |
| ![Reaction picker](docs/screenshots/08-reactions.png) | ![Who reacted](docs/screenshots/13-who-reacted.png) |

| Sign up | Email verification |
| --- | --- |
| ![Registration](docs/screenshots/14-register.png) | ![Code entry](docs/screenshots/15-verify.png) |

| Notifications | Friends |
| --- | --- |
| ![Notifications](docs/screenshots/10-notifications.png) | ![Friends and requests](docs/screenshots/11-friends.png) |

| Sign in | Mobile |
| --- | --- |
| ![Sign-in page](docs/screenshots/01-signin.png) | <img src="docs/screenshots/07-mobile.png" alt="Mobile feed" width="260"> |

## Features

**Accounts**
- Sign-up confirmed by a six-digit code emailed to the address
- Passwords hashed with bcrypt (cost 12) — never stored or returned in plaintext
- Short-lived JWT access tokens with silent, automatic refresh
- Change password, which signs you out of every other device
- Password fields have a reveal toggle; submit stays disabled until valid

**Social**
- Feed with infinite scroll and skeleton loading states
- Compose posts with text, an image, or a video (50 MB cap)
- Six reactions per post, one per person, applied optimistically
- See exactly who reacted, filterable by reaction type
- @mentions with typeahead autocomplete, rendered as links to profiles
- Comment threads with inline editing
- Edit and delete your own posts and comments; ownership is enforced server-side
- Profiles with avatar, cover photo, bio, an editable @handle, age and post history

**People**
- Friend requests: send, accept, decline, and remove
- Friends list, pending requests in both directions, and a discovery list
- Friend counts kept on the user record rather than counted on every request

**Notifications**
- Reactions, comments, mentions, and friend activity in one feed
- Unread badge in the header, polled on an interval
- Mark one or all as read

**Interface**
- Light, dark, and system themes
- Responsive: desktop navigation collapses to a mobile bottom bar
- Keyboard-navigable throughout, with focus-trapped dialogs and a skip link
- Every action has a loading, empty, and error state

## Tech stack

| | |
| --- | --- |
| **Client** | React 19, TypeScript, Vite 7, Tailwind CSS 4, TanStack Query 5, React Hook Form, Zod, React Router 7 |
| **Server** | Node 22, Express 5, TypeScript, MongoDB with Mongoose 9, JWT, bcrypt, Zod, Multer |
| **Infra** | npm workspaces, Cloudinary, Docker, Vercel (web), Render (API), MongoDB Atlas |

## Architecture

```
echoo/
├─ apps/
│  ├─ api/                     Express 5 REST API
│  │  └─ src/
│  │     ├─ common/            Shared kernel
│  │     │  ├─ exceptions/     Typed error hierarchy with stable codes
│  │     │  ├─ security/       Password hashing, JWT signing and verification
│  │     │  ├─ mentions.ts     Resolves @handles to user ids at write time
│  │     │  ├─ otp.ts          Six-digit codes: generate, hash, compare
│  │     │  ├─ mail/           Nodemailer transport and message templates
│  │     │  ├─ storage/        Cloudinary image uploads
│  │     │  ├─ validation/     Reusable Zod field rules
│  │     │  └─ response/       The single success envelope
│  │     ├─ config/            Environment parsed and validated at boot
│  │     ├─ DB/
│  │     │  ├─ models/         User, Post, Comment, Reaction,
│  │     │  │                  Notification, Friendship
│  │     │  └─ repository/     Generic typed data-access layer
│  │     ├─ middleware/        auth, validation, upload, error handling
│  │     └─ modules/           auth · posts · comments · users
│  │                           reactions · notifications · friends
│  │        └─ <module>/       controller → service → validation → mapper
│  └─ web/                     React client
│     └─ src/
│        ├─ components/ui/     Design-system primitives
│        ├─ components/layout/ App shell, navigation, theme toggle
│        ├─ features/          auth · feed · posts · comments · profile
│        │                     reactions · notifications · friends
│        │  └─ <feature>/      hooks.ts plus components/
│        ├─ lib/api/           One axios client, one module per resource
│        ├─ providers/         Auth, theme, query client
│        └─ routes/            Lazy routes with auth guards
└─ render.yaml                 API deployment blueprint
```

### Decisions worth explaining

**The access token never touches storage.** It lives in a module-scoped
variable, so an XSS bug cannot read it. The refresh token is an `httpOnly`,
`Secure`, `SameSite=None` cookie that JavaScript cannot see at all. On page
load the client calls `/auth/refresh` once to mint a new access token, and a
single interceptor renews expired tokens mid-flight.

**Concurrent 401s trigger exactly one refresh.** The response interceptor holds
a shared in-flight promise, so ten simultaneous requests that all expire
together queue on one refresh and then retry, instead of stampeding the
endpoint. See `apps/web/src/lib/api/client.ts`.

**Password changes revoke every existing session.** Changing a password stamps
`credentialsChangedAt` on the user. The auth middleware rejects any token
issued before that instant, which gives "sign out everywhere" without a
server-side session store.

**Query keys are parameterized through a factory.** `apps/web/src/lib/queryKeys.ts`
is the single source of cache keys, so a post detail is keyed by its id and two
profiles can never share a cached list. Mutations invalidate the `posts` prefix,
which covers the feed, detail views, and profile lists at once.

**Errors are typed, and stack traces stay on the server.** Every deliberate
failure extends `ApplicationException` with an HTTP status and a stable
machine-readable `code`. The error handler maps Mongoose cast, duplicate-key,
and validation errors onto the same envelope, and only ever logs stack traces.

**Deletes are soft.** Posts and comments get a `deletedAt` stamp and are
filtered out of every read path, so content can be restored and nothing is
silently lost.

**Verification codes are hashed, expiring and rate-limited.** A six-digit code
is only a million values, so a slow hash buys nothing an attacker could not
brute-force offline; the real protections are a ten-minute expiry, a five-guess
counter that burns the code, and a rate limiter on the endpoint. An unverified
signup can be re-claimed with the same address, so a typo does not permanently
burn it, and the resend endpoint answers identically for unknown addresses so
it cannot enumerate accounts.

**The reaction picker closes on a delay.** It floats above the button with a
gap between them, and closing on `mouseleave` immediately made every reaction
except Like unreachable — the pointer left the target while crossing the gap.
A short close delay plus a padded bridge element fixes it.

**Reactions are optimistic, and the counters are denormalized.** Clicking a
reaction updates the cache immediately using the same rules the server
applies, and rolls back if the request fails. Server-side, tallies live on the
post as a `Map` updated with `$inc`, so rendering a feed never aggregates the
reactions collection — and a page of posts costs exactly one extra query to
find the viewer's own reactions, not one per row.

**Mentions are stored as ids, not text.** Handles are resolved when a post is
written, so renaming an account does not silently break every mention of it.
Rendering splits the text into React nodes rather than injecting HTML, so a
post body can never introduce markup.

**Clicking a post card does not use an overlay link.** A link stretched over
the card would sit on top of the body and make the text impossible to select.
The card handles the click itself and bows out when the click landed on
something interactive or when text was being selected; the comment count is a
real link, so keyboard users still have a focusable way in.

**Rate limiting counts failures, not successes.** Brute force is a stream of
failed attempts, so successful sign-ins do not consume the budget — otherwise
several people behind one IP could lock each other out of a shared demo.

## Getting started

**Requirements:** Node 20+, and MongoDB (local or an Atlas connection string).

```bash
git clone https://github.com/<you>/echoo.git
cd echoo
npm install
```

Configure both apps:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Generate the two JWT secrets and paste them into `apps/api/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Seed a sample feed, then start both apps:

```bash
npm run seed -w @echoo/api
npm run dev
```

The client runs on <http://localhost:5173> and the API on <http://localhost:3000>.

> Image uploads need Cloudinary credentials in `apps/api/.env`. Without them
> everything else works, and upload attempts return a clear 503.

### Email delivery

Signup verification codes go out through nodemailer. Leave `SMTP_USER` and
`SMTP_PASSWORD` blank and the API prints each code to its own log, which is
enough to finish a signup locally without a mail server.

To send for real over Gmail:

1. Turn on 2-Step Verification, then create an App Password at
   <https://myaccount.google.com/apppasswords>.
2. Put the 16 characters in `SMTP_PASSWORD` — **no spaces, no quotes** — and
   your Gmail address in `SMTP_USER`.
3. Set `MAIL_FROM` to that same address. Gmail rewrites the From header to the
   authenticated mailbox, so any other domain is silently replaced.

The API verifies the transport at boot and reports the result in its startup
log, so a wrong password shows up immediately rather than as a signup that
appears to succeed and never delivers. `GET /health` reports `mail: true` once
it is working.

### Google sign-in

`GOOGLE_CLIENT_ID` (API) and `VITE_GOOGLE_CLIENT_ID` (web) must be the **same**
client id: the browser mints the ID token against one and the API checks the
token's audience against the other. Two different ids — even within the same
Google Cloud project — fail with *"Could not verify that Google account"*. The
client also needs `http://localhost:5173` listed under **Authorized JavaScript
origins**, or the button never renders at all.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the API and the web app together |
| `npm run build` | Type-check and build both apps |
| `npm run typecheck` | Type-check both apps |
| `npm run lint` | Lint both apps |
| `npm run seed -w @echoo/api` | Reset and seed the database |

## API

Base URL: `/api/v1`. All responses use one envelope:

```jsonc
// success
{ "status": 200, "message": "Done", "data": {}, "meta": {} }

// failure
{
  "status": 400,
  "error": {
    "message": "Validation failed",
    "code": "BAD_REQUEST",
    "details": [{ "field": "email", "message": "Enter a valid email address" }]
  }
}
```

`details` is shaped so the client can map server errors straight onto form fields.

| Method | Endpoint | Auth | Description |
| --- | --- | :---: | --- |
| `POST` | `/auth/signup` | | Create an account and email a code |
| `POST` | `/auth/verify` | | Exchange the code for a session |
| `POST` | `/auth/resend-code` | | Email a fresh code |
| `POST` | `/auth/login` | | Sign in |
| `POST` | `/auth/refresh` | cookie | Mint a new access token |
| `POST` | `/auth/logout` | | Clear the refresh cookie |
| `GET` | `/auth/me` | yes | Current user |
| `PATCH` | `/auth/password` | yes | Change password, revoking other sessions |
| `GET` | `/posts` | yes | Paginated feed |
| `POST` | `/posts` | yes | Create a post (multipart) |
| `GET` | `/posts/:id` | yes | A post with its comments |
| `PATCH` | `/posts/:id` | yes | Update your post |
| `DELETE` | `/posts/:id` | yes | Soft-delete your post |
| `GET` | `/users/:userId/posts` | yes | A user's posts |
| `POST` | `/comments` | yes | Add a comment |
| `PATCH` | `/comments/:id` | yes | Update your comment |
| `DELETE` | `/comments/:id` | yes | Soft-delete your comment |
| `GET` | `/posts/mentions` | yes | Posts you were mentioned in |
| `PUT` | `/reactions/:postId` | yes | Set, switch, or clear your reaction |
| `GET` | `/reactions/:postId` | yes | Who reacted to a post |
| `GET` | `/notifications` | yes | Your notification feed |
| `GET` | `/notifications/unread-count` | yes | Badge count |
| `PATCH` | `/notifications/read-all` | yes | Mark everything read |
| `PATCH` | `/notifications/:id/read` | yes | Mark one read |
| `GET` | `/friends` | yes | Your friends |
| `GET` | `/friends/requests/incoming` | yes | Requests waiting on you |
| `GET` | `/friends/requests/outgoing` | yes | Requests you sent |
| `GET` | `/friends/suggestions` | yes | People you are not connected to |
| `POST` | `/friends/requests/:userId` | yes | Send a friend request |
| `PATCH` | `/friends/requests/:id` | yes | Accept or decline a request |
| `DELETE` | `/friends/:userId` | yes | Remove a friend |
| `GET` | `/users/search` | yes | Handle typeahead for mentions |
| `PATCH` | `/users/me` | yes | Update name, handle, or bio |
| `GET` | `/users/by-username/:username` | yes | A public profile plus friend state |
| `PUT` | `/users/me/photo` | yes | Upload an avatar |
| `PUT` | `/users/me/cover` | yes | Upload a cover photo |
| `GET` | `/health` | | Liveness probe |

## Security

- **Passwords** — bcrypt at cost 12; the hash is `select: false` so it cannot be
  returned by an endpoint that forgets to strip it
- **Email verification** — signup issues a hashed, ten-minute, five-attempt code;
  sign-in on an unconfirmed account is refused with a distinct error code
- **Rate limiting** — 300 requests per 15 minutes globally, and 10 per 15 minutes
  on every credential endpoint, which makes online password guessing impractical
- **Headers and CORS** — Helmet, plus a strict origin allowlist with credentials
- **Input validation** — every request body, param, and query is parsed by Zod
  and replaced with the typed result before a handler sees it
- **Uploads** — held in memory (never written to disk), capped at 4 MB, and
  restricted to real image MIME types
- **Payloads** — JSON bodies capped at 100 kB
- **Errors** — stack traces are logged server-side and never sent to clients
- **Authorization** — ownership checks live in the service layer, so no route
  can forget them

## Roadmap

The foundations are deliberately built for what comes next:

- [ ] Groups, with membership roles and per-group feeds
- [ ] Pushing notifications over WebSockets instead of polling
- [ ] 1:1 messaging with typing indicators and read receipts
- [ ] A feed ranked by your friend graph rather than pure recency
- [ ] Full-text search across posts and people
- [ ] Moderation: reporting, block and mute, an admin queue, and audit logs
- [ ] Email verification and password reset
- [ ] Redis for refresh-token revocation and feed caching
- [ ] Integration tests with Vitest and `mongodb-memory-server`, wired into CI

## License

MIT

Built by Mahmoud Yehia.
