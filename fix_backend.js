const fs = require("fs");
const dbPath = "backend/db/database.js";
let dbCode = fs.readFileSync(dbPath, "utf8");
dbCode = dbCode.replace("const bcrypt = require(\"bcryptjs\");", "const bcrypt = require(\"bcryptjs\");\nconst { AsyncLocalStorage } = require(\"async_hooks\");\nconst tenantStorage = new AsyncLocalStorage();");
dbCode = dbCode.replace("function getDB(tenantId) {", "function getDB(tenantId) {\n  tenantId = tenantId || tenantStorage.getStore();");
dbCode = dbCode.replace("module.exports = { getDB, initDB, seedTenantData };", "module.exports = { getDB, initDB, seedTenantData, tenantStorage };");
fs.writeFileSync(dbPath, dbCode);

const serverPath = "backend/server.js";
let srvCode = fs.readFileSync(serverPath, "utf8");
srvCode = srvCode.replace("const { initDB } = require(\"./db/database\");", "const { initDB, tenantStorage } = require(\"./db/database\");");
srvCode = srvCode.replace("app.use(express.urlencoded({ extended: true }));", "app.use(express.urlencoded({ extended: true }));\n\napp.use((req, res, next) => {\n  const tenantId = req.headers[\"x-tenant-id\"];\n  if (tenantId) {\n    tenantStorage.run(tenantId, () => next());\n  } else {\n    next();\n  }\n});");
fs.writeFileSync(serverPath, srvCode);
console.log("Patched");

