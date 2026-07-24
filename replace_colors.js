const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

const colorMap = [
  { regex: /bg-slate-900/g, replacement: 'bg-[#1C1C1F]' },
  { regex: /bg-slate-950/g, replacement: 'bg-[#0E0E10]' },
  { regex: /border-slate-800/g, replacement: 'border-[#2A2A2E]' },
  { regex: /border-slate-850/g, replacement: 'border-[#2A2A2E]' },
  { regex: /border-slate-805/g, replacement: 'border-[#2A2A2E]' },
  { regex: /text-slate-400/g, replacement: 'text-[#A0A0A6]' },
  { regex: /text-slate-450/g, replacement: 'text-[#A0A0A6]' },
  { regex: /text-slate-500/g, replacement: 'text-[#A0A0A6]' },
  { regex: /text-slate-600/g, replacement: 'text-[#A0A0A6]' },
  { regex: /text-slate-350/g, replacement: 'text-[#F2F2F3]' },
  { regex: /text-slate-300/g, replacement: 'text-[#F2F2F3]' },
  { regex: /text-slate-200/g, replacement: 'text-[#F2F2F3]' },
  { regex: /text-white/g, replacement: 'text-[#F2F2F3]' },
  { regex: /bg-indigo-650/g, replacement: 'bg-coral-500' },
  { regex: /bg-indigo-600/g, replacement: 'bg-coral-600' },
  { regex: /bg-indigo-500\/10/g, replacement: 'bg-coral-500/10' },
  { regex: /bg-indigo-500\/5/g, replacement: 'bg-coral-500/5' },
  { regex: /bg-indigo-500/g, replacement: 'bg-coral-500' },
  { regex: /text-indigo-400/g, replacement: 'text-coral-500' },
  { regex: /text-indigo-500/g, replacement: 'text-coral-500' },
  { regex: /border-indigo-500\/20/g, replacement: 'border-coral-500/20' },
  { regex: /border-indigo-500/g, replacement: 'border-coral-500' },
  { regex: /border-indigo-650/g, replacement: 'border-coral-500' },
  { regex: /hover:bg-slate-750/g, replacement: 'hover:bg-[#39393F]' },
  { regex: /hover:bg-slate-800/g, replacement: 'hover:bg-[#39393F]' },
  { regex: /bg-slate-800/g, replacement: 'bg-[#2A2A2E]' },
  { regex: /hover:text-white/g, replacement: 'hover:text-[#F2F2F3]' },
  { regex: /hover:text-indigo-400/g, replacement: 'hover:text-coral-500' },
  { regex: /focus:ring-indigo-500/g, replacement: 'focus:ring-coral-500' },
  { regex: /focus:border-indigo-500/g, replacement: 'focus:border-coral-500' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  for (const { regex, replacement } of colorMap) {
    content = content.replace(regex, replacement);
  }
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

fs.readdirSync(pagesDir).forEach(file => {
  if (file.endsWith('.tsx') && file !== 'Dashboard.tsx') {
    processFile(path.join(pagesDir, file));
  }
});
