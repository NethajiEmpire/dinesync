const fs = require('fs');
const p = 'frontend/src/screens/admin/AdminLayout.jsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(import { useState } from 'react';, import { useState, useEffect } from 'react';\nimport { getSettings } from '../../services/api';);
c = c.replace(const [active, setActive] = useState('dashboard');, const [active, setActive] = useState('dashboard');\n  const [restaurantName, setRestaurantName] = useState('Loading...');\n\n  useEffect(() => {\n    getSettings().then(res => {\n      setRestaurantName(res.data.restaurant_name || 'RESTAURANT NAME');\n    }).catch(err => {\n      console.error(err);\n      setRestaurantName('RESTAURANT NAME');\n    });\n  }, []););
c = c.replace(RUCHI'S FAMILY RESTAURANT, {restaurantName});

fs.writeFileSync(p, c);
console.log('Done');
