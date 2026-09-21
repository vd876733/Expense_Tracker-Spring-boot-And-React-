const fs = require('fs');
const filePath = 'd:/Expense_Tracker-Spring-boot-And-React--main/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Insert the state declaration
const stateTarget = "const [dateFilter, setDateFilter] = useState('ALL');";
if (!content.includes("const [activeTab, setActiveTab]")) {
  content = content.replace(stateTarget, `const [activeTab, setActiveTab] = useState('dashboard');\n  ${stateTarget}`);
}

// 2. Replace the nav block
const navStart = content.indexOf('<nav className="flex flex-col gap-2 mt-4">');
const navEnd = content.indexOf('</nav>', navStart) + 6;

const newNav = `<nav className="flex flex-col gap-2 mt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
              { id: 'transactions', label: 'Transactions', icon: <ArrowRightLeft size={20} /> },
              { id: 'analytics', label: 'Analytics', icon: <PieChart size={20} /> },
              { id: 'budgets', label: 'Budgets', icon: <Wallet size={20} /> },
              { id: 'goals', label: 'Goals', icon: <Target size={20} /> },
              { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
              { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={\`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full \${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                }\`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>`;

if (navStart !== -1) {
  content = content.substring(0, navStart) + newNav + content.substring(navEnd);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("activeTab state added successfully.");
