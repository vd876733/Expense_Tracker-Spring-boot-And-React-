const fs = require('fs');
const filePath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const block1Start = content.indexOf('{/* Hidden charts moved from Dashboard strict view */}');
const block1End = content.indexOf('</div>', content.indexOf('</Stack>', block1Start)) + 6;
let block1 = content.substring(block1Start, block1End);
content = content.slice(0, block1Start) + content.slice(block1End);

const smartInsightsStart = content.indexOf('<Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }} className="dark:bg-slate-800 dark:text-white">');
const smartInsightsEnd = content.indexOf('</Paper>', smartInsightsStart) + 8;
const smartInsights = content.substring(smartInsightsStart, smartInsightsEnd);

const expenseChartStart = content.indexOf('{/* Expense Chart Section */}');
const expenseChartEnd = content.indexOf('</div>', expenseChartStart) + 6;
const expenseChart = content.substring(expenseChartStart, expenseChartEnd);

const block2WrapperStart = content.indexOf('{/* Components for Analytics Tab */}');
const block2WrapperEnd = content.indexOf('</div>', expenseChartEnd) + 6;
if (block2WrapperStart !== -1) {
  content = content.slice(0, block2WrapperStart) + content.slice(block2WrapperEnd);
} else {
  // If we can't find the wrapper easily, just remove the two inner blocks.
  content = content.replace(smartInsights, '');
  content = content.replace(expenseChart, '');
}

const stackStart = block1.indexOf('<Stack');
const stackEnd = block1.indexOf('</Stack>') + 8;
const stackContent = block1.substring(stackStart, stackEnd);

const newAnalyticsTab = `
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 mb-8">
            ${stackContent}

            ${expenseChart}

            ${smartInsights}
          </div>
        )}
`;

const transactionsTarget = "{activeTab === 'transactions' && (";
const transactionsIndex = content.indexOf(transactionsTarget);
let nextClose = content.indexOf(')}', transactionsIndex);

// Sometimes there are nested closures, but since it's just <div ...> ... </div>)} we can look for the closing div
const searchStr = '</div>\\n        )}';
let tEnd = content.indexOf(searchStr, transactionsIndex);
if (tEnd !== -1) {
  tEnd += searchStr.length;
} else {
  // Fallback to the first )} after some text
  tEnd = nextClose + 2;
}

content = content.slice(0, tEnd) + '\\n' + newAnalyticsTab + content.slice(tEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Analytics tab wired up successfully.");
