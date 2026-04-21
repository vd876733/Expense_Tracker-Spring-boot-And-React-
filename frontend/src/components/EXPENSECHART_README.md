# ExpenseChart Component Documentation

## Overview

The `ExpenseChart` component is a React component that visualizes spending distribution across different transaction categories using **Recharts**. It displays data in both a pie chart and a detailed breakdown table.

## Installation

Make sure Recharts is installed in your project:

```bash
npm install recharts
```

## Props

### `transactions` (Array, optional)
An array of transaction objects to visualize.

**Default**: `[]` (empty array)

**Object Structure**:
```javascript
{
  id: number,
  description: string,
  amount: number,
  category: string,
  date: string (YYYY-MM-DD format)
}
```

**Example**:
```javascript
const transactions = [
  {
    id: 1,
    description: 'Grocery shopping',
    amount: 50.00,
    category: 'Food',
    date: '2026-04-10'
  },
  {
    id: 2,
    description: 'Gas',
    amount: 45.00,
    category: 'Transport',
    date: '2026-04-09'
  }
];

<ExpenseChart transactions={transactions} />
```

## Features

### 1. **Pie Chart Visualization**
- Shows spending distribution by category as pie slices
- Each slice is labeled with its percentage
- Color-coded by category for easy identification
- Responsive and scales to container size

### 2. **Custom Tooltip**
- Hover over pie slices to see detailed information
- Displays category name and exact amount
- Styled with Tailwind CSS for consistency

### 3. **Legend**
- Shows all categories with their total amounts
- Positioned at the bottom for easy reference
- Color-matched to pie slices

### 4. **Category Breakdown Table**
- Detailed breakdown of spending by category
- Columns: Category, Amount, Percentage
- Sorted by amount (highest to lowest)
- Hover effects for better UX
- Color indicator matching the pie chart

### 5. **Empty State**
- Gracefully handles empty transaction arrays
- Displays "No transactions to display" message

## Color Scheme

Default category colors:

| Category | Color |
|----------|-------|
| Food | #FF6384 (Red) |
| Transport | #36A2EB (Blue) |
| Entertainment | #FFCE56 (Yellow) |
| Utilities | #4BC0C0 (Cyan) |
| Shopping | #9966FF (Purple) |
| Healthcare | #FF9F40 (Orange) |
| Other | #C9CBCF (Gray) |

## Usage Examples

### Basic Usage
```javascript
import ExpenseChart from './components/ExpenseChart';

function App() {
  const transactions = [
    { id: 1, description: 'Groceries', amount: 50, category: 'Food', date: '2026-04-10' },
    { id: 2, description: 'Gas', amount: 45, category: 'Transport', date: '2026-04-09' },
  ];

  return <ExpenseChart transactions={transactions} />;
}
```

### With API Data
```javascript
import { useState, useEffect } from 'react';
import { getTransactions } from './services/api';
import ExpenseChart from './components/ExpenseChart';

function Dashboard() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    getTransactions().then(data => setTransactions(data));
  }, []);

  return <ExpenseChart transactions={transactions} />;
}
```

### Filtering Transactions
```javascript
// Show only this month's expenses
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

const thisMonthTransactions = transactions.filter(tx => {
  const txDate = new Date(tx.date);
  return txDate.getMonth() === currentMonth && 
         txDate.getFullYear() === currentYear;
});

<ExpenseChart transactions={thisMonthTransactions} />
```

### By Category Filter
```javascript
// Show only food expenses
const foodExpenses = transactions.filter(tx => tx.category === 'Food');

<ExpenseChart transactions={foodExpenses} />
```

## Data Processing

The component automatically:

1. **Groups transactions by category** - Combines all transactions with the same category
2. **Sums amounts** - Calculates total spending per category
3. **Sorts data** - Orders categories by amount (highest to lowest) in the breakdown
4. **Formats values** - Rounds to 2 decimal places for currency display
5. **Calculates percentages** - Determines each category's share of total spending

### Example Processing:

**Input:**
```javascript
[
  { amount: 50, category: 'Food' },
  { amount: 35, category: 'Food' },
  { amount: 45, category: 'Transport' }
]
```

**Output (Grouped & Summed):**
```javascript
[
  { name: 'Food', value: 85 },          // 50 + 35
  { name: 'Transport', value: 45 }
]
```

## Responsive Design

The component is fully responsive:
- **Desktop**: Full-width pie chart with legend below
- **Tablet**: Scales chart appropriately with adjusted margins
- **Mobile**: Stacks elements and maintains readability

All styling uses Tailwind CSS for consistency.

## Performance

The component uses `useMemo` to optimize data grouping:
- Recalculates only when `transactions` prop changes
- Prevents unnecessary re-renders
- Efficient for large transaction lists (100+ items)

## Integration with Dashboard

The `ExpenseChart` is integrated into the main Dashboard component:

```javascript
// In Dashboard.jsx
import ExpenseChart from './ExpenseChart';

// Inside the Dashboard component
<ExpenseChart transactions={transactions} />
```

The chart automatically updates when new transactions are added or deleted.

## Styling

The component uses:
- **Tailwind CSS** for card and table styling
- **Recharts** built-in styling for the pie chart
- Custom color scheme for category identification
- Responsive margins and spacing

## Accessibility

- Clear labels for all data points
- Color-coded for visual differentiation
- High contrast for readability
- Keyboard accessible legend and tooltip information

## Known Limitations

1. Works best with 2-7 categories (pie charts become crowded with many categories)
2. Requires non-zero amounts for meaningful visualization
3. Unknown or missing categories are grouped as 'Other'

## Troubleshooting

### Chart not displaying
- Verify transactions array is being passed as prop
- Check that transaction objects have required fields (amount, category)
- Ensure Recharts is properly installed: `npm list recharts`

### Colors not showing correctly
- Check browser cache and reload
- Verify Tailwind CSS is compiled
- See color scheme table above for expected colors

### Data not updating
- Confirm component is re-rendering when transactions change
- Check that new transactions are being added to the state
- Verify the API is returning data correctly

## See Also

- [Dashboard Component Documentation](./Dashboard.jsx)
- [API Service Documentation](../services/api.js)
- [Recharts Documentation](https://recharts.org/)
