const fs = require('fs');

const filePath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The section we want to replace starts at {/* Filter Section */} and ends before {/* Add Transaction Modal */}
const startMarker = '{/* Filter Section */}';
const endMarker = '{/* Add Transaction Modal */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const originalSection = content.substring(startIndex, endIndex);

// We need to extract the sub-blocks from originalSection.
// 1. Filter Section
const filterStart = originalSection.indexOf('{/* Filter Section */}');
const actionStart = originalSection.indexOf('<div className="flex justify-center gap-4 mb-8">');
const smartInsightsStart = originalSection.indexOf('<Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}');
const tableStart = originalSection.indexOf('<div className="grid grid-cols-1 gap-8">');
const csvStart = originalSection.indexOf('{/* CSV Import Section */}');
const expenseChartStart = originalSection.indexOf('{/* Expense Chart Section */}');

const filterSection = originalSection.substring(filterStart, actionStart);
const actionSection = originalSection.substring(actionStart, smartInsightsStart);
const smartInsightsSection = originalSection.substring(smartInsightsStart, tableStart);
const tableSection = originalSection.substring(tableStart, csvStart);
const csvSection = originalSection.substring(csvStart, expenseChartStart);
const expenseChartSection = originalSection.substring(expenseChartStart);

// Now construct the new section
const newSection = `
        {activeTab === 'transactions' && (
          <div className="space-y-8 mb-8">
            ${filterSection.trim()}
            
            ${actionSection.trim()}
            
            ${csvSection.trim()}
            
            ${tableSection.trim()}
          </div>
        )}

        {/* Components for Analytics Tab */}
        <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
          ${smartInsightsSection.trim()}
          ${expenseChartSection.trim()}
        </div>

        `;

content = content.substring(0, startIndex) + newSection + content.substring(endIndex);

fs.writeFileSync(filePath, content, 'utf8');
console.log("File updated successfully");
