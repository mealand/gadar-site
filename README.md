# Gadar Events website

The website for Gadar Events, gadarevents.com. Have a Gadar Experience.

- **Front end:** Vite, GSAP (ScrollTrigger, SplitText, Flip), Lenis smooth scrolling
- **Back end:** PHP 8 and MySQL, running on Namecheap shared hosting (cPanel)
- **Fonts:** Cormorant Garamond for headings, Manrope for body text
- **Palette:** onyx `#0B0B0C`, champagne gold `#C9A45C`, ivory `#F4EFE6`
- **Deployment:** every push to `main` builds the site on GitHub and uploads it to cPanel over FTPS

## Project layout

```
index.html, about.html, services.html, gallery.html,
experience.html, book.html, contact.html, 404.html   Pages
src/partials/       Shared head, header, footer and preloader (inserted at build time)
src/styles/         tokens.css (colours, fonts), base, components, pages
src/js/             main.js boots everything; animations/, pages/, forms/
public/assets/      Images, video, gallery.json, share image
public/api/         PHP endpoints for bookings, contact, experiences
public/api/lib/     Shared PHP (config, database, uploads, admin helpers). Not web accessible.
public/admin/       Private admin area: call requests, story moderation, messages
public/uploads/     Photos and videos people share (server only, never in git)
database/           schema.sql for MySQL
scripts/            Dash checker and placeholder image generator
```

## Writing rules

- Never use em dashes or en dashes in site content. `npm run build` fails if one appears, and it tells you the file and line.
- "Have a Gadar Experience" is the main call to action (hero, booking, footer).
- "Experience Gadar" invites people to explore (services, gallery, stories).

## Photos and video

All photos and videos come from Gadar Events footage. Every video is muted and compressed for the web (H.264, no audio track, fast start).

| What | Where |
| --- | --- |
| Hero showreel | `public/assets/video/hero.mp4` (1280x720) for wide screens and `hero-portrait.mp4` (720x1280) for phones. The home page picks the right one by screen shape. Keep each under about 8 MB. |
| Page images | `public/assets/images/`, stills taken from the videos. |
| Gallery | Files listed in `public/assets/gallery.json`. Each entry: `{ "type": "image", "src": "/assets/images/name.jpg", "category": "wedding", "caption": "...", "size": "tall" }`. Categories: wedding, government, entertainment, catering, ushering, decor. `size` can be `tall`, `wide` or empty. For a video use `"type": "video"`, a `src` in `/assets/video/` and a `"poster"` image. Video tiles play silently while on screen. |
| Partners | `src/partials/partners.html`, shown on the home and about pages. Names are set as wordmarks; swap in a logo image when partners supply one. |

To cut a new muted clip with ffmpeg:

```bash
ffmpeg -ss 12 -t 8 -i source.mp4 -vf "scale=540:960:force_original_aspect_ratio=increase,crop=540:960" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -an -movflags +faststart public/assets/video/new-clip.mp4
```

## Replacing placeholders

Everything marked *Placeholder* is waiting for real content.

| What | Where |
| --- | --- |
| Team portraits | `about.html`, the four `team-0x.svg` cards |
| Logo | Header monogram in `src/partials/header.html`, `public/favicon.svg`, `public/assets/og-image.jpg` |
| Phone, WhatsApp, email | `src/partials/footer.html`, `contact.html`, `book.html` (search for `2348000000000`), `src/js/api.js`, and `whatsapp` in the server config |
| Statistics | `index.html`, search for `data-count` |
| Team and milestones | `about.html` |
| Testimonials on the home page | `index.html`, section `quotes` |

## Working on the site locally

You need Node.js 20 or newer and PHP 8.1 or newer.

```bash
npm install
```

Create a local config that uses SQLite and does not send email:

```bash
cp public/api/lib/config.sample.php public/api/lib/config.php
```

