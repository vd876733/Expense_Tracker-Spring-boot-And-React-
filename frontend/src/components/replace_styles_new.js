const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'DashboardNew.jsx');
if (!fs.existsSync(file)) return;
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('CursorGrid')) {
  content = content.replace(
    "import ThemeToggle from './ThemeToggle';",
    "import ThemeToggle from './ThemeToggle';\nimport CursorGrid from './CursorGrid/CursorGrid';"
  );
}

// 2. Change main layout
const mainWrapperOld = '<div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">';
const mainWrapperNew = `<div className="relative flex h-screen overflow-hidden bg-slate-900 text-slate-100 transition-colors duration-200">
      <div className="fixed inset-0 z-0">
        <CursorGrid 
          cellSize={24} 
          cellRadius={3} 
          color="#3b82f6" 
          radius={140} 
          fillOpacity={1} 
          maxOpacity={0.8}
          // Custom user props mapped to CursorGrid or just passed along:
          dotSize={3}
          gap={24}
          baseColor="#1e293b"
          activeColor="#3b82f6"
          proximity={140}
          shockRadius={200}
          shockStrength={4}
          resistance={750}
          returnDuration={1.2}
        />
      </div>
      <div className="relative z-10 flex w-full h-full pointer-events-none">`;

if (content.includes(mainWrapperOld)) {
  content = content.replace(mainWrapperOld, mainWrapperNew);
  const lastIndex = content.lastIndexOf('</div>');
  if (lastIndex !== -1) {
    content = content.substring(0, lastIndex) + '</div>\n    </div>' + content.substring(lastIndex + 6);
  }
}

// 3. Fix Sidebar
const sidebarOld = 'bg-slate-900 text-slate-300 p-6 flex flex-col justify-between shrink-0 transform';
const sidebarNew = 'pointer-events-auto bg-slate-900/60 backdrop-blur-xl border-r border-white/10 text-slate-300 p-6 flex flex-col justify-between shrink-0 transform';
content = content.replace(sidebarOld, sidebarNew);

// Main Content Body
const mainContentOld = '<div className="flex-1 overflow-y-auto p-8">';
const mainContentNew = '<div className="flex-1 overflow-y-auto p-8 pointer-events-auto">';
content = content.replace(mainContentOld, mainContentNew);

// 4. Update Cards
const cardRegexes = [
  {
    regex: /bg-white\s+dark:bg-slate-800\/90\s+dark:border-slate-700\/60\s+text-slate-900\s+dark:text-slate-100\s+rounded-2xl\s+border\s+border-slate-200\/60\s+dark:border-slate-700/g,
    replace: 'bg-slate-900/60 backdrop-blur-xl border border-white/10 text-slate-100 rounded-2xl'
  },
  {
    regex: /bg-white\s+dark:bg-slate-800\/90\s+dark:border-slate-700\/60\s+text-slate-900\s+dark:text-slate-100/g,
    replace: 'bg-slate-900/60 backdrop-blur-xl border border-white/10 text-slate-100 rounded-2xl p-6'
  },
  {
    regex: /bg-(blue|pink|emerald|purple|slate)-50\s+dark:bg-slate-800\/80(\s+p-4\s+rounded-2xl\s+flex\s+flex-col\s+justify-between\s+)border\s+border-(blue|pink|emerald|purple|slate)-100\s+dark:border-slate-700\/60/g,
    replace: 'bg-slate-900/60 backdrop-blur-xl border border-white/10$2'
  },
  {
    regex: /bg-gradient-to-br\s+from-slate-900\s+to-blue-900/g,
    replace: 'bg-slate-900/60 backdrop-blur-xl border border-white/10'
  },
  {
    regex: /className="dark:bg-slate-800\s+dark:text-white\s+rounded-2xl\s+shadow-sm\s+border\s+border-slate-200\/60\s+dark:border-slate-700"/g,
    replace: 'className="bg-slate-900/60 backdrop-blur-xl border border-white/10 text-slate-100 rounded-2xl shadow-sm"'
  }
];

cardRegexes.forEach(({ regex, replace }) => {
  content = content.replace(regex, replace);
});

content = content.replace(/text-slate-700 dark:text-slate-300/g, 'text-slate-300');
content = content.replace(/text-slate-900 dark:text-slate-100/g, 'text-slate-100');
content = content.replace(/text-slate-800 dark:text-slate-100/g, 'text-slate-100');
content = content.replace(/text-slate-800 dark:text-white/g, 'text-white');
content = content.replace(/text-slate-600 dark:text-slate-400/g, 'text-slate-300');
content = content.replace(/text-slate-500 dark:text-slate-400/g, 'text-slate-300');
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white');
content = content.replace(/text-gray-900 mb-4 dark:text-white/g, 'text-white mb-4');
content = content.replace(/text-gray-900 mb-6 dark:text-white/g, 'text-white mb-6');
content = content.replace(/text-gray-800 font-medium dark:text-gray-100/g, 'text-gray-100 font-medium');
content = content.replace(/text-gray-700 dark:text-gray-200/g, 'text-gray-200');
content = content.replace(/text-gray-600 dark:text-gray-300/g, 'text-gray-300');
content = content.replace(/text-gray-600 font-semibold dark:text-gray-300/g, 'text-gray-300 font-semibold');
content = content.replace(/bg-white\/90 dark:bg-slate-800\/90/g, 'bg-slate-900/60 backdrop-blur-xl border border-white/10');
content = content.replace(/bg-slate-50 dark:bg-slate-900\/80/g, 'bg-slate-800/60 backdrop-blur-xl border border-white/5');

fs.writeFileSync(file, content, 'utf8');
console.log('DashboardNew.jsx updated successfully.');
