// shipping_rates.js
export const SHIPPING = {
  // 🆓 Kostenloser Versand ab 60 €
  FREE_AB60: "shr_1Sgmrb7Vrq9QN3jU5XtgW2No",

  // 🇩🇪 Versand Deutschland (DHL)
  DE: {
    "2kg": "shr_1Sgn2D7Vrq9QN3jU2uGhJugy",   // 6,99 €
    "5kg": "shr_1Sgn347Vrq9QN3jUwQSrLE1g",   // 8,99 €
    "10kg": "shr_1Sgn3a7Vrq9QN3jU6y2hjC7w"   // 12,99 €
  },

  // 🇪🇺 Versand restliche EU (DHL)
  // ❗️OHNE Deutschland, da DE Inland ist und günstigere Preise hat
  EU: {
    "2kg": "shr_1SgogZ7Vrq9QN3jUnR0fCuQt",   // 14,99 €
    "5kg": "shr_1SgohB7Vrq9QN3jJUGmnWRmtnX", // 18,99 €
    "10kg": "shr_1Sgoi07Vrq9QN3jUWpCe3E015"  // 24,99 €
  }
};
