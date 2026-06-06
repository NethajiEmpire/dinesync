# 🍽️ RestoPOS — Restaurant Management System
**Complete POS | Offline | React + Node.js + SQLite**

---

## 🚀 Quick Start

### Requirements
- **Node.js** v16 or higher → https://nodejs.org
- Terminal / Command Prompt

### Start Backend (Terminal 1)
**Mac/Linux:**
```bash
./START_BACKEND.sh
```
**Windows:**
```
Double-click START_BACKEND.bat
```
Or manually:
```bash
cd backend
npm install
node server.js
```
Backend: **http://localhost:3001**

### Start Frontend (Terminal 2)
**Mac/Linux:**
```bash
./START_FRONTEND.sh
```
**Windows:**
```
Double-click START_FRONTEND.bat
```
Or manually:
```bash
cd frontend
npm install
npm run dev
```
Frontend: **http://localhost:5173**

---

## 🔑 Login Credentials

| Panel    | Username  | Password     |
|----------|-----------|--------------|
| Cashier  | `cashier` | `cashier123` |
| Admin    | `admin`   | `admin123`   |

---

## 📋 Features

### Cashier Panel
| Screen     | Features |
|------------|----------|
| 📋 Orders   | View & manage running orders, pay & complete |
| 🖥️ Fine Dine | Table map, POS with full menu, KOT |
| 🍔 QSR      | Quick service — Take Away & Delivery POS |
| 🕐 Recents  | Live Take Away & Delivery KOT tracker |
| ⊞ History  | Sales history, Pending bills, Credit pay |
| 📄 Report   | Daily revenue, order stats |
| 💲 Expenses | Create & track all expenses by category |
| 🗃️ Inventory | Ingredients, Stock in/out transactions |
| 🍴 Kitchen  | Live kitchen display with urgency indicators |
| ✂️ Menu     | Add/edit/delete menu items with sizes |
| ⚙️ Settings | Tables, tax rates, restaurant info |

### Admin Panel
| Screen          | Features |
|-----------------|----------|
| ⊞ Dashboard     | Live running orders + today's stats |
| Sales History   | Full sales with filter by date/type |
| Cancelled Items | All cancelled orders |
| Summary         | Revenue breakdown by payment & order type |
| Expenses        | Admin view of all expenses |
| Employees       | Add/edit/delete staff accounts |
| Settings        | Restaurant info, tax config, receipt |

---

## 🗄️ Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Frontend  | React 18 + Vite               |
| Backend   | Node.js + Express             |
| Database  | SQLite (via sql.js — offline) |
| Auth      | JWT (bcrypt password hashing) |

---

## 📁 Folder Structure

```
rest-pos/
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── screens/
│       │   ├── auth/         (Landing, CashierLogin, AdminLogin)
│       │   ├── cashier/      (11 screens)
│       │   └── admin/        (7 screens)
│       ├── components/       (Btn, Badge, Modal, Loading, NavItem)
│       ├── constants/        (colors.js)
│       └── services/         (api.js)
├── backend/
│   ├── server.js
│   ├── db/database.js
│   └── routes/               (10 route files)
├── START_BACKEND.sh / .bat
├── START_FRONTEND.sh / .bat
└── README.md
```

---

## 💾 Data Storage
- All data stored in `backend/pos.db` (SQLite)
- 100% offline — no internet needed
- Auto-seeded with sample menu (32 items), 23 tables, default settings

---

## 🔧 Troubleshooting

**Port already in use?**
```bash
# Change backend port
PORT=3002 node server.js
# Then update frontend/vite.config.js proxy target to :3002
```

**node_modules missing?**
```bash
cd backend && npm install
cd frontend && npm install
```
