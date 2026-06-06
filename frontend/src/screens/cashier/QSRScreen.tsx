import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, PURPLE, GREEN, ORANGE } from '../../constants/colors';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import { getMenuItems, createOrder, getSettings } from '../../services/api';
import Loading from '../../components/Loading';

export default function QSRScreen() {
  const [menuData, setMenuData] = useState({});
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedTable, setSelectedTable] = useState('TA1');
  const [orderType, setOrderType] = useState('Take Away');
  const [sizeModal, setSizeModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [token, setToken] = useState(Math.floor(Math.random() * 50) + 1);
  const [settings, setSettings] = useState({});
  const [customFeeInput, setCustomFeeInput] = useState('');
  const [customFeeType, setCustomFeeType] = useState('amount');
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const allTables = ['TA1','TA2','TA3','TA4','TA5','HD1','HD2','HD3','HD4','HD5','HD6','HD7','HD8'];

  useEffect(() => {
    Promise.all([getMenuItems(), getSettings()]).then(([mRes, sRes]) => {
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
        let sMap = {};
        if (Array.isArray(sRes.data)) {
            sRes.data.forEach(s => sMap[s.key] = s.value);
        } else {
            sMap = sRes.data || {};
        }
        setSettings(sMap);
    }).finally(() => setLoading(false));
  }, []);

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
  if (settings.gst_type === 'inclusive' && totalTaxPercent > 0) {
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
  const total = settings.gst_type === 'inclusive' ? (itemTotal + combinedCharges) : (subtotal + cgst + sgst + combinedCharges);

  const printDocument = async (htmlContent) => {
    const silentEnabled = settings.silent_print_enabled === 'true';
    const silentUrl = settings.silent_print_url;

    if (silentEnabled && silentUrl) {
      try {
        await fetch(silentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/html' },
          body: htmlContent
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

  const handleQSRComplete = async () => {
    if (cart.length === 0) {
      return toast.error('Add items to cart');
    }
    setSaving(true);
    try {
      const payload = {
        table_name: selectedTable, order_type: orderType, payment_method: 'CASH',
        items: cart.map(c => ({ name: c.name, size: c.size, addons: c.addons, qty: c.qty, unit_price: c.unitPrice })),
        subtotal, cgst, sgst, packing_charge: combinedCharges, total
      };
      const res = await createOrder(payload);
      toast.success(`QSR Order Completed! Token #${token}`);

      // Simultaneous KOT + Invoice print for QSR mode
      printDocument(`
        <html>
          <head><title>KOT #${token}</title><style>body{font-family:monospace;width:300px;margin:0;padding:10px;}h2,h3{text-align:center;margin:5px 0;}.bold{font-weight:bold;}table{width:100%;border-top:1px dashed #000;border-bottom:1px dashed #000;margin:10px 0;border-collapse:collapse;}th,td{padding:5px 0;text-align:left;}th{border-bottom:1px dashed #000;}</style></head>
          <body>
            <h2>QSR KOT</h2>
            <div>Token: <span class="bold">#${token}</span></div>
            <div>Table: <span class="bold">${selectedTable}</span></div>
            <table><thead><tr><th>Qty</th><th>Item</th></tr></thead>
              <tbody>${cart.map(i => `<tr>
                <td class="bold">${i.qty}x</td>
                <td>${i.name} ${i.size !== 'Regular' ? `(${i.size})` : ''}
                ${i.addons && i.addons.length > 0 ? `<br/><small>+ ${i.addons.map(a => a.name).join(', ')}</small>` : ''}
                </td>
              </tr>`).join('')}</tbody>
            </table>
          </body>
        </html>
      `);
      
      setTimeout(() => {
      printDocument(`
        <html>
          <head><title>Invoice #${token}</title><style>body{font-family:monospace;width:300px;margin:0;padding:10px;}h2,h3,h4{text-align:center;margin:5px 0;}.bold{font-weight:bold;}table{width:100%;border-top:1px dashed #000;border-bottom:1px dashed #000;margin:10px 0;border-collapse:collapse;}th,td{padding:5px 0;text-align:left;}th{border-bottom:1px dashed #000;}.right{text-align:right;}.total{font-size:16px;font-weight:bold;border-top:1px dashed #000;padding-top:5px;}</style></head>
          <body>
            <h2>${settings.restaurant_name || 'QSR RESTAURANT'}</h2>
            <h4>${settings.address || ''}</h4>
            <div>Order: <span class="bold">#${res.data?.id || token}</span></div>
            <div>Table: <span class="bold">${selectedTable}</span></div>
            <div>Date: ${new Date().toLocaleString('en-IN')}</div>
            <table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Amt</th></tr></thead>
              <tbody>${cart.map(i => `<tr><td>${i.name}<br/><small>${i.addons ? i.addons.map(a=>a.name).join(', ') : ''}</small></td><td class="right">${i.qty}</td><td class="right">${(i.qty * i.unitPrice).toFixed(2)}</td></tr>`).join('')}</tbody>
            </table>
            <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
            ${cgstPercent > 0 ? `<div style="display: flex; justify-content: space-between;"><span>CGST ${settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}:</span><span>${cgst.toFixed(2)}</span></div>` : ''}
            ${sgstPercent > 0 ? `<div style="display: flex; justify-content: space-between;"><span>SGST ${settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}:</span><span>${sgst.toFixed(2)}</span></div>` : ''}
            ${packing > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Packing:</span><span>${packing.toFixed(2)}</span></div>` : ''}
            ${delivery > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Delivery:</span><span>${delivery.toFixed(2)}</span></div>` : ''}
            ${customFee > 0 ? `<div style="display: flex; justify-content: space-between;"><span>${customFeeName}:</span><span>${customFee.toFixed(2)}</span></div>` : ''}
            <div class="total" style="display: flex; justify-content: space-between;"><span>TOTAL:</span><span>${total.toFixed(2)}</span></div>
            <h4 style="margin-top: 20px;">${settings.thank_you_message || 'Thank You! Visit Again.'}</h4>
          </body>
        </html>
      `);
      }, 500);

      setCart([]);
      setCustomFeeInput('');
      setToken(t => t + 1);
    } catch (e) { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const categories = Object.keys(menuData);
  const filteredItems = searchQ
    ? Object.values(menuData).flat().filter(i => i.name.toLowerCase().includes(searchQ.toLowerCase()))
    : (menuData[activeCategory] || []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.layout}>
      {/* Cart Panel */}
      <div style={styles.cartPanel}>
        <div style={styles.cartHeader}>
          <span style={styles.cartTitle}>Cart — Token #{token}</span>
          <Btn small color='#ef4444' onClick={() => setCart([])}>CLEAR</Btn>
        </div>
        <div style={styles.cartMeta}>Table: <strong>{selectedTable}</strong> | {orderType}</div>
        <div style={styles.cartScroll}>
          {cart.length === 0
            ? <p style={styles.emptyCart}>No items</p>
            : cart.map(item => (
              <div key={item.cartKey} style={styles.cartItem}>
                <div style={styles.cartItemInfo}>
                  <div style={styles.cartItemName}>{item.name}</div>
                  <div style={styles.cartItemSize}>
                     {item.size}
                     {item.addons && item.addons.length > 0 && (
                        <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>+ {item.addons.map(a => a.name).join(', ')}</div>
                     )}
                  </div>
                </div>
                <div style={styles.cartQtyControls}>
                  <button onClick={() => updateQty(item.cartKey, -1)} style={styles.qtyBtn}>−</button>
                  <span style={styles.qtyText}>{item.qty}</span>
                  <button onClick={() => updateQty(item.cartKey, 1)} style={styles.qtyBtn}>+</button>
                </div>
                <span style={styles.cartItemPrice}>₹{item.qty * item.unitPrice}</span>
              </div>
            ))
          }
        </div>
        <div style={styles.cartFooter}>
          {[
            ['Subtotal', subtotal.toFixed(2)], 
            cgstPercent > 0 ? [`CGST ${cgstPercent}% ${settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}`, cgst.toFixed(2)] : null, 
            sgstPercent > 0 ? [`SGST ${sgstPercent}% ${settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}`, sgst.toFixed(2)] : null, 
            packing > 0 ? ['Packing', packing.toFixed(2)] : null,
            delivery > 0 ? ['Delivery', delivery.toFixed(2)] : null,
            customFee > 0 ? [customFeeName, customFee.toFixed(2)] : null
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 2 }}><span>{k}</span><span>₹{v}</span></div>
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
            <Btn color={GREEN} small onClick={handleQSRComplete} style={{width: '100%'}} disabled={saving}>{saving ? '...' : `COMPLETE ₹${total.toFixed(2)}`}</Btn>
          </div>
        </div>
      </div>

      {/* Table selector */}
      <div style={styles.tableSidebar}>
        {allTables.map(t => (
          <div key={t} onClick={() => setSelectedTable(t)} style={{
            ...styles.tableBtn, background: selectedTable === t ? PRIMARY : 'transparent', color: selectedTable === t ? '#fff' : '#333', borderRadius: selectedTable === t ? 4 : 0
          }}>{t}</div>
        ))}
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
            {['Dine In', 'Take Away'].map(t => (
              <button key={t} onClick={() => setOrderType(t)} style={{ ...styles.typeBtn, background: orderType === t ? PRIMARY : '#fff', color: orderType === t ? '#fff' : PRIMARY }}>{t}</button>
            ))}
          </div>
        </div>

        {!searchQ && (
          <div style={styles.catScroll}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                ...styles.catBtn, background: activeCategory === cat ? PRIMARY : '#f3f4f6', color: activeCategory === cat ? '#fff' : '#555'
              }}>{cat}</button>
            ))}
          </div>
        )}

        <div style={styles.menuGrid}>
          {filteredItems.map(item => (
            <div key={item.id}
              onClick={() => handleItemClick(item)}
              style={styles.menuItemBox}
              onMouseEnter={e => e.currentTarget.style.borderColor = PRIMARY}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
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

      {/* Category sidebar */}
      <div style={styles.catSidebar}>
        {['FAST MOVING', ...categories].map(cat => (
          <div key={cat} onClick={() => { setActiveCategory(cat); setSearchQ(''); }} style={{
            ...styles.catSidebarBtn, color: activeCategory === cat ? PRIMARY : '#666', borderLeft: activeCategory === cat ? `3px solid ${PRIMARY}` : '3px solid transparent', background: activeCategory === cat ? '#fff' : 'transparent'
          }}>{cat}</div>
        ))}
      </div>

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
  layout: { display: 'flex', height: 'calc(100vh - 56px)' },
  cartPanel: { width: 300, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: 12 },
  cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cartTitle: { fontWeight: 700, fontSize: 13 },
  cartMeta: { fontSize: 12, color: '#888', marginBottom: 8 },
  cartScroll: { flex: 1, overflowY: 'auto' },
  emptyCart: { color: '#ccc', fontSize: 13, textAlign: 'center', marginTop: 40 },
  cartItem: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 12, fontWeight: 600 },
  cartItemSize: { fontSize: 11, color: '#888' },
  cartQtyControls: { display: 'flex', alignItems: 'center', gap: 3 },
  qtyBtn: { background: PURPLE, color: '#fff', border: 'none', borderRadius: 3, width: 20, height: 20, cursor: 'pointer', fontWeight: 700 },
  qtyText: { width: 18, textAlign: 'center', fontSize: 12 },
  cartItemPrice: { fontSize: 12, width: 44, textAlign: 'right', fontWeight: 600 },
  cartFooter: { borderTop: '1px solid #e5e7eb', paddingTop: 10 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, color: PRIMARY, marginTop: 6 },
  cartBtns: { display: 'flex', gap: 6, marginTop: 10 },
  tableSidebar: { width: 54, borderRight: '1px solid #e5e7eb', overflowY: 'auto', background: '#f9fafb' },
  tableBtn: { padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, cursor: 'pointer', margin: '2px 3px' },
  menuPanel: { flex: 1, display: 'flex', flexDirection: 'column' },
  searchRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #e5e7eb' },
  searchInput: { flex: 1, padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 },
  orderTypeToggle: { display: 'flex', border: `1px solid ${PRIMARY}`, borderRadius: 6, overflow: 'hidden' },
  typeBtn: { padding: '6px 12px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  catScroll: { display: 'flex', gap: 4, padding: '8px 12px', overflowX: 'auto', borderBottom: '1px solid #f3f4f6' },
  catBtn: { padding: '4px 12px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  menuGrid: { flex: 1, overflowY: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, alignContent: 'start' },
  menuItemBox: { border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' },
  menuItemImage: { height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 },
  menuItemInfo: { padding: '5px 7px' },
  menuItemName: { fontSize: 11, fontWeight: 600 },
  menuItemPrice: { fontSize: 11, color: PRIMARY, fontWeight: 700 },
  catSidebar: { width: 100, borderLeft: '1px solid #e5e7eb', overflowY: 'auto', background: '#f9fafb' },
  catSidebarBtn: { padding: '10px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  sizeModalBody: { display: 'flex', flexDirection: 'column', gap: 8 },
  sizeBtn: { padding: '12px 16px', border: `1.5px solid ${PRIMARY}`, borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14 }
};
