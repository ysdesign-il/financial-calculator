# Financial Calculator Enhancements (starter integration)

This package contains a drop-in JavaScript enhancement module for the existing financial-calculator website.

## Features in this module
- Copy result text / calculator summary.
- Duplicate current form fields into a separate editable panel without overwriting the original.
- Save a calculator snapshot (inputs and detected result text) into a local saved folder.
- Load saved values into a matching active calculator form.
- Export saved snapshots as JSON.
- Browser print dialog for PDF (`Print -> Save as PDF` where supported).
- Local preferences UI for automatic/manual source selection and custom market symbols.
- Four additional calculators: loan payment, compound growth, inflation/purchasing power, and savings goal.

## Important limitations
1. This is an integration module, not a verified modification of the live GitHub repository. The GitHub connector currently rejects write operations with HTTP 403.
2. Saved data is stored in `localStorage` on the current browser/device only. It does not sync across users/devices and is not a secure cloud vault.
3. Source selection stores user preferences and emits `fcx:source-preferences-changed`. It does not create market-data provider integrations by itself. Since 13.52 the unlicensed market quote feed and the TradingView board are removed: metals come from gold-api.com (commercial use permitted) and market exchange rates from the European Central Bank. Stock indices, energy and farm commodities need a licensed data provider before they can return; show provider + timestamp + delay for each quote. Do not describe delayed data as real-time.
4. PDF export opens the native print dialog; the user chooses “Save as PDF”.
5. The module uses DOM heuristics to find the active form and result region. Integrate against the app's actual calculator components and IDs before deploying to production.
6. Financial formulas are illustrative. Validate edge cases, fees, payment timing, taxes, compounding conventions, and currency assumptions with tests before using for decisions.

## Installation
Add `enhancements.js` to the repository and include it near the end of `index.html`, before `</body>`:

```html
<script src="./enhancements.js" defer></script>
```

Test on a staging branch first. Do not overwrite the live single-file app until the integration has been reviewed.

## Source adapter integration
Listen for the preference event and route it to your real data-source layer:

```js
document.addEventListener("fcx:source-preferences-changed", (event) => {
  const preferences = event.detail;
  // TODO: connect preferences to the app's source-selection / quote-fetching code.
  // The app should fall back safely, show source + updatedAt, and disclose delays.
});
```

## Suggested next production steps
- Integrate the saved/duplicate/copy actions with the app's actual calculator state model, rather than DOM heuristics.
- Add unit tests for financial calculations and regression tests for existing calculators.
- Add provider adapters with explicit licenses and rate-limit handling.
- If saved data should sync across devices, implement authenticated backend storage and access controls.