In that copy set `'driver' => 'sqlite'`, `'enabled' => false` under `mail`, and `'debug' => true`. Then run the two servers in separate terminals:

```bash
npm run dev:php
```

```bash
npm run dev
```

Open http://localhost:5173. Visit http://localhost:5173/admin/setup.php once to create a local admin.

`npm run build` creates the production site in `dist/`.

## First time setup on Namecheap (cPanel)

Do these once. After that, every push to GitHub deploys automatically.

### 1. Point the domain and turn on SSL

1. If the domain and hosting are both on your Namecheap account, the domain is usually already linked. Otherwise, in Namecheap go to Domain List > gadarevents.com > Manage > Nameservers and choose **Namecheap Web Hosting DNS**.
2. In cPanel open **SSL/TLS Status** and click **Run AutoSSL** so the site works on https.

### 2. Create the database

1. cPanel > **MySQL Databases**.
2. Create a database, for example `gadar` (cPanel names it `youruser_gadar`).
3. Create a user with a strong password and add it to the database with **All Privileges**.
4. cPanel > **phpMyAdmin**, select the new database, open **Import**, choose `database/schema.sql` from this project and click **Import**.

### 3. Create a mailbox for outgoing email

cPanel > **Email Accounts** > create `no-reply@gadarevents.com`. Also make sure the inbox that should receive bookings (for example `hello@gadarevents.com`) exists.

### 4. Create an FTP account for GitHub

1. cPanel > **FTP Accounts**.
2. Log in: `github`, set a strong password, and set **Directory** to `public_html` (delete anything cPanel adds after it, so it reads exactly `public_html`).
3. Note the server name shown under **Configure FTP Client**, usually `ftp.gadarevents.com`.

### 5. Add the secrets to GitHub

In https://github.com/mealand/gadar-site go to **Settings > Secrets and variables > Actions > New repository secret** and add:

| Name | Value |
| --- | --- |
| `FTP_SERVER` | `ftp.gadarevents.com` |
| `FTP_USERNAME` | the full FTP login, for example `github@gadarevents.com` |
| `FTP_PASSWORD` | the FTP password |

### 6. Run the first deployment

Push to `main`, or open the **Actions** tab, pick **Build and deploy to cPanel** and click **Run workflow**. The first upload takes a few minutes; later ones only send changed files.

### 7. Add the server config (once)

1. cPanel > **File Manager** > `public_html/api/lib/`.
2. Copy `config.sample.php` to `config.php` and edit it: database name, user and password from step 2, the email addresses from step 3, the WhatsApp number, and a long random `secret`.
3. Deployments never overwrite `config.php` or anything in `uploads/experiences/`.

### 8. Allow larger uploads

cPanel > **Select PHP Version** > **Options** (or **MultiPHP INI Editor**): set `upload_max_filesize` to `64M`, `post_max_size` to `100M`, `max_execution_time` to `120`. Choose PHP 8.1 or newer and make sure the `gd`, `fileinfo` and `pdo_mysql` extensions are ticked.

### 9. Create your admin login

Visit https://gadarevents.com/admin/setup.php and create the first administrator. The page switches itself off as soon as an admin exists. Then sign in at https://gadarevents.com/admin/

## Using the admin area

- **Call Requests:** every booking from the website, with phone, WhatsApp link, event details and an internal note. Move each one through New, Contacted, Booked or Closed.
- **Gadar Experiences:** stories shared by clients and guests. Nothing appears publicly until you click **Publish**. You can fix spelling, remove an individual photo, decline, unpublish or delete. Only the first name is ever shown on the site.
- **Messages:** notes from the contact form.

A new booking, message or story also sends an email to the address set as `mail.to` in the config.

## How deployment works

`.github/workflows/deploy.yml` runs on every push to `main`: it installs packages, runs the dash check, builds the site with Vite, and uploads `dist/` to `public_html` with FTPS. Only changed files are sent. The server config and visitor uploads are excluded so they are never replaced.
