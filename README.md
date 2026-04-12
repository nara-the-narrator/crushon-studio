# Nara the Narrator

Browser-based **character studio** for building roleplay cards: rich introductions, Crushon-aligned fields, hosted assets on Catbox, GIF output, and JSON/HTML export. **All data stays in your browser** (IndexedDB), with optional backup to a local JSON file.

---

## Features

| Area | What it does |
|------|----------------|
| **Introduction studio** | Opening text plus titled sections, palette-driven **live preview**, basic markup, inline images. The full document maps to Crushon **Introduction** (and to Tavern JSON `description`). |
| **Crushon fields** | Separate editors for **Personality**, **Scenario**, **Greeting** (first message), and **Appearance** — aligned with [Crushon.ai](https://crushon.ai) and common Tavern card imports. |
| **JSON export** | **Nara bundle**: full round-trip with `extensions.nara`. **Crushon / SillyTavern**: flat card (`name`, `description`, `personality`, `scenario`, `first_mes`, `appearance`, `tags`, …) for “Create Character → upload JSON”. |
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

1. Fill **Introduction studio** (that content becomes JSON `description`).
2. Fill **Personality**, **Scenario**, **Greeting**, and **Appearance** tabs as needed.
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
