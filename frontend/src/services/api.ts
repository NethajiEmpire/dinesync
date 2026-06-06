import axios from 'axios';

const BASE = '/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('resto_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
      if (user.tenantId) {
        config.headers['x-tenant-id'] = user.tenantId;
      }
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }
  return config;
});


// Auth
export const registerClient = (data) => api.post('/auth/register', data);
export const loginEmployee = (data) => api.post('/auth/employee-login', data);
export const loginAdmin = (data) => api.post('/auth/admin-login', data);

// Menu
export const getMenuItems = () => api.get('/menu');
export const addMenuItem = (data) => api.post('/menu', data);
export const updateMenuItem = (id, data) => api.put(`/menu/${id}`, data);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);

// Tables
export const getTables = () => api.get('/tables');
export const addTable = (data) => api.post('/tables', data);
export const updateTable = (id, data) => api.put(`/tables/${id}`, data);
export const deleteTable = (id) => api.delete(`/tables/${id}`);

// Orders / Bills
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const completeOrder = (id, data) => api.post(`/orders/${id}/complete`, data);
export const cancelOrder = (id) => api.post(`/orders/${id}/cancel`);

// Sales History
export const getSalesHistory = (params) => api.get('/sales', { params });

// Advanced Cart Operations (Spec 19.2)
export const createCartSlot = (data) => api.post('/cart/new-slot', data);
export const getTableCart = (tableType, tableNo) => api.get(`/cart/table/${tableType}/${tableNo}`);
export const addCartItem = (data) => api.post('/cart/items', data);
export const updateCartQty = (data) => api.put('/cart/qty', data);
export const removeCartItem = (data) => api.delete('/cart/items', { data });
export const clearCart = (data) => api.delete('/cart/clear', { data });
export const clearLoadedCarts = () => api.delete('/cart/clear-loaded');
export const sendKOT = (data) => api.post('/cart/kot', data);
export const printInvoice = (data) => api.post('/cart/invoice', data);
export const completeCart = (data) => api.post('/cart/complete', data);
export const qsrCompleteCart = (data) => api.post('/cart/qsr-complete', data);
export const getCartStatus = (params) => api.get('/cart/status', { params });
export const getSlotStatuses = (type) => api.get(`/cart/slot-statuses/${type}`);
export const setSlotDiscount = (tableType, tableNo, data) => api.post(`/cart/slotdiscount/${tableType}/${tableNo}`, data);
export const clearSlotDiscount = (tableType, tableNo) => api.delete(`/cart/slot-discount`, { data: { tableType, tableNo } });
export const cancelCartItem = (data) => api.post('/cancel', data);

// Expenses
export const getExpenses = () => api.get('/expenses');
export const createExpense = (data) => api.post('/expenses', data);
export const getExpenseCategories = () => api.get('/expenses/categories');
export const createExpenseCategory = (data) => api.post('/expenses/categories', data);

// Employees
export const getEmployees = () => api.get('/employees');
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Database Management (Spec 19.5)
export const getDatabaseStats = () => api.get('/database/stats');
export const clearDatabaseTable = (table) => api.delete(`/database/clear/${table}`);
export const clearAllDatabase = () => api.delete('/database/clear-all');

// Local Sync & Pull Operations (Spec 19.3)
export const pullAllModules = () => api.post('/pull/all');
export const pullSettings = () => api.get('/pull/settings');
export const pullLogins = () => api.get('/pull/logins');
export const pullAccessMenu = () => api.get('/pull/access-menu');
export const pullOrderSettings = () => api.get('/pull/order-settings');
export const pullInventory = () => api.get('/pull/inventory');
export const pullAllowedTables = () => api.get('/pull/allowed-tables');

// Sync to Main API (Spec 19.6)
export const syncBulkData = (data) => api.post('/sync/bulk', data);
export const syncInventoryData = (data) => api.post('/sync/inventory', data);
export const getSyncHealth = () => api.get('/sync/health');

// Inventory
export const getInventory = () => api.get('/inventory');
export const addInventoryItem = (data) => api.post('/inventory', data);
export const updateInventoryItem = (id, data) => api.put(`/inventory/${id}`, data);
export const deleteInventoryItem = (id) => api.delete(`/inventory/${id}`);

// Stock Transactions
export const getStockTransactions = () => api.get('/inventory/transactions');
export const addStockTransaction = (data) => api.post('/inventory/transactions', data);

// Pending Bills
export const getPendingBills = () => api.get('/sales/pending');
export const payPendingBill = (id, data) => api.post(`/sales/pending/${id}/pay`, data);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// Delivery Partners
export const getPartners = () => api.get('/partners');
export const createPartner = (data) => api.post('/partners', data);
export const updatePartner = (id, data) => api.put(`/partners/${id}`, data);
export const deletePartner = (id) => api.delete(`/partners/${id}`);

export default api;
