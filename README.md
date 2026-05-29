# Actuarialopoly

A browser-based, actuarially themed board game inspired by classic property games. Underwrite lines of business, collect premium income, pay claims, build exposure tiers, and survive stochastic industry events — all in local pass-and-play mode.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

```bash
npm run build    # production build
npm run test     # unit tests
npm run preview  # preview production build
```

## How to play

1. Choose **2–4 players** and enter names in the lobby.
2. Take turns on one device (**pass-and-play**).
3. **Roll dice** to move clockwise around the board.
4. Landing on an unowned line lets you **Underwrite** (buy) or **Pass**.
5. Landing on another player’s line requires paying **claims** (rent).
6. Own every line in a **product segment** (color group) to **build exposure** (+$50 per tier).
7. **Cede** lines to the bank (mortgage) for 50% of list price; **Recover** for 110% of ceded value.
8. **Premium Collection Day** (Go) pays $200 + $10 per fully controlled segment.
9. Card decks: **Stochastic events** (Chance) and **Industry events** (Community Chest).
10. **Regulatory Examination** (Jail): roll doubles, pay $50, or use an Actuarial Opinion card.
11. Run out of capital → **insolvency** flow: liquidate assets or declare insolvent.
12. Last solvent player wins.

## Glossary

| Term | Meaning |
|------|---------|
| Capital | Your cash balance |
| Premium Collection Day | “Go” — collect premium income when passing or landing |
| Line of business | Ownable property tile |
| Product segment | Color group; own all to build exposure |
| Exposure tier | Houses/hotels analog (0–5) |
| Claims | Rent paid to another player |
| Ceded | Property mortgaged to bank |
| Stochastic events | Chance deck |
| Industry events | Community Chest deck |
| Regulatory Examination | Jail |
| MCR hint | Educational minimum capital hint (10% of assets) |
| Adverse development | Random reserve strengthening when collecting claims |

## Tech stack

- React 19 + TypeScript + Vite
- Game logic in `src/game/` (framework-agnostic)
- Board data in `src/data/`

## License

MIT — fan/educational project; not affiliated with Hasbro or Monopoly™.
