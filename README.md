# Crdly - Personalised Greeting Cards

Crdly is a free, no-sign-up greeting card maker. Design a card with stickers, custom text & fun themes, then share it with a link.

## Features

- **Interactive Canvas** — Drag, drop, resize and rotate elements on a multi-page card (cover, inside-left, inside-right).
- **Animated Stickers** — Search thousands of GIF stickers via the Tenor API.
- **Image Uploads** — Add your own photos.
- **Text & Shape Customisation** — Multiple fonts, colours, Lucide icon shapes.
- **Shareable Links** — Save and get a unique link anyone can open.
- **Auto-Expiry** — Cards expire after 3 days and are automatically deleted via Firestore TTL.

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

### 5. Tenor API (Stickers)
A default public key is included. For production use, get your own key from the [Google Cloud Console](https://console.cloud.google.com/) (enable the Tenor API).

---

## Built With
- **React 19** — UI
- **Tailwind CSS v4** — Styling
- **Motion** (Framer Motion) — Animations & page transitions
- **Firebase Firestore** — Database
- **Lucide React** — Icons
- **Tenor API** — Animated stickers
