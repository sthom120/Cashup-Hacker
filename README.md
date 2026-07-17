# Cash-up Hacker

A mobile-first React application that guides retail staff through end-of-day cash-up, rebuilds a target till float, calculates takings, and provides clear Change Bag instructions.

Cash-up Hacker was designed around a real retail workflow where staff need to handle money accurately without performing complex denomination calculations under time pressure.

<!-- Add your live Vercel URL here after deployment. -->
<!-- Example: [View the live application](https://your-project.vercel.app) -->

## Project overview

Cash-up can become confusing when the total value is correct but the till contains the wrong mix of notes and coins. Cash-up Hacker compares the counted till against a configurable target Float and turns the result into a guided sequence of physical money movements.

The application helps staff:

- count each Australian note and coin denomination;
- compare the Till with the target Float;
- identify extras, shortages and correct denominations;
- move excess money into Takings;
- calculate a safe Change Bag exchange;
- confirm that the final Float and Takings balance;
- recover an unfinished cash-up after closing or refreshing the app.

## Key features

### Guided cash-up workflow

The interface separates the process into clear steps:

1. Count the Till
2. Check what needs adjusting
3. Move extras into Takings
4. Rebuild the Float using the Change Bag
5. Complete a final balance check

### Denomination-based calculations

The application calculates values in cents to avoid floating-point currency errors. It tracks each denomination separately rather than working only with overall totals.

### Configurable Float targets

Staff can update how many of each denomination should remain in the Float. Settings are saved locally on the device and can be restored to the Amazen default.

### Change Bag planning

The calculation engine:

- identifies the denominations missing from the Float;
- finds suitable extra notes and coins to deposit;
- calculates the required withdrawal;
- separates withdrawn money between the Float and Takings;
- stops and provides manual-help guidance if it cannot produce a safe plan.

### Progress recovery

An unfinished cash-up is saved automatically using browser storage. When the app is reopened, staff can continue where they left off or start a fresh cash-up.

### Offline PWA support

Cash-up Hacker is configured as a Progressive Web App. Once installed or cached, the application can continue working without an internet connection.

### Accessibility and responsive design

The interface includes:

- keyboard-friendly controls;
- associated labels and descriptions for screen readers;
- large touch targets;
- clear focus indicators;
- reduced-motion support;
- responsive layouts for mobile, tablet and desktop;
- status information communicated through text and structure, not colour alone.

## Example calculation

For a Till total of **$587.85** and a target Float of **$450.00**:

```text
Original Till: $587.85
Final Float:   $450.00
Takings:       $137.85
```

The application also identifies the exact notes and coins that need to move between the Till, Takings and Change Bag.

## Technology

- React
- JavaScript
- Vite
- CSS
- Vitest
- Local Storage
- Vite PWA Plugin
- Workbox
- Vercel

## Project structure

```text
src/
├── components/
│   ├── ComparisonSection.jsx
│   ├── DenominationRow.jsx
│   ├── FloatTargetRow.jsx
│   ├── MoneyMoveList.jsx
│   └── QuantityList.jsx
├── data/
│   ├── denominations.js
│   └── floatTargets.js
├── utils/
│   ├── cashCalculations.js
│   ├── cashCalculations.test.js
│   ├── cashUpProgressStorage.js
│   ├── countValidation.js
│   ├── countValidation.test.js
│   └── floatTargetStorage.js
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

## Running the project locally

### Prerequisites

Install a current LTS version of Node.js and npm.

### Installation

```bash
git clone https://github.com/sthom120/Cashup-Hacker.git
cd Cashup-Hacker
git checkout react-rebuild
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local address shown in the terminal.

## Testing and quality checks

Run the unit tests once:

```bash
npm test -- --run
```

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Testing approach

Unit tests cover core calculation and validation behaviour, including:

- Till and Float totals;
- extras and shortages;
- expected Takings;
- denomination breakdowns;
- Change Bag planning;
- invalid and extreme count input;
- maximum and minimum count limits;
- edge cases where an automatic exchange cannot be completed safely.

Manual testing has also focused on:

- complete keyboard navigation;
- mobile responsiveness;
- cash-up recovery after refresh;
- exact-Float and below-target scenarios;
- PWA installation and offline behaviour.

## Design decisions

### Currency is stored in cents

All monetary calculations use whole-number cents. This avoids common floating-point errors such as inaccurate decimal totals.

### One task at a time

Cash-up is a physical process. The interface deliberately presents one clear action at a time rather than showing a dense dashboard.

### Plain-language instructions

The application uses familiar retail terms such as **Till**, **Float**, **Takings** and **Change Bag**, while explaining what staff need to do in direct language.

### Safety over automation

If the application cannot calculate a trustworthy Change Bag plan, it stops and asks for a manual check rather than presenting an estimated instruction.

## What I learned

This project strengthened my experience with:

- rebuilding an existing application in React;
- translating a real workplace process into application logic;
- separating UI components, data and calculation utilities;
- handling currency safely;
- designing mobile-first workflows;
- writing unit tests for business rules and edge cases;
- local persistence and recovery;
- PWA configuration and offline support;
- accessibility improvements for forms and interactive controls;
- iterative development using Git branches and sprint planning.

## Future improvements

Potential future work includes:

- optional Change Bag inventory tracking;
- printable or downloadable cash-up summaries;
- cash-up history and audit records;
- manager approval for manual exceptions;
- multiple saved Float profiles;
- automated accessibility testing;
- component and end-to-end testing.

## Project status

The React rebuild is feature complete for its current workflow and is undergoing production deployment and real-device testing.

The original implementation remains in the repository history, while the modern React version was developed on the `react-rebuild` branch.

## Author

**Sarah Thomson**

Career-transitioning front-end developer with a background in education, communication and retail operations.

- GitHub: [sthom120](https://github.com/sthom120)

## Licence

This project is currently provided for portfolio and demonstration purposes.

Before adding an open-source licence, confirm that you are comfortable allowing other people to copy, modify and redistribute the code.
