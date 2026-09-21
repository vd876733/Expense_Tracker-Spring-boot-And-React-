const fs = require('fs');
const files = [
  'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx',
  'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/CsvImport.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // For Dashboard.jsx and CsvImport.jsx
    // We want to replace specific card combinations:
    // "card bg-white" -> "card bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100"
    // And for the new placeholder tabs which already had "bg-white dark:bg-slate-800":
    // "bg-white dark:bg-slate-800 " -> "bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 "

    content = content.replace(/className="card bg-white([^"]*)"/g, (match, p1) => {
        // If it already contains the target string, ignore
        if (p1.includes('dark:bg-slate-800/90')) return match;
        // Clean up any old simple dark mode from the capture group
        let cleanedP1 = p1.replace(/dark:bg-slate-800/g, '').replace(/dark:text-white/g, '');
        return `className="card bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100${cleanedP1}"`;
    });

    content = content.replace(/className="bg-white dark:bg-slate-800([^"]*)"/g, (match, p1) => {
        if (p1.includes('dark:bg-slate-800/90')) return match;
        return `className="bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100${p1}"`;
    });

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
  }
});
