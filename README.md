# Currency-Exchange

An expense tracker with built-in currency conversion that allows users to manage their expenses and view their total spending in a preferred currency.

## Overview

Currency-Exchange is a web-based expense tracking application that simplifies expense management when dealing with multiple currencies. Users can add expenses in different currencies and convert them into a selected currency to view their spending in a single, consistent format.

The application combines expense management with real-time currency conversion using an external exchange rate API.

## Features

- **Add Expenses:** Add expenses with a title, amount, currency, and date.
- **View Expenses:** Display all recorded expenses in an organized list.
- **Delete Expenses:** Remove expenses that are no longer needed.
- **Currency Selection:** Choose a preferred currency for viewing converted expenses.
- **Currency Conversion:** Convert individual expenses using exchange rates retrieved from the Frankfurter API.
- **Total Expense Calculation:** Calculate and display total spending in the selected currency.
- **Input Validation:** Validate expense details before submitting them.
- **Exchange Rate Caching:** Temporarily cache exchange rates to reduce unnecessary API requests.

## Technologies Used

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS

**Backend**
- Node.js
- Express.js

**External API**
- Frankfurter API

## Supported Currencies

The application currently supports:

| Currency | Code |
|---|---|
| US Dollar | USD |
| Euro | EUR |
| Nepalese Rupee | NPR |
| Indian Rupee | INR |
| British Pound | GBP |

## Project Structure

```text
Currency-Exchange/
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── app/
│   ├── public/
│   ├── package.json
│   └── next.config.ts
│
├── .gitignore
├── package-lock.json
└── README.md
```

## Installation and Setup

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/bhumipradhan/Currency-Exchange.git
```

### 2. Navigate to the Project Directory

```bash
cd Currency-Exchange
```

### 3. Set Up the Backend

Open a terminal and run:

```bash
cd backend
npm install
npm start
```

The backend server will run at:

```text
http://localhost:5000
```

### 4. Set Up the Frontend

Open another terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

### 5. Environment Configuration (Optional)

The frontend uses the following default backend URL:

```text
http://localhost:5000
```

To use a different backend URL, create a `.env.local` file inside the frontend directory:

```env
BACKEND_URL=http://localhost:5000
```

## API Endpoints

The backend provides the following API endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/expenses` | Retrieve all expenses |
| POST | `/expenses` | Add a new expense |
| DELETE | `/expenses/:id` | Delete an expense |
| GET | `/convert` | Convert an amount between currencies |

### Currency Conversion

The application uses the [Frankfurter API](https://frankfurter.dev/) to retrieve exchange rates.

The backend handles conversion requests, validates currency codes, caches exchange rates, and calculates converted amounts.

## Data Storage

Expenses are currently stored in an in-memory array on the backend. This means expense records are temporary and will be cleared whenever the backend server restarts.

## Future Enhancements

- Implement a database for permanent expense storage.
- Add expense editing functionality.
- Introduce expense categories and monthly spending summaries.
- Add charts and visual representations of spending patterns.
- Support additional currencies.

## Author

**Bhumi Pradhan**

[GitHub Profile](https://github.com/bhumipradhan)

---

*This project was developed as a practical application of frontend and backend development concepts, API integration, and currency conversion.*
