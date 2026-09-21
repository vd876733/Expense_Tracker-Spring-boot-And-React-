const fs = require('fs');
const path = require('path');

const filePath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Extract the Date Range Filter block
const startMarker = '{/* Controls Panel */}';
const endMarker = '          </div>\n        )}'; // Wait, let's find exact end
const controlsPanelRegex = /(\{\/\*\s*Controls Panel\s*\*\/\}[\s\S]*?(?:Apply\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*))/m;
const match = content.match(controlsPanelRegex);

if (!match) {
  console.log("Could not find Controls Panel block.");
  process.exit(1);
}

let dateRangeBlock = match[1];

// 2. Remove it from the dashboard tab view
// It is inside `{activeTab === 'dashboard' && (`. We can just replace it with empty string where it is right now.
content = content.replace(controlsPanelRegex, '');

// We want to add a margin bottom to the block when we reuse it
dateRangeBlock = dateRangeBlock.replace('className="bg-white dark:bg-slate-800', 'className="mb-8 bg-white dark:bg-slate-800');

// 3. Insert into Transactions Tab
// Find the start of the transactions tab
const transactionsTabStart = /\{\/\*\s*TRANSACTIONS TAB\s*\*\/\}\s*\{activeTab === 'transactions' && \(\s*<div className="space-y-8 mb-8">/;
content = content.replace(transactionsTabStart, (match) => {
  return match + '\n\n          ' + dateRangeBlock;
});

// 4. Insert into Analytics Tab
// Find the start of the analytics tab
const analyticsTabStart = /\{\/\*\s*ANALYTICS TAB\s*\*\/\}\s*\{activeTab === 'analytics' && \(\s*<div className="space-y-8 mb-8">/;
content = content.replace(analyticsTabStart, (match) => {
  return match + '\n\n          ' + dateRangeBlock;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log("Date Range block relocated successfully!");
