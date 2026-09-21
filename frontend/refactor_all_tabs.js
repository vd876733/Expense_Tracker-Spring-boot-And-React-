const fs = require('fs');
const filePath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. DASHBOARD TAB
// Starts at Greeting row (line 1002 approx)
const dashboardStart = content.indexOf('{/* Greeting & Action Buttons Row */}');

// The Dashboard Tab ends after Recent Activity
const recentActivityEnd = content.indexOf('</Paper>', content.indexOf('Recent Activity')) + 8;

// But wait, MonthlyCategoryDoughnut and DailySpendingAreaChart are inside the Stack BEFORE Recent Activity!
// So we extract them, and remove them from the Dashboard block.
const doughnutStart = content.indexOf('{isMonthlyTotalsLoading ? (');
// It ends at DailySpendingAreaChart closing
const dailySpendingEnd = content.indexOf(')}', content.indexOf('<DailySpendingAreaChart')) + 2;

const doughnutAndDaily = content.substring(doughnutStart, dailySpendingEnd);

// Let's create the Dashboard Tab string
// It goes from dashboardStart to recentActivityEnd, MINUS the doughnutAndDaily string.
let dashboardBlock = content.substring(dashboardStart, recentActivityEnd);
dashboardBlock = dashboardBlock.replace(doughnutAndDaily, '');

// Wrap the dashboard block
const wrappedDashboard = `
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 mb-8">
            ${dashboardBlock.trim()}
          </div>
        )}
`;


// 2. TRANSACTIONS TAB
const filterStart = content.indexOf('{/* Filter Section */}');
// Action buttons:
const actionButtonsStart = content.indexOf('<div className="flex justify-center gap-4 mb-8">');
// Transactions Table:
const transactionsTableStart = content.indexOf('<div className="grid grid-cols-1 gap-8">');
const transactionsTableEnd = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</table', transactionsTableStart) + 8) + 6) + 6;
// Wait, the grid grid-cols-1 gap-8 has 3 closing divs. 
// table closing is </table>. Then </div> for table container, </div> for card, </div> for lg:col-span-2, </div> for grid.
const tableBlockEnd = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</table>', transactionsTableStart)) + 6) + 6) + 6) + 6;
const transactionsTable = content.substring(transactionsTableStart, tableBlockEnd);

const filterSection = content.substring(filterStart, actionButtonsStart);

const actionButtonsEnd = content.indexOf('</div>', actionButtonsStart) + 6;
const actionButtons = content.substring(actionButtonsStart, actionButtonsEnd);

const csvStart = content.indexOf('{/* CSV Import Section */}');
const csvEnd = content.indexOf('</div>', csvStart) + 6;
const csvImport = content.substring(csvStart, csvEnd);

const wrappedTransactions = `
        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-8 mb-8">
            ${filterSection.trim()}
            
            ${actionButtons.trim()}
            
            ${csvImport.trim()}
            
            ${transactionsTable.trim()}
          </div>
        )}
`;

// 3. ANALYTICS TAB
const oldSmartInsightsStart = content.indexOf('<Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }} className="dark:bg-slate-800 dark:text-white">');
const oldSmartInsightsEnd = content.indexOf('</Paper>', oldSmartInsightsStart) + 8;
const oldSmartInsights = content.substring(oldSmartInsightsStart, oldSmartInsightsEnd);

const expenseChartStart = content.indexOf('{/* Expense Chart Section */}');
const expenseChartEnd = content.indexOf('</div>', expenseChartStart) + 6;
const expenseChart = content.substring(expenseChartStart, expenseChartEnd);

const wrappedAnalytics = `
        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 mb-8">
            <Stack spacing={4} sx={{ mb: 4 }}>
              ${doughnutAndDaily.trim()}
            </Stack>

            ${expenseChart.trim()}

            ${oldSmartInsights.trim()}
          </div>
        )}
`;

// Now we need to replace the entire chunk in the original file, from dashboardStart to expenseChartEnd (the last component).
// Wait, is ExpenseChart the last component? 
// Yes, right after ExpenseChart is {/* Add Transaction Modal */}
const addTransactionModalStart = content.indexOf('{/* Add Transaction Modal */}');

// We remove everything from dashboardStart to addTransactionModalStart.
// Except the stack close! Wait, in the dashboard block, we grabbed up to recentActivityEnd which is </Paper>.
// The original file has </Stack> after that. We need to preserve or remove it.
// Actually, it's easier to just rebuild the whole middle section.

const originalMiddleSection = content.substring(dashboardStart, addTransactionModalStart);

const newMiddleSection = `
${wrappedDashboard}

${wrappedTransactions}

${wrappedAnalytics}
`;

content = content.substring(0, dashboardStart) + newMiddleSection + content.substring(addTransactionModalStart);

fs.writeFileSync(filePath, content, 'utf8');
console.log("All tabs wired up successfully!");
