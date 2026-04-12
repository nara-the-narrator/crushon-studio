# Crushon Studio

Browser-based **character studio** for building roleplay cards: rich introductions, Crushon-aligned fields, hosted assets on Catbox, GIF output, and JSON/HTML export. **All data stays in your browser** (IndexedDB), with optional backup to a local JSON file.

---

## Features

| Area | What it does |
|------|----------------|
| **Introduction studio** | Opening text plus titled sections, palette-driven **live preview**, basic markup, inline images. For **Tavern JSON**, this HTML lives in the **`personality`** key (SillyTavern’s “personality” line maps to Crushon **Introduction**). |
| **Crushon fields** | **Personality** tab → Tavern **`description`** (main long-form field → Crushon Personality). **Scenario**, **Greeting**, **Appearance** use the same key names in JSON. |
| **JSON export** | **Full app bundle**: round-trip with `extensions.crushonStudio`. **Crushon / SillyTavern** flat file: swapped `description`/`personality` vs plain English; empty fields get placeholders so imports don’t misalign. |
| **HTML export** | Crushon-safe inline-styled fragment (copy from Introduction studio). |
| **GIF constructor** | Multi-frame GIF with transitions; optional upload to your Catbox album. |
| **Image library** | Clothes/action images with Catbox URLs; copy **clothes / action tracker** prompts for chat systems. |
| **Catbox** | Store a userhash in the app footer, upload avatars, library images, and GIFs into a per-character album. |
| **Workspace file** | Chromium: link a JSON file on disk for backup/replace (optional). |

---

## Tech stack

- **React 19** + **TypeScript** + **Vite 8**
- **React Router** for `/` and `/character/:id`
- **IndexedDB** for persistence (`gifenc` for GIF encoding)

---

## Getting started

**Requirements:** Node.js 20+ (recommended).

```bash
git clone https://github.com/nara-the-narrator/crushon-studio.git
cd crushon-studio
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint |

---

## Using exports with Crushon.ai

1. Fill **Introduction studio** — exports as **HTML** (same as **Copy HTML**) in the JSON field named **`personality`** (Tavern naming), which Crushon shows in **Introduction**.
2. Fill **Personality**, **Scenario**, **Greeting**, and **Appearance** tabs — the long **Personality** text goes in JSON **`description`**; the other keys match (`scenario`, `first_mes`, `appearance`). Leave blanks if you like; the export fills placeholders so fields don’t shift on import.
3. In **JSON export**, download **Crushon.ai / SillyTavern** (`.json`).
4. On Crushon, use **Create Character → Character Photo & File** and import that JSON (or combine with a PNG card workflow if you use one).

Tags and name from the profile header are included where the export format supports them.

---

## Privacy & data

- No backend; no account required for the app itself.
- Characters and Catbox userhash are stored **locally** in the browser.
- Use **Download backup** in the footer or a linked workspace file if you need a portable copy.

---

## Repository

**Source:** [github.com/nara-the-narrator/crushon-studio](https://github.com/nara-the-narrator/crushon-studio)
