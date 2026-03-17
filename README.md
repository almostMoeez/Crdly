# Crdly — Create & Share Beautiful Greeting Cards

**[crdly.vercel.app](https://crdly.vercel.app)**

Crdly is a free, no-sign-up greeting card maker. Design a card with stickers, custom text, fun themes & animations — then share it with a link in seconds.

## Features

### Editor
- **Interactive Canvas** — Drag, drop, resize and rotate elements on a multi-page card (cover, inside-left, inside-right).
- **Animated Stickers** — Search thousands of GIF stickers via the Giphy API with infinite scroll pagination.
- **Text & Shapes** — Multiple fonts, colours, and 20+ Lucide icon shapes.
- **Undo / Redo** — Full history with `Ctrl+Z` / `Ctrl+Shift+Z` keyboard shortcuts.
- **Inline Text Editing** — Double-click any text element to edit it directly on the canvas.
- **Layering** — Move elements up/down, bring to front, send to back.

### Customisation
- **8 Themes** — Each with its own colour palette.
- **8 Background Styles** — Gradient, pattern, and solid options.
- **7 Background Decorations** — Hearts, stars, confetti, and more.
- **5 Open Animations** — Confetti, fireworks, hearts, stars, emoji blast on card open.

### Preview & Sharing
- **Live Preview** — Full-screen card preview with 3D flip animation, floating decorations, and confetti effects.
- **Shareable Links** — Save and get a unique link anyone can open.
- **Auto-Expiry** — Cards expire after 3 days and are automatically deleted via Firestore TTL.

### Mobile
- **Mobile-First UI** — App-like experience with bottom toolbar, slide-up panels, and two-tap element editing.
- **iOS / Safari Compatible** — Touch handling, pointer capture, webkit prefixes, bounce-scroll prevention.

### SEO
- Open Graph & Twitter Card meta tags for rich link previews.
- JSON-LD structured data (WebApplication schema).
- Dynamic `document.title` per route.
- Semantic HTML (`<main>`, `<nav>`, `<section>`, `<footer>`).
- `robots.txt` and `sitemap.xml`.

---

## Do users need to log in?

**No.** Cards are ephemeral (3-day lifespan) so there's no account requirement. Creators and recipients alike just use the link.

---

## Local Development

### Prerequisites
- Node.js v18+
- npm

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

```
VITE_GIPHY_API_KEY=your_giphy_api_key
```

Then start the dev server:

```bash
npm run dev
```

The dev server starts on `http://localhost:3000`.

---

## Firebase Setup

Crdly uses Firestore as its only backend. Follow these steps to set it up from scratch.

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**, name it (e.g. "Crdly"), and create it.

### 2. Set Up Firestore
1. Go to **Build > Firestore Database** and click **Create database**.
2. Start in **Production mode**.
3. In the **Rules** tab, paste the security rules from `firestore.rules` in this repo, then click **Publish**.

### 3. Enable TTL (Auto-Deletion)
1. Open the [Google Cloud Console](https://console.cloud.google.com/) for your project.
2. Navigate to **Firestore > Time-to-Live (TTL)**.
3. Create a policy: collection group `cards`, timestamp field `expiresAt`.

### 4. Connect the App
1. In Firebase **Project Settings > Your apps**, register a Web app.
2. Copy the generated `firebaseConfig` into `src/firebase.ts`.

### 5. Giphy API (Stickers)
Get an API key from [developers.giphy.com](https://developers.giphy.com/) and add it to your `.env` file as `VITE_GIPHY_API_KEY`.

---

## Deployment

The app is deployed on **Vercel**. Push to main and Vercel auto-deploys.

Build command: `npm run build`
Output directory: `dist`

---

## Built With
- **React 19** + **TypeScript** — UI
- **Vite** — Build tool
- **Tailwind CSS v4** — Styling
- **Motion** (Framer Motion) — Animations & page transitions
- **Firebase Firestore** — Database
- **Lucide React** — Icons & shapes
- **Giphy API** — Animated stickers
- **canvas-confetti** — Celebration effects
