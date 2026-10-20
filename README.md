# Ocean Voyage Holidays — Website + Admin Panel

Sky Blue / Black / Grey / White theme travel agency website — a multi-page
HTML/CSS/JS site (layout inspired by gtholidays.in) with a Firebase-powered
admin panel.

## What's inside

```
ocean-holidays/
├── index.html               ← Home
├── company.html              ← Company / About Us + testimonials
├── group-tours.html          ← Group Tours
├── packages.html              ← All Packages (+ live "Trending Tours" from Firestore)
├── india.html                  ← India Tour Packages
├── honeymoon.html                ← Honeymoon & Getaway Deals
├── wedding.html                    ← Destination Weddings
├── contact.html                      ← Contact / Enquiry form
├── css/style.css              ← Shared design system — every page links this one file
├── js/firebase-config.js      ← Your Firebase project keys go here
├── js/main.js                 ← Shared site logic (nav, forms, newsletter, trending tours)
└── admin/
    ├── login.html           ← Admin sign-in
    ├── dashboard.html        ← Admin dashboard (leads, packages, subscribers)
    ├── css/admin.css          ← Imports the same tokens from ../css/style.css
    └── js/admin.js

Every page shares the same header, nav, footer and `css/style.css`, so the
Firebase-powered admin panel, the enquiry form, and the newsletter box all
work identically no matter which page they're on — there's one `js/main.js`
loaded everywhere, and each script inside it checks whether its element
exists on that page before doing anything (e.g. the enquiry form only runs
on `contact.html`, the hero slider only runs on `index.html`).
```

## Theme

The whole site — including the admin panel, which imports the same
`css/style.css` — runs off one set of CSS variables at the top of that file.
Change a hex value there and it re-colours the entire site and dashboard:

- **Sky blue** (`--ocean` / `--teal` / `--gold`) — buttons, links, active nav, icons
- **Black** (`--navy-deep` / `--navy`) — hero/footer backgrounds, headings
- **Grey** (`--ink-soft` / `--foam-deep`) — secondary text, card/section backgrounds
- **White** (`--white` / `--foam`) — base background

## 1. Create a Firebase project (free)

1. Go to https://console.firebase.google.com → **Add project**.
2. Once created, click the **`</>`** (Web) icon to register a web app.
3. Firebase will show you a `firebaseConfig` object — copy it.
4. Open `js/firebase-config.js` and paste your values in place of the
   `"REPLACE_ME"` placeholders. That's the only file you need to edit to
   go live.

## 2. Turn on the two Firebase products this site uses

- **Firestore Database** → Build → Firestore Database → *Create database*
  (start in production mode; the rules below lock it down properly).
- **Authentication** → Build → Authentication → *Get started* → enable the
  **Email/Password** sign-in method.

## 3. Create your admin login

Authentication → Users tab → **Add user** → enter the email & password you
want to use to log into `/admin/login.html`. You can add more admin users
later the same way.

## 4. Set Firestore security rules

Firestore Database → **Rules** tab → paste this and click Publish
(the same rules are also included as a comment inside `js/firebase-config.js`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leads/{leadId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /subscribers/{subId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /packages/{pkgId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This means: anyone visiting the site can submit an enquiry or subscribe,
but only a signed-in admin can read/manage that data or edit packages.

## 5. Open the site

Just open `index.html` in a browser (or deploy — see below). No build step,
no npm install — it's plain HTML/CSS/JS plus the Firebase SDK loaded from a
CDN.

- Homepage enquiry form → saved to Firestore collection **`leads`**
- Newsletter box → saved to collection **`subscribers`**
- "Trending Tours" section → reads from collection **`packages`**, which you
  manage from the admin panel (Packages tab). Until you add packages there,
  the homepage shows the built-in sample tours automatically.

## 6. Log into the admin panel

Go to `admin/login.html`, sign in with the user you created in step 3.
From the dashboard you can:
- View and manage every **enquiry/lead** (mark contacted / closed / delete)
- **Add, edit, delete Packages** shown in the homepage's Trending Tours
- See **newsletter subscribers**

## 7. Deploying (optional)

The easiest free option is **Firebase Hosting**:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # choose this folder as the public directory
firebase deploy
```

Or drag-and-drop the whole `ocean-holidays` folder into Netlify/Vercel — it
works as a static site anywhere.

## Customising branding

This build uses a **placeholder name and logo — "Ocean Voyage Holidays"** —
since the real company name/logo weren't finalised yet. To swap them:

- Text logo: search for `Ocean Voyage` across every `.html` page (it appears
  in the header and footer of each one) and in `admin/login.html` /
  `admin/dashboard.html`, and replace with your name.
- Real logo image: replace the `.logo-mark` SVG block with an `<img>` tag
  pointing at your logo file — it appears twice per page (header + footer),
  so do a find-and-replace across all files rather than editing one by one.
- Colours live at the top of `css/style.css` under `:root` — change the
  hex values there to re-theme the whole site in one place.
