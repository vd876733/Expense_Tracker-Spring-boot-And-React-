const fs = require('fs');

const filePath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The Analytics Tab starts with:
//         {/* ANALYTICS TAB */}
//         {activeTab === 'analytics' && (
//           <div className="space-y-8 mb-8">
//             {/* Controls Panel */} ...

// We need to find the Stack and the ExpenseChart section and rearrange them.
const stackStartMarker = '<Stack spacing={4} sx={{ mb: 4 }}>';
const stackEndMarker = '            </Stack>';

const expenseChartSectionMarker = '            {/* Expense Chart Section */}\n        <div className="mb-8">\n          <ExpenseChart transactions={transactions} formatCurrency={formatCurrency} />\n        </div>';

// We can just extract the components based on regex.
const monthlyTotalsRegex = /\{isMonthlyTotalsLoading \? \([\s\S]*?<MonthlyCategoryDoughnut data=\{monthlyCategoryTotals\} \/>\s*\)\}/m;
const dailySpendingRegex = /\{isDailySpendingLoading \? \([\s\S]*?<DailySpendingAreaChart[\s\S]*?\/>\s*<\/div>\s*\)\}/m;

const matchMonthly = content.match(monthlyTotalsRegex);
const matchDaily = content.match(dailySpendingRegex);

if (!matchMonthly || !matchDaily) {
  console.log("Could not find Monthly or Daily charts.");
  process.exit(1);
}

const monthlyChartBlock = matchMonthly[0];
const dailyChartBlock = matchDaily[0];

// Remove the old charts from where they are
content = content.replace(monthlyTotalsRegex, '');
content = content.replace(dailySpendingRegex, '');

// Also remove the old ExpenseChart section
content = content.replace(expenseChartSectionMarker, '');

// We want to put ExpenseChart, Daily Spending, and Monthly Totals inside the Stack.
// Rebuild the Stack content
const newStackContent = `
              {/* Expense Chart Section (Category Tools & Spending Breakdown) */}
              <div className="w-full">
                <ExpenseChart transactions={transactions} formatCurrency={formatCurrency} />
              </div>

              {/* Daily Spending */}
              ${dailyChartBlock.trim()}

              {/* Monthly Category Totals */}
              ${monthlyChartBlock.trim()}
`;

// Insert the newStackContent inside the <Stack>
const emptyStackRegex = /<Stack spacing=\{4\} sx=\{\{ mb: 4 \}\}>\s*<\/Stack>/;
content = content.replace(emptyStackRegex, `<Stack spacing={4} sx={{ mb: 4 }}>${newStackContent}\n            </Stack>`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Charts reordered successfully!");
