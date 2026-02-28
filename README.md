# BarberPro

Next.js 14 (App Router) barber shop app with dashboard, queue, schedule, messages, and CRM.

## Demo setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Run the dev server**:
   ```bash
   npm run dev
   ```

3. **Open in the browser**:
   - App: [http://localhost:3000](http://localhost:3000)
   - Customers (CRM): [http://localhost:3000/customers](http://localhost:3000/customers)

If port 3000 is in use, Next.js will use 3001, 3002, etc.—check the terminal for the actual URL.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | Run ESLint               |

## CRM

- **Customers** list: search by name, phone, or email; add customer; click row for detail.
- **Customer detail**: name, phone, email, visits count, notes (editable), visit history.
- **Add/Edit customer**: required fields + email validation and uniqueness.
- **Record visit**: adds to history and updates visit count.
- Data is stored in the browser (localStorage) for the demo; ready to swap to a real DB later.
