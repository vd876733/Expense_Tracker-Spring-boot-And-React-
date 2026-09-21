const fs = require('fs');

const filePath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The Analytics Tab starts with:
const analyticsMarker = '        {/* ANALYTICS TAB */}';
const parts = content.split(analyticsMarker);

if (parts.length < 2) {
  console.log("Could not find Analytics tab.");
  process.exit(1);
}

let analyticsTab = parts[1];

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

// The outer wrapper of the analytics tab is:
//         {activeTab === 'analytics' && (
//           <div className="space-y-8 mb-8">
// Let's rebuild the inside.
const headerMatch = analyticsTab.match(/(\s*\{activeTab === 'analytics' && \(\s*<div className="space-y-8 mb-8">)/);

if (!headerMatch || !controlsBlock || !expenseBlock || !dailyBlock || !monthlyBlock || !insightsBlock) {
  console.log("Missing a block!");
  console.log({
    controls: !!controlsBlock,
    expense: !!expenseBlock,
    daily: !!dailyBlock,
    monthly: !!monthlyBlock,
    insights: !!insightsBlock
  });
  process.exit(1);
}

const header = headerMatch[0];

// Find where the analytics tab ends
const footerMatch = analyticsTab.match(/(\s*<\/div>\s*\)\})/);
const footer = footerMatch ? footerMatch[0] : '\n          </div>\n        )}';

const newAnalyticsTab = `${header}
${controlsBlock}

            <Stack spacing={4} sx={{ mb: 4 }}>
${expenseBlock}

${dailyBlock}

${monthlyBlock}
            </Stack>

            ${insightsBlock}
${footer}
`;

content = parts[0] + analyticsMarker + newAnalyticsTab;

fs.writeFileSync(filePath, content, 'utf8');
console.log("Analytics tab rebuilt successfully!");
