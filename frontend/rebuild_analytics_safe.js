const fs = require('fs');

const filePath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The Analytics Tab starts with:
const analyticsStartMarker = '        {/* ANALYTICS TAB */}';
const analyticsEndMarker = '        {/* BUDGETS TAB */}';

const startIndex = content.indexOf(analyticsStartMarker);
const endIndex = content.indexOf(analyticsEndMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find Analytics tab boundaries.");
  process.exit(1);
}

const beforeAnalytics = content.substring(0, startIndex);
let analyticsTab = content.substring(startIndex, endIndex);
const afterAnalytics = content.substring(endIndex);

// Find controls panel
const controlsPanelRegex = /(\{\/\*\s*Controls Panel\s*\*\/\}[\s\S]*?(?:Apply\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*))/;
const controlsMatch = analyticsTab.match(controlsPanelRegex);
const controlsBlock = controlsMatch ? controlsMatch[0] : '';

// Find expense chart section
const expenseRegex = /(\{\/\*\s*Expense Chart Section\s*\*\/\}[\s\S]*?<ExpenseChart transactions=\{transactions\} formatCurrency=\{formatCurrency\} \/>\s*<\/div>)/;
const expenseMatch = analyticsTab.match(expenseRegex);
const expenseBlock = expenseMatch ? expenseMatch[0] : '';

// Find daily spending block
const dailyRegex = /(\{isDailySpendingLoading \? \([\s\S]*?<DailySpendingAreaChart[\s\S]*?\/>\s*<\/div>\s*\)\})/;
const dailyMatch = analyticsTab.match(dailyRegex);
const dailyBlock = dailyMatch ? dailyMatch[0] : '';

// Find monthly totals block
const monthlyRegex = /(\{isMonthlyTotalsLoading \? \([\s\S]*?<MonthlyCategoryDoughnut data=\{monthlyCategoryTotals\} \/>\s*\)\})/;
const monthlyMatch = analyticsTab.match(monthlyRegex);
const monthlyBlock = monthlyMatch ? monthlyMatch[0] : '';

// Find smart insights block
const insightsRegex = /(<Paper elevation=\{3\} sx=\{\{ p: 3, mb: 4, borderRadius: 3 \}\}[\s\S]*?<\/Paper>)/;
const insightsMatch = analyticsTab.match(insightsRegex);
const insightsBlock = insightsMatch ? insightsMatch[0] : '';

const headerMatch = analyticsTab.match(/(\s*\{activeTab === 'analytics' && \(\s*<div className="space-y-8 mb-8">)/);
const header = headerMatch ? headerMatch[0] : '';

const footerMatch = analyticsTab.match(/(\s*<\/div>\s*\)\}\s*)/);
const footer = footerMatch ? footerMatch[0] : '\n          </div>\n        )}\n\n';

if (!header || !controlsBlock || !expenseBlock || !dailyBlock || !monthlyBlock || !insightsBlock) {
  console.log("Missing a block!");
  process.exit(1);
}

const newAnalyticsTab = `${analyticsStartMarker}${header}
${controlsBlock}

            <Stack spacing={4} sx={{ mb: 4 }}>
              {/* Expense Chart Section (Category Tools & Spending Breakdown) */}
              <div className="w-full">
                <ExpenseChart transactions={transactions} formatCurrency={formatCurrency} />
              </div>

              {/* Daily Spending */}
              ${dailyBlock.trim()}

              {/* Monthly Category Totals */}
              ${monthlyBlock.trim()}
            </Stack>

            ${insightsBlock}
${footer}`;

content = beforeAnalytics + newAnalyticsTab + afterAnalytics;

fs.writeFileSync(filePath, content, 'utf8');
console.log("Analytics tab properly rebuilt!");
