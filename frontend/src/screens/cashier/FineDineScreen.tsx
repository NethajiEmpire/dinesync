import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, ORANGE, PURPLE, GREEN } from '../../constants/colors';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import { getTables, getMenuItems, createOrder, getOrders, getSettings, completeOrder } from '../../services/api';
import Loading from '../../components/Loading';

export default function FineDineScreen({ editOrderData, clearEditOrder }) {
  const [tables, setTables] = useState([]);
  const [menuData, setMenuData] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [posModal, setPosModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [sizeModal, setSizeModal] = useState(null);
  const [orderType, setOrderType] = useState('Dine In');
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [settings, setSettings] = useState({});
  const [customFeeInput, setCustomFeeInput] = useState('');
  const [customFeeType, setCustomFeeType] = useState('amount');
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, mRes, oRes, sRes] = await Promise.all([getTables(), getMenuItems(), getOrders(), getSettings()]);
        setTables(tRes.data);
        const grouped = {};
        mRes.data.forEach(item => {
          if (!grouped[item.category]) {
            grouped[item.category] = [];
          }
          grouped[item.category].push(item);
        });
        setMenuData(grouped);
        if (Object.keys(grouped).length > 0) {
          setActiveCategory(Object.keys(grouped)[0]);
        }
        const runningOrders = oRes.data.filter(o => o.status === 'running' || o.status === 'invoiced');
        setOrders(runningOrders);

        let sMap = {};
        if (Array.isArray(sRes.data)) {
            sRes.data.forEach(s => sMap[s.key] = s.value);
        } else {
            sMap = sRes.data || {};
        }
        setSettings(sMap);
        
        if (editOrderData) {
          const table = tRes.data.find(t => t.name === editOrderData.table_name) || { id: editOrderData.table_id || 0, name: editOrderData.table_name, section: editOrderData.order_type === 'Take Away' ? 'PARCEL' : 'DELIVERY' };
          setSelectedTable(table);
          setOrderType(editOrderData.order_type);
          const existingOrder = runningOrders.find(o => o.id === editOrderData.id) || editOrderData;
          const initialCart = (existingOrder.items || []).map((i, idx) => ({ ...i, unitPrice: i.unit_price, isExisting: true, cartKey: `existing-${idx}` }));
          setCart(initialCart);

          let p = 0;
          if (sMap.enable_packing_charge === 'true' && editOrderData.order_type === 'Take Away') {
            if (sMap.enable_item_wise_charges === 'true' || sMap.enable_item_packing_charge === 'true') {
              p = initialCart.reduce((sum, item) => sum + (parseFloat(item.packing_charge || item.item_packing_charge) || 0) * item.qty, 0);
            }
            if (p === 0) p = parseFloat(sMap.packing_charge || sMap.default_packing_charge) || 0;
          }
          let d = 0;
          if (sMap.enable_delivery_charge === 'true' && editOrderData.order_type === 'Home Delivery') {
            d = parseFloat(sMap.delivery_charge || sMap.default_delivery_charge) || 0;
          }
          const diff = (existingOrder.packing_charge || 0) - (p + d);
          if (diff > 0.01) {
             setCustomFeeInput(diff.toFixed(2));
             setCustomFeeType('amount');
          } else {
             setCustomFeeInput('');
          }
          
          setPosModal(true);
          if (clearEditOrder) clearEditOrder();
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const getTableOrder = (tableName) => orders.find(o => o.table_name === String(tableName));

  const openPOS = (table) => {
    setSelectedTable(table);
    const existing = getTableOrder(table.name);

    if (existing && existing.order_type) {
      setOrderType(existing.order_type);
    } else if (table.name === 'TA' || (table.section || '').toUpperCase().includes('PARCEL') || (table.section || '').toUpperCase().includes('TAKE AWAY')) {
      setOrderType('Take Away');
    } else if (table.name === 'HD' || (table.section || '').toUpperCase().includes('DELIVERY')) {
      setOrderType('Home Delivery');
    } else {
      setOrderType('Dine In');
    }

    const initialCart = existing ? (existing.items || []).map((i, idx) => ({ ...i, unitPrice: i.unit_price, isExisting: true, cartKey: `existing-${idx}` })) : [];
    setCart(initialCart);
    
    if (existing) {
       let p = 0;
       if (settings.enable_packing_charge === 'true' && existing.order_type === 'Take Away') {
         if (settings.enable_item_wise_charges === 'true' || settings.enable_item_packing_charge === 'true') {
           p = initialCart.reduce((sum, item) => sum + (parseFloat(item.packing_charge || item.item_packing_charge) || 0) * item.qty, 0);
         }
         if (p === 0) p = parseFloat(settings.packing_charge || settings.default_packing_charge) || 0;
       }
       let d = 0;
       if (settings.enable_delivery_charge === 'true' && existing.order_type === 'Home Delivery') {
         d = parseFloat(settings.delivery_charge || settings.default_delivery_charge) || 0;
       }
       const diff = (existing.packing_charge || 0) - (p + d);
       if (diff > 0.01) {
         setCustomFeeInput(diff.toFixed(2));
         setCustomFeeType('amount');
       } else {
         setCustomFeeInput('');
       }
    } else {
       setCustomFeeInput('');
    }
    setPosModal(true);
  };

  const getSizesForPlatform = (item, type) => {
    let platformId = '1';
    if (type === 'Take Away') platformId = '3';
    if (type === 'Home Delivery') platformId = '5';
    if (!item.sizes) return [];
    const filtered = item.sizes.filter(s => !s.splatform || s.splatform.includes(platformId));
    return filtered.length > 0 ? filtered : item.sizes;
  };

  const handleItemClick = (item) => {
    const platformSizes = getSizesForPlatform(item, orderType);
    if (platformSizes.length > 1 || (item.addons && item.addons.length > 0)) {
       setSizeModal({ ...item, platformSizes });
       setSelectedSize(platformSizes[0] || null);
       setSelectedAddons([]);
    } else {
       addToCart(item, platformSizes[0] || { name: 'Regular', price: item.price }, []);
    }
  };

  const addToCart = (item, size, addons = []) => {
    setCart(prev => {
      const addonKey = addons.map(a => a.id).sort().join(',');
      const key = `${item.id}-${size.name}-${addonKey}`;
      const exists = prev.find(c => c.cartKey === key);
      if (exists) {
        return prev.map(c => c.cartKey === key ? { ...c, qty: c.qty + 1 } : c);
      }
      const addonTotal = addons.reduce((s, a) => s + parseFloat(a.price || 0), 0);
      return [...prev, { ...item, cartKey: key, qty: 1, size: size.name, addons, unitPrice: parseFloat(size.price) + addonTotal }];
    });
    setSizeModal(null);
  };

  const updateQty = (key, delta) =>
    setCart(prev => prev.map(c => c.cartKey === key ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));

  const itemTotal = cart.reduce((s, c) => s + c.qty * c.unitPrice, 0);

  const cgstPercent = parseFloat(settings.cgst_percent) || 0;
  const sgstPercent = parseFloat(settings.sgst_percent) || 0;
  const totalTaxPercent = cgstPercent + sgstPercent;

  let subtotal = itemTotal;
  if ((settings.gst_type === 'inclusive' || settings.inclusive_exclusive_tax === '0') && totalTaxPercent > 0) {
    subtotal = itemTotal / (1 + totalTaxPercent / 100);
  }

  const cgst = subtotal * (cgstPercent / 100);
  const sgst = subtotal * (sgstPercent / 100);

  let packing = 0;
  if (settings.enable_packing_charge === 'true' && orderType === 'Take Away') {
    if (settings.enable_item_wise_charges === 'true' || settings.enable_item_packing_charge === 'true') {
      packing = cart.reduce((sum, item) => sum + (parseFloat(item.packing_charge || item.item_packing_charge) || 0) * item.qty, 0);
    }
    // Fallback to default overall packing charge if item-wise resulted in 0
    if (packing === 0) {
      packing = parseFloat(settings.packing_charge || settings.default_packing_charge) || 0;
    }
  }

  let delivery = 0;
  if (settings.enable_delivery_charge === 'true' && orderType === 'Home Delivery') {
    delivery = parseFloat(settings.delivery_charge || settings.default_delivery_charge) || 0;
  }

  let customFee = 0;
  let customFeeName = settings.custom_additional_charge_name || 'Additional Charge';
  if (settings.enable_additional_charge === 'true') {
    const val = parseFloat(customFeeInput) || 0;
    if (customFeeType === 'percent') {
      customFee = subtotal * (val / 100);
    } else {
      customFee = val;
    }
  }

  const combinedCharges = packing + delivery + customFee;
  const total = (settings.gst_type === 'inclusive' || settings.inclusive_exclusive_tax === '0') ? (itemTotal + combinedCharges) : (subtotal + cgst + sgst + combinedCharges);

  const printDocument = async (htmlContent) => {
    const silentEnabled = settings.silent_print_enabled === 'true';
    const silentUrl = settings.silent_print_url || 'http://192.168.1.82:8181/print';

    if (silentEnabled && silentUrl) {
      try {
        await fetch(silentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_name: 'Printer_1', format: 'html', data: htmlContent, copies: 1 })
        });
        return;
      } catch (e) {
        console.warn('Silent print failed', e);
        toast.error('Silent printer failed, using regular print');
      }
    }

    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'absolute';
    printWindow.style.top = '-1000px';
    document.body.appendChild(printWindow);
    printWindow.contentDocument.write(htmlContent);
    printWindow.contentDocument.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.contentWindow.print();
      setTimeout(() => { document.body.removeChild(printWindow); }, 500);
    }, 500);
  };

  const generateKOTHtml = (orderId, items, table, type) => {
    return `
      <html>
        <head>
          <title>KOT #${orderId}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0; padding: 10px; }
            h2, h3 { text-align: center; margin: 5px 0; }
            .bold { font-weight: bold; }
            table { width: 100%; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 10px 0; border-collapse: collapse; }
            th, td { padding: 5px 0; text-align: left; }
            th { border-bottom: 1px dashed #000; }
          </style>
        </head>
        <body>
          <h2>KOT</h2>
          <div>Token/Order: <span class="bold">#${orderId}</span></div>
          <div>Table: <span class="bold">${table}</span></div>
          <div>Type: <span class="bold">${type}</span></div>
          <div>Date: ${new Date().toLocaleString('en-IN')}</div>
          <table>
            <thead>
              <tr><th>Qty</th><th>Item</th></tr>
            </thead>
            <tbody>
              ${items.map(i => `<tr>
                <td class="bold">${i.qty}x</td>
                <td>${i.name} ${i.size !== 'Regular' ? `(${i.size})` : ''}
                ${i.addons && i.addons.length > 0 ? `<br/><small>+ ${i.addons.map(a => a.name).join(', ')}</small>` : ''}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
          <div style="text-align: center; margin-top: 10px;">-- END OF KOT --</div>
        </body>
      </html>
    `;
  };

  const generateInvoiceHtml = (orderId, items, table, type, sub, c, s, pack, del, cName, cFee, tot) => {
    return `
      <html>
        <head>
          <title>Invoice #${orderId}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0; padding: 10px; }
            h2, h3, h4 { text-align: center; margin: 5px 0; }
            .bold { font-weight: bold; }
            table { width: 100%; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 10px 0; border-collapse: collapse; }
            th, td { padding: 5px 0; text-align: left; }
            th { border-bottom: 1px dashed #000; }
            .right { text-align: right; }
            .total { font-size: 16px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; }
          </style>
        </head>
        <body>
          <h2>${settings.restaurant_name || 'RESTAURANT'}</h2>
          <h4>${settings.address || ''}</h4>
          <div>Order: <span class="bold">#${orderId}</span></div>
          <div>Table: <span class="bold">${table}</span></div>
          <div>Date: ${new Date().toLocaleString('en-IN')}</div>
          <table>
            <thead>
              <tr><th>Item</th><th class="right">Qty</th><th class="right">Amt</th></tr>
            </thead>
            <tbody>
              ${items.map(i => `<tr><td>${i.name}</td><td class="right">${i.qty}</td><td class="right">${(i.qty * i.unitPrice).toFixed(2)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${sub.toFixed(2)}</span></div>
          ${c > 0 ? `<div style="display: flex; justify-content: space-between;"><span>CGST ${settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}:</span><span>${c.toFixed(2)}</span></div>` : ''}
          ${s > 0 ? `<div style="display: flex; justify-content: space-between;"><span>SGST ${settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}:</span><span>${s.toFixed(2)}</span></div>` : ''}
          ${pack > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Packing:</span><span>${pack.toFixed(2)}</span></div>` : ''}
          ${del > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Delivery:</span><span>${del.toFixed(2)}</span></div>` : ''}
          ${cFee > 0 ? `<div style="display: flex; justify-content: space-between;"><span>${cName}:</span><span>${cFee.toFixed(2)}</span></div>` : ''}
          <div class="total" style="display: flex; justify-content: space-between;"><span>TOTAL:</span><span>${tot.toFixed(2)}</span></div>
          <h4 style="margin-top: 20px;">${settings.thank_you_message || 'Thank You! Visit Again.'}</h4>
        </body>
      </html>
    `;
  };

  const handleKOT = async () => {
    const newItems = cart.filter(c => !c.isExisting);
    if (newItems.length === 0) {
      return toast.error('No new items to print KOT');
    }
    setSaving(true);
    try {
      const existing = getTableOrder(selectedTable.name);
      const res = await createOrder({
        table_id: selectedTable.id, table_name: selectedTable.name,
        order_type: orderType, items: newItems.map(c => ({ menu_item_id: c.id, name: c.name, size: c.size, qty: c.qty, unit_price: c.unitPrice })),
        subtotal, cgst, sgst, packing_charge: combinedCharges, total, kot_only: true, status: 'running',
        existing_order_id: existing?.id
      });
      const oRes = await getOrders();
      setOrders(oRes.data.filter(o => o.status === 'running' || o.status === 'invoiced'));
      setPosModal(false); setCart([]);
      toast.success('KOT Sent & Printed');
      printDocument(generateKOTHtml(res.data?.id || existing?.id || 'New', newItems, selectedTable.name, orderType));
    } catch (e) { console.error(e); toast.error('Error saving order'); }
    finally { setSaving(false); }
  };

  const handleNoKOT = async () => {
    const newItems = cart.filter(c => !c.isExisting);
    if (newItems.length === 0) {
      return toast.error('No new items to save');
    }
    setSaving(true);
    try {
      const existing = getTableOrder(selectedTable.name);
      await createOrder({
        table_id: selectedTable.id, table_name: selectedTable.name,
        order_type: orderType, items: newItems.map(c => ({ menu_item_id: c.id, name: c.name, size: c.size, qty: c.qty, unit_price: c.unitPrice })),
        subtotal, cgst, sgst, packing_charge: combinedCharges, total, kot_only: true, status: 'running',
        existing_order_id: existing?.id
      });
      const oRes = await getOrders();
      setOrders(oRes.data.filter(o => o.status === 'running' || o.status === 'invoiced'));
      setPosModal(false); setCart([]);
      toast.success('Order Saved (No KOT)');
    } catch (e) { console.error(e); toast.error('Error saving order'); }
    finally { setSaving(false); }
  };

  const handleInvoice = async () => {
    if (cart.length === 0) {
      return toast.error('Add items to generate invoice');
    }
    setSaving(true);
    try {
      const existing = getTableOrder(selectedTable.name);
      const newItems = cart.filter(c => !c.isExisting);
      const res = await createOrder({
        table_id: selectedTable.id, table_name: selectedTable.name,
        order_type: orderType, items: newItems.map(c => ({ menu_item_id: c.id, name: c.name, size: c.size, qty: c.qty, unit_price: c.unitPrice })),
        subtotal, cgst, sgst, packing_charge: combinedCharges, total, kot_only: true, status: 'invoiced',
        existing_order_id: existing?.id
      });
      const oRes = await getOrders();
      setOrders(oRes.data.filter(o => o.status === 'running' || o.status === 'invoiced'));
      setPosModal(false); setCart([]);
      toast.success('Invoice Generated & Printed');
      printDocument(generateInvoiceHtml(res.data?.id || existing?.id || 'New', cart, selectedTable.name, orderType, subtotal, cgst, sgst, packing, delivery, customFeeName, customFee, total));
    } catch (e) { console.error(e); toast.error('Error generating invoice'); }
    finally { setSaving(false); }
  };

  const handleComplete = async () => {
    if (cart.length === 0) {
      return toast.error('Add items first');
    }
    setSaving(true);
    try {
      const existing = getTableOrder(selectedTable.name);
      const newItems = cart.filter(c => !c.isExisting);
      await createOrder({
        table_id: selectedTable.id, table_name: selectedTable.name,
        order_type: orderType, items: newItems.map(c => ({ menu_item_id: c.id, name: c.name, size: c.size, qty: c.qty, unit_price: c.unitPrice })),
        subtotal, cgst, sgst, packing_charge: combinedCharges, total, payment_method: 'CASH',
        existing_order_id: existing?.id
      });
      const oRes = await getOrders();
      setOrders(oRes.data.filter(o => o.status === 'running' || o.status === 'invoiced'));
      setPosModal(false); setCart([]);
      toast.success('Order Completed');
    } catch (e) { console.error(e); toast.error('Error saving order'); }
    finally { setSaving(false); }
  };

  const handleDirectComplete = async (e, table) => {
    e.stopPropagation();
    setSaving(true);
    try {
      const order = getTableOrder(table.name);
      if (order && order.id) {
        await completeOrder(order.id, { payment_method: 'CASH' });
        const oRes = await getOrders();
        setOrders(oRes.data.filter(o => o.status === 'running' || o.status === 'invoiced' || o.status === 'loaded'));
        toast.success(`Table ${table.name} directly completed!`);
        window.dispatchEvent(new Event('refreshTables'));
      } else {
        toast.error('No running order to complete. Open POS first.');
      }
    } catch (err) {
      console.error(err); toast.error('Error with fast completion');
    } finally { setSaving(false); }
  };

  const categories = Object.keys(menuData);
  const filteredItems = searchQ
    ? Object.values(menuData).flat().filter(i => i.name.toLowerCase().includes(searchQ.toLowerCase()))
    : (menuData[activeCategory] || []);

  // Group tables by section
  const grouped = {};
  tables.forEach(t => {
    if (!grouped[t.section]) {
      grouped[t.section] = [];
    }
    grouped[t.section].push(t);
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.topbar}>
        {[['⬜', 'Available'], ['🟨', 'Loaded'], ['🟦', 'Running'], ['🟩', 'Invoiced'], ['🟪', 'Completed']].map(([dot, label]) => (
          <div key={label} style={styles.legendBadge}>
            <span>{dot}</span> <span>{label}</span>
          </div>
        ))}
        <div style={styles.btnsRow}>
          <Btn
            color={PRIMARY} onClick={() => {
              setSelectedTable({
                id: 0,
                name: 'TA',
                section: 'PARCEL'
              });
              setOrderType('Take Away');
              setCart([]);
              setPosModal(true);
            }}>🛒 TAKE AWAY
          </Btn>
          <Btn
            color={PURPLE} onClick={() => {
              setSelectedTable({
                id: 0,
                name: 'HD',
                section: 'DELIVERY'
              });
              setOrderType('Home Delivery');
              setCart([]);
              setPosModal(true);
            }}>🚲 HOME DELIVERY
          </Btn>
        </div>
      </div>

      {Object.entries(grouped).map(([section, tbls]) => (
        <div key={section} style={styles.sectionBlock}>
          <h3 style={styles.sectionTitle}>{section}</h3>
          <div style={styles.tablesGrid}>
            {tbls.map(t => {
              const order = getTableOrder(t.name);
              const isRunning = !!order;
              const isInvoiced = order?.status === 'invoiced';
              const isCompleted = order?.status === 'completed';
              const isLoaded = order?.status === 'loaded' || (order?.items && order.items.length > 0 && !isRunning);
              const isSelected = selectedTable?.id === t.id;

              let bg = '#fff';
              let color = '#1e293b';
              let shadow = '0 2px 8px rgba(0,0,0,0.04)';
              let border = '1.5px solid #cbd5e1';

              if (isCompleted) {
                bg = 'linear-gradient(135deg, #e9d5ff, #c4b5fd)'; // Light Purple
                color = '#1e293b';
                border = '1.5px solid transparent';
              } else if (isInvoiced) {
                bg = 'linear-gradient(135deg, #a7f3d0, #10b981)'; // Green
                color = '#fff';
                shadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                border = '1.5px solid transparent';
              } else if (isRunning) {
                bg = 'linear-gradient(135deg, #93c5fd, #3b82f6)'; // Blue
                color = '#fff';
                shadow = '0 6px 16px rgba(59, 130, 246, 0.3)';
                border = '1.5px solid transparent';
              } else if (isLoaded) {
                bg = 'linear-gradient(135deg, #fde68a, #f59e0b)'; // Amber
                color = '#fff';
                shadow = '0 6px 16px rgba(245, 158, 11, 0.3)';
                border = '1.5px solid transparent';
              }

              return (
                <div key={t.id} onClick={() => openPOS(t)} style={{
                  ...styles.tableBox,
                  background: bg,
                  color: color,
                  boxShadow: shadow,
                  border: border
                }}
                onMouseEnter={e => { if (!isRunning && !isInvoiced && !isCompleted && !isLoaded) e.currentTarget.style.borderColor = PRIMARY; }}
                onMouseLeave={e => { if (!isRunning && !isInvoiced && !isCompleted && !isLoaded) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{t.name}</span>
                  {(isRunning || isInvoiced) && <span style={styles.tableTotal}>₹{order.total?.toFixed(0)}</span>}
                  
                  {/* 5.5 Fine Dine Direct Complete Button */}
                  {(isLoaded || isRunning || isInvoiced) && (
                     <button onClick={(e) => handleDirectComplete(e, t)} style={styles.directCompleteBtn}>✓</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* POS Modal */}
      <Modal
        open={posModal}
        onClose={() => {
          setPosModal(false);
          setCart([]);
          setSelectedTable(null);
        }}
        title={
          `POS — Table ${selectedTable?.name} (${orderType})`
        }
        width={1200}>
        <div style={styles.modalBody}>
          {/* Cart */}
          <div style={styles.cartPanel}>
            <div style={styles.cartHeader}>
              <span style={styles.cartTitle}>Cart ({cart.length})</span>
              <Btn small color='#ef4444' onClick={() => setCart([])}>CLEAR</Btn>
            </div>
            <div style={styles.cartScroll}>
              {cart.length === 0 ? (
                <p style={styles.emptyCart}>No items</p>
              ) : cart.map(item => (
                <div key={item.cartKey} style={{ ...styles.cartItem, background: item.isExisting ? '#f9fafb' : '#fff' }}>
                  <div style={styles.cartItemInfo}>
                    <div style={{ ...styles.cartItemName, color: item.isExisting ? '#6b7280' : '#000' }}>
                      {item.name} {item.isExisting && <span style={styles.sentBadge}>Sent</span>}
                    </div>
                    <div style={styles.cartItemSize}>
                       {item.size}
                       {item.addons && item.addons.length > 0 && (
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>+ {item.addons.map(a => a.name).join(', ')}</div>
                       )}
                    </div>
                  </div>
                  <div style={styles.cartQtyControls}>
                    {item.isExisting ? (
                      <span style={{ fontSize: 13, fontWeight: 700, paddingRight: 8 }}>{item.qty}</span>
                    ) : (
                      <>
                        <button onClick={() => updateQty(item.cartKey, -1)} style={{ ...styles.qtyBtn, background: '#fee2e2', color: '#ef4444' }}>−</button>
                        <span style={styles.qtyText}>{item.qty}</span>
                        <button onClick={() => updateQty(item.cartKey, 1)} style={{ ...styles.qtyBtn, background: '#dcfce7', color: '#16a34a' }}>+</button>
                      </>
                    )}
                  </div>
                  <span style={styles.cartItemPrice}>₹{item.qty * item.unitPrice}</span>
                </div>
              ))}
            </div>
            <div style={styles.cartFooter}>
              {[
                ['Subtotal', `₹${subtotal.toFixed(2)}`],
                cgstPercent > 0 ? [`CGST ${cgstPercent}% ${settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}`, `₹${cgst.toFixed(2)}`] : null,
                sgstPercent > 0 ? [`SGST ${sgstPercent}% ${settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}`, `₹${sgst.toFixed(2)}`] : null,
                packing > 0 ? ['Packing', `₹${packing.toFixed(2)}`] : null,
                delivery > 0 ? ['Delivery', `₹${delivery.toFixed(2)}`] : null,
                customFee > 0 ? [customFeeName, `₹${customFee.toFixed(2)}`] : null
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={styles.subRow}><span>{k}</span><span>{v}</span></div>
              ))}
              {settings.enable_additional_charge === 'true' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>{customFeeName}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <select value={customFeeType} onChange={e => setCustomFeeType(e.target.value)} style={{ padding: '2px 4px', fontSize: 11, borderRadius: 4, border: '1px solid #cbd5e1', outline: 'none' }}>
                      <option value="amount">₹</option>
                      <option value="percent">%</option>
                    </select>
                    <input 
                      type="number" 
                      value={customFeeInput} 
                      onChange={e => {
                        let val = e.target.value;
                        const max = parseFloat(settings.custom_fee_max_limit) || 0;
                        if (max > 0 && parseFloat(val) > max) {
                          val = max.toString();
                          toast.error(`Max limit is ${max}`);
                        }
                        setCustomFeeInput(val);
                      }} 
                      placeholder="0" 
                      style={{ width: 60, padding: '2px 6px', fontSize: 12, borderRadius: 4, border: '1px solid #cbd5e1', textAlign: 'right', outline: 'none' }} 
                    />
                  </div>
                </div>
              )}
              <div style={styles.totalRow}>
                <span>TOTAL</span><span>₹{total.toFixed(2)}</span>
              </div>
              <div style={styles.cartBtns}>
                <Btn color={ORANGE} small onClick={handleKOT} disabled={saving}>KOT</Btn>
                <Btn color='#64748b' small onClick={handleNoKOT} disabled={saving}>NO KOT</Btn>
                <Btn color={PURPLE} small onClick={handleInvoice} disabled={saving}>INVOICE</Btn>
                <Btn color={GREEN} small onClick={handleComplete} disabled={saving}>{saving ? '...' : 'COMPLETE'}</Btn>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div style={styles.menuPanel}>
            <div style={styles.searchRow}>
              <input
                placeholder="Search menu..."
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                style={styles.searchInput}
              />
              <div style={styles.orderTypeToggle}>
                {['Dine In', 'Take Away', 'Home Delivery'].map(t => (
                  <button key={t} onClick={() => setOrderType(t)} style={{ ...styles.typeBtn, background: orderType === t ? PRIMARY : '#fff', color: orderType === t ? '#fff' : PRIMARY }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Category Tabs */}
            {!searchQ && (
              <div style={styles.catScroll}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                    ...styles.catBtn,
                    background: activeCategory === cat ? PRIMARY : '#f3f4f6', color: activeCategory === cat ? '#fff' : '#555'
                  }}>{cat}</button>
                ))}
              </div>
            )}

            <div style={styles.menuGrid}>
              {filteredItems.map(item => (
                <div key={item.id} onClick={() => handleItemClick(item)}
                  style={styles.menuItemBox}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}
                >
                  <div style={{ ...styles.menuItemImage, background: item.type === 'nonveg' ? '#fff1f2' : '#f0fdf4' }}>
                    {item.type === 'nonveg' ? '🍗' : '🥗'}
                  </div>
                  <div style={styles.menuItemInfo}>
                    <div style={styles.menuItemName}>{item.name}</div>
                    <div style={styles.menuItemPrice}>₹{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Size Modal */}
      <Modal open={!!sizeModal} onClose={() => setSizeModal(null)} title={`Customize — ${sizeModal?.name}`} width={420}>
        <div style={styles.sizeModalBody}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#475569' }}>Select Size</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {sizeModal?.platformSizes?.map(size => (
              <button key={size.name} onClick={() => setSelectedSize(size)} style={{ ...styles.sizeBtn, borderColor: selectedSize?.name === size.name ? PRIMARY : '#e2e8f0', background: selectedSize?.name === size.name ? `${PRIMARY}11` : '#fff' }}>
                <span>{size.name}</span><span style={{ color: PRIMARY, fontWeight: 800 }}>₹{size.price}</span>
              </button>
            ))}
          </div>
          
          {sizeModal?.addons && sizeModal.addons.length > 0 && (
             <>
               <h4 style={{ margin: '20px 0 10px 0', fontSize: 13, color: '#475569' }}>Add-ons</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                 {sizeModal.addons.map(addon => {
                    const isSelected = selectedAddons.some(a => a.id === addon.id);
                    return (
                      <label key={addon.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => {
                             if (e.target.checked) setSelectedAddons([...selectedAddons, addon]);
                             else setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
                        }} />
                        <span style={{ flex: 1, fontWeight: 500 }}>{addon.name}</span>
                        <span style={{ color: PRIMARY, fontWeight: 700 }}>+₹{addon.price}</span>
                      </label>
                    );
                 })}
               </div>
             </>
          )}

          <Btn color={GREEN} onClick={() => addToCart(sizeModal, selectedSize, selectedAddons)} style={{ marginTop: 24, width: '100%' }}>
            Add to Cart — ₹{((parseFloat(selectedSize?.price) || 0) + selectedAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0)).toFixed(2)}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: { padding: '24px 32px', background: '#f8fafc', minHeight: '100%' },
  topbar: { display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: '16px 24px', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  legendBadge: { fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: '6px 14px', borderRadius: 20 },
  btnsRow: { marginLeft: 'auto', display: 'flex', gap: 12 },
  sectionBlock: { marginBottom: 32, background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  sectionTitle: { color: '#1e293b', fontSize: 16, fontWeight: 800, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '2px solid #f1f5f9', paddingBottom: 10 },
  tablesGrid: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  tableBox: { width: 72, height: 72, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
  tableTotal: { fontSize: 10, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 10, marginTop: 4, fontWeight: 700 },
  directCompleteBtn: { marginTop: 4, background: '#10b981', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  modalBody: { display: 'flex', gap: 0, height: '80vh', minHeight: 600 },
  cartPanel: { width: 340, display: 'flex', flexDirection: 'column', background: '#f8fafc', borderRight: '1px solid #e2e8f0' },
  cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0' },
  cartTitle: { fontWeight: 800, fontSize: 15, color: '#1e293b' },
  cartScroll: { flex: 1, overflowY: 'auto', padding: '16px 16px 0 16px' },
  emptyCart: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 60, fontWeight: 500 },
  cartItem: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: 12, borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  cartItemSize: { fontSize: 11, color: '#64748b', fontWeight: 600 },
  cartQtyControls: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: { border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' },
  qtyText: { width: 20, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#1e293b' },
  cartItemPrice: { fontSize: 14, width: 50, textAlign: 'right', fontWeight: 800, color: PRIMARY },
  cartFooter: { background: '#fff', borderTop: '1px solid #e2e8f0', padding: '16px 20px' },
  subRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 500 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18, color: '#1e293b', marginTop: 12, paddingTop: 12, borderTop: '1px dashed #cbd5e1' },
  cartBtns: { display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  menuPanel: { flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' },
  searchRow: { display: 'flex', gap: 12, padding: '16px 24px', borderBottom: '1px solid #e2e8f0', alignItems: 'center', background: '#f8fafc' },
  searchInput: { flex: 1, padding: '10px 16px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', fontWeight: 500 },
  orderTypeToggle: { display: 'flex', gap: 0, background: '#e2e8f0', padding: 4, borderRadius: 10 },
  typeBtn: { padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, borderRadius: 6, transition: 'all 0.2s' },
  catScroll: { display: 'flex', gap: 8, padding: '16px 24px', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', background: '#fff' },
  catBtn: { padding: '8px 16px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' },
  menuGrid: { flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, alignContent: 'start', background: '#f8fafc' },
  menuItemBox: { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
  menuItemImage: { height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 },
  menuItemInfo: { padding: '12px 14px', borderTop: '1px solid #f1f5f9' },
  menuItemName: { fontSize: 13, fontWeight: 700, lineHeight: 1.4, color: '#1e293b', marginBottom: 6 },
  menuItemPrice: { fontSize: 14, color: PRIMARY, fontWeight: 800 },
  sizeModalBody: { display: 'flex', flexDirection: 'column', gap: 10 },
  sizeBtn: { padding: '14px 20px', border: `2px solid #e2e8f0`, borderRadius: 10, background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, transition: 'all 0.2s' },
  sentBadge: { fontSize: 10, background: '#e2e8f0', padding: '2px 6px', borderRadius: 6, marginLeft: 6, color: '#475569', fontWeight: 700 }
};
