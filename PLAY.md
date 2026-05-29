# How to play Actuarialopoly

This guide is for **players** who want to run the game from the GitHub repository. You do **not** need Node.js, npm, or any install step if you use the hosted version.

---

## Option 1: Play in your browser (recommended)

After the game is merged to `main` and GitHub Pages is enabled, open:

**https://crosby0821.github.io/cursor-test/**

### Requirements

- A modern browser (Chrome, Firefox, Safari, or Edge)
- One phone, tablet, or computer shared by all players (**pass-and-play**)
- An internet connection to load the page the first time (the game then runs locally in the browser)

### First-time setup for repo owners

If you maintain the repository and the link above does not work yet:

1. Merge the latest game code into the **`main`** branch.
2. In GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` (or re-run the **CI** workflow). The deploy job builds the site and publishes the `dist/` folder automatically.

The live URL follows this pattern:

```
https://<github-username>.github.io/<repository-name>/
```

For this repo: `https://crosby0821.github.io/cursor-test/`

---

## Option 2: Download and open locally (no Node.js)

If you prefer to run a copy on your own machine without Node.js:

1. On GitHub, open the repository and go to **Actions**.
2. Open the latest successful **CI** run on `main` and download the **Pages artifact** (if available), **or** ask someone with Node.js to run `npm run build` and send you the `dist/` folder.
3. Serve the `dist/` folder with any simple static file server.

**Do not** double-click `index.html` — most browsers block the game when opened as a `file://` URL. Use a local server instead.

### Examples (pick one)

**Python 3** (often pre-installed on Mac/Linux):

```bash
cd dist
python3 -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

**PHP**:

```bash
cd dist
php -S localhost:8080
```

Then open **http://localhost:8080**.

---

## Option 3: Run from source (developers only)

Use this only if you are modifying the code or building yourself.

```bash
git clone https://github.com/crosby0821/cursor-test.git
cd cursor-test
npm install
npm run dev
```

Open the URL shown in the terminal (usually **http://localhost:5173**).

This path **requires Node.js** (v18 or newer recommended) and npm.

---

## Starting a game

1. Open the game URL (hosted or local).
2. Choose **2–4 players** and enter names.
3. Optionally toggle **Reserve Release Pool payout** (taxes collected go to the player who lands on that space).
4. Click **Begin underwriting**.
5. Pass the device to the current actuary when the panel says **Pass device to …**

---

## Turn basics

| Action | When |
|--------|------|
| **Roll dice** | Start of your turn (or roll for doubles while in Regulatory Examination) |
| **Underwrite / Pass** | You land on an unowned line |
| **Pay claims** | You land on another player’s line |
| **Resolve card** | You draw a Stochastic or Industry event |
| **+Exposure / Cede / Recover** | Manage your lines between rolls (when the panel allows it) |
| **End turn** | After a non-doubles roll when no other action is pending |

Full rules and terminology are in the [README glossary](README.md#glossary).

---

## Tips for pass-and-play

- **One device** — everyone shares the same screen; hand off when the turn changes.
- **Portrait phones** — rotate to landscape for a clearer board if the layout feels tight.
- **New session** — after someone wins, use **New session** on the winner banner to return to the lobby.
- **No account** — nothing is saved to the cloud; refreshing the page starts over unless you bookmark mid-game (not recommended).

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| Page is blank or 404 | Confirm GitHub Pages is enabled and the latest `main` deploy succeeded under **Actions**. |
| Game does not load from a downloaded folder | Serve `dist/` with a local HTTP server (see Option 2); do not open `index.html` directly. |
| Buttons missing | Wait until it is that player’s turn; some actions only appear in the correct phase. |
| “Cannot pay” / insolvency | Liquidate lines from **Your lines**, then **Try pay again** (one restructure attempt per player per game). |

---

## Privacy and data

Actuarialopoly runs entirely in your browser. No gameplay data is sent to a server. The game does not use cookies or accounts for play.

---

## License

MIT — fan/educational project; not affiliated with Hasbro or Monopoly™.
