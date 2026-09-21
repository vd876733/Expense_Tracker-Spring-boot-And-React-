const fs = require('fs');
const path = require('path');

const doughnutPath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/MonthlyCategoryDoughnut.jsx';
const areaPath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/DailySpendingAreaChart.jsx';

function modifyDoughnut() {
  let content = fs.readFileSync(doughnutPath, 'utf8');

  // Add useState, useEffect
  if (!content.includes('useState')) {
    content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';");
  }

  // Add isDarkMode hook inside component
  const hookCode = `
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDarkMode(root.classList.contains('dark'));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
`;
  if (!content.includes('setIsDarkMode')) {
    content = content.replace(/(const MonthlyCategoryDoughnut = \(\{ data = \[\] \}\) => \{)/, `$1\n${hookCode}`);
  }

  // Fix card classes
  content = content.replace(/className="card bg-white"/g, 'className="card bg-white dark:bg-slate-800 dark:border-slate-700/60"');
  content = content.replace(/className="text-xl font-bold text-gray-900 mb-2"/g, 'className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2"');
  content = content.replace(/className="text-xl font-bold text-gray-900 mb-4"/g, 'className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4"');
  content = content.replace(/className="text-gray-500"/g, 'className="text-slate-500 dark:text-slate-400"');

  // Fix Tooltip
  content = content.replace(/<Tooltip formatter=\{\(value\) => \[`\$\$\{Number\(value\)\.toFixed\(2\)\}`, 'Total'\]\} \/>/, `<Tooltip 
              formatter={(value) => [\`$\${Number(value).toFixed(2)}\`, 'Total']} 
              contentStyle={{
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
              }}
              itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
            />`);

  fs.writeFileSync(doughnutPath, content, 'utf8');
}

function modifyArea() {
  let content = fs.readFileSync(areaPath, 'utf8');

  // Fix card classes
  content = content.replace(/className="card bg-white"/g, 'className="card bg-white dark:bg-slate-800 dark:border-slate-700/60"');
  content = content.replace(/className="text-xl font-bold text-gray-900 mb-2"/g, 'className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2"');
  content = content.replace(/className="text-xl font-bold text-gray-900 mb-4"/g, 'className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4"');
  content = content.replace(/className="text-gray-500"/g, 'className="text-slate-500 dark:text-slate-400"');

  // Fix Tooltip
  content = content.replace(/<Tooltip([\s\S]*?)labelFormatter=\{formatDateLabel\}\s*\/>/, `<Tooltip$1labelFormatter={formatDateLabel}
              contentStyle={{
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
              }}
              itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
            />`);

  fs.writeFileSync(areaPath, content, 'utf8');
}

modifyDoughnut();
modifyArea();
console.log("Charts updated for dark mode!");
