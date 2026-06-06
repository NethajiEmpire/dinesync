const fs = require('fs');
const path = require('path');

const files = [
  "frontend/src/screens/cashier/SettingsScreen",
  "frontend/src/screens/cashier/QSRScreen",
  "frontend/src/screens/cashier/MenuScreen",
  "frontend/src/screens/cashier/InventoryScreen",
  "frontend/src/screens/cashier/HistoryScreen",
  "frontend/src/screens/cashier/FineDineScreen",
  "frontend/src/screens/cashier/ExpensesScreen",
  "frontend/src/screens/admin/AdminSettings",
  "frontend/src/screens/admin/AdminEmployees"
];

for (const baseFile of files) {
  const jsxFile = baseFile + '.jsx';
  const tsxFile = baseFile + '.tsx';
  
  let targetFile = jsxFile;
  if (!fs.existsSync(jsxFile)) {
    if (fs.existsSync(tsxFile)) {
      targetFile = tsxFile;
    } else {
      console.log(`Skipping ${baseFile} - neither .jsx nor .tsx found.`);
      continue;
    }
  }

  let content = fs.readFileSync(targetFile, 'utf8');
  if (!content.includes("import { toast }")) {
    const relativePath = '../../utils/toast';
    content = `import { toast } from '${relativePath}';\n` + content;
  }
  
  content = content.replace(/alert\((['`].*?['`])\)/g, (match, p1) => {
    const text = p1.toLowerCase();
    if (text.includes('error') || text.includes('enter') || text.includes('fill') || text.includes('add items') || text.includes('disabled') || text.includes('no new') || text.includes('required')) {
      return `toast.error(${p1})`;
    } else {
      return `toast.success(${p1})`;
    }
  });

  content = content.replace(/alert\((e\.response.*?)\)/g, "toast.error($1)");

  // Write updated content to the .tsx file to convert it
  fs.writeFileSync(tsxFile, content, 'utf8');

  // Clean up the old .jsx file if it was converted
  if (targetFile === jsxFile) {
    fs.unlinkSync(jsxFile);
  }
}
console.log('Done replacing alerts with toast and converting files to TypeScript (.tsx).');
