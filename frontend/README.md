# Personal Finance Tracker - React Frontend

A modern React frontend for the Personal Finance Tracker application.

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies** (includes Tailwind CSS):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

The React app will start on `http://localhost:3000`

### Tailwind CSS Setup

Tailwind CSS is already configured in this project with:
- `tailwind.config.js` - Tailwind configuration with custom colors
- `postcss.config.js` - PostCSS configuration
- `src/index.css` - Tailwind directives and custom components

## File Structure

```
frontend/
├── src/
│   ├── services/
│   │   ├── api.js              # API service with axios instance
│   │   └── api.examples.js     # Usage examples
│   ├── components/
│   │   ├── Dashboard.jsx       # Main finance dashboard (Tailwind CSS)
│   │   ├── Card.jsx            # Reusable card component
│   │   ├── ExpenseChart.jsx    # Pie chart visualization (Recharts)
│   │   ├── ExpenseChart.examples.jsx  # Usage examples
│   │   └── EXPENSECHART_README.md     # Component documentation
│   ├── App.js                  # Main app component
│   ├── App.css                 # Legacy CSS (optional)
│   ├── index.js                # React entry point
│   └── index.css               # Tailwind CSS imports
├── public/
│   └── index.html              # HTML template
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── package.json
└── README.md
```

## Running the Application

```bash
npm start
```

The React app will start on `http://localhost:3000` and is configured to communicate with the Spring Boot backend using `VITE_API_BASE_URL` (fallbacks to local defaults).

## Components

### Dashboard Component
A comprehensive finance dashboard with:
- **Summary Cards**: Display total balance, transaction count, and average spend
- **Add Transaction Form**: Simple form to add new transactions with validation
- **Transactions Table**: Displays all transactions with date, description, category, and amount
- **Delete Functionality**: Remove transactions with a single click
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Error Handling**: User-friendly error messages for API failures
- **Expense Chart Integration**: Visual representation of spending by category

### Card Component
A reusable card component for displaying summary information with:
- Customizable title and value
- Optional subtitle and emoji icons
- Gradient background support
- Responsive layout

### ExpenseChart Component
A Recharts-based visualization component featuring:
- **Pie Chart**: Visual distribution of spending by category
- **Custom Tooltip**: Detailed information on hover
- **Legend**: Category names and totals
- **Category Breakdown Table**: Detailed spending breakdown sorted by amount
- **Data Grouping**: Automatically groups transactions by category and sums amounts
- **Responsive**: Scales beautifully across all screen sizes
- **Empty State Handling**: Gracefully handles arrays with no transactions

For detailed documentation, see [EXPENSECHART_README.md](src/components/EXPENSECHART_README.md)

## API Service Functions

The `api.js` service provides the following functions:

### Transaction Management

- **`getTransactions()`** - Fetch all transactions
  ```javascript
  const transactions = await getTransactions();
  ```

- **`getTransactionById(id)`** - Fetch a specific transaction
  ```javascript
  const transaction = await getTransactionById(1);
  ```

- **`addTransaction(data)`** - Create a new transaction
  ```javascript
  const newTx = await addTransaction({
    description: 'Grocery shopping',
    amount: 50.00,
    date: '2026-04-11',
    category: 'Food'
  });
  ```

- **`updateTransaction(id, data)`** - Update an existing transaction
  ```javascript
  const updated = await updateTransaction(1, {
    description: 'Updated description',
    amount: 60.00,
    date: '2026-04-11',
    category: 'Food'
  });
  ```

- **`deleteTransaction(id)`** - Delete a transaction
  ```javascript
  await deleteTransaction(1);
  ```

### Summary Functions

- **`getTotalSum()`** - Get total sum of all transactions
  ```javascript
  const total = await getTotalSum();
  ```

- **`getTotalSumByCategory(category)`** - Get total sum for a category
  ```javascript
  const categoryTotal = await getTotalSumByCategory('Food');
  ```

## Error Handling

The API service includes built-in error handling. All functions throw errors that can be caught in try-catch blocks:

```javascript
try {
  const transactions = await getTransactions();
} catch (error) {
  console.error('Failed to fetch transactions:', error);
}
```

## CORS Configuration

The backend is configured to accept requests from `http://localhost:3000`. Make sure both the backend and frontend are running on the correct ports.

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not reversible)

## Connecting Components

See `api.examples.js` for complete examples of:
- Fetching and displaying transactions in a component
- Creating a form to add new transactions
- Using hooks with the API service

## Tips

1. **Store API responses in state**: Use `useState` to store fetched data
2. **Fetch on mount**: Use `useEffect` to fetch data when component mounts
3. **Handle loading states**: Display loading indicators while data is being fetched
4. **Error management**: Always wrap API calls in try-catch blocks
5. **Form validation**: Validate user input before sending to the backend

## Next Steps

1. Create components for displaying transactions
2. Build a form component for adding transactions
3. Implement filtering and sorting
4. Add charts/visualizations for financial data
5. Implement user authentication
