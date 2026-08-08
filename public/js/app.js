/* ============================================
   FoodOrder - Frontend JavaScript (SPA)
   ============================================ */

// =============================================
// API Helper
// =============================================
const API = {
  base: '/api',
  async request(method, url, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this.base + url, opts);
    const data = await res.json();
    if (!res.ok) throw { status: res.status, message: data.message, errors: data.errors };
    return data;
  },
  get:    (url)       => API.request('GET', url),
  post:   (url, body) => API.request('POST', url, body),
  put:    (url, body) => API.request('PUT', url, body),
  delete: (url)       => API.request('DELETE', url)
};

// =============================================
// State Global
// =============================================
let currentUser = null;
let cartCount   = 0;

// =============================================
// Utilitas UI
// =============================================
const $ = id => document.getElementById(id);

function showAlert(id, message, type = 'danger') {
  const el = $(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = message;
  setTimeout(() => { el.className = 'alert'; }, 5000);
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = $(pageId);
  if (pg) { pg.classList.add('active'); window.scrollTo(0, 0); }
}

function formatRupiah(n) {
  return 'Rp ' + parseFloat(n).toLocaleString('id-ID');
}

function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusBadge(status) {
  const map = {
    pending: 'badge-pending', processing: 'badge-processing',
    completed: 'badge-completed', cancelled: 'badge-cancelled', paid: 'badge-paid'
  };
  const label = {
    pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai',
    cancelled: 'Dibatalkan', paid: 'Lunas'
  };
  if (!status) return '-';
  return `<span class="badge ${map[status] || ''}">${label[status] || status}</span>`;
}

function showModal(id) {
  const el = $(id);
  if (el) el.classList.add('show');
}
function hideModal(id) {
  const el = $(id);
  if (el) el.classList.remove('show');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toast(message, type = 'success') {
  const container = document.getElementById('toast-container') || document.body;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = {success:'✅', danger:'❌', warning:'⚠️', info:'ℹ️'}[type] || '✅';
  t.textContent = `${icon} ${message}`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3000);
}

// =============================================
// Auth & Navbar
// =============================================
async function loadCurrentUser() {
  try {
    const res = await API.get('/auth/me');
    currentUser = res.data;
    updateNavbar();
    return true;
  } catch {
    currentUser = null;
    updateNavbar();
    return false;
  }
}

function updateNavbar() {
  const navGuest = $('nav-guest');
  const navAuth  = $('nav-auth');
  const navAdmin = $('nav-admin');

  if (!currentUser) {
    if (navGuest)  navGuest.classList.remove('hidden');
    if (navAuth)   navAuth.classList.add('hidden');
    if (navAdmin)  navAdmin.classList.add('hidden');
    return;
  }

  if (currentUser.role === 'admin') {
    if (navGuest)  navGuest.classList.add('hidden');
    if (navAuth)   navAuth.classList.add('hidden');
    if (navAdmin) {
      navAdmin.classList.remove('hidden');
      const el = $('nav-username-admin');
      if (el) el.textContent = currentUser.name;
    }
  } else {
    if (navGuest)  navGuest.classList.add('hidden');
    if (navAdmin)  navAdmin.classList.add('hidden');
    if (navAuth) {
      navAuth.classList.remove('hidden');
      const el = $('nav-username');
      if (el) el.textContent = currentUser.name;
    }
    updateCartBadge();
  }
}

async function updateCartBadge() {
  if (!currentUser || currentUser.role !== 'customer') return;
  try {
    const res = await API.get('/cart');
    const items = res.data?.cart?.items || [];
    cartCount = items.reduce((s, i) => s + i.quantity, 0);
    const el = $('cart-badge');
    if (el) el.textContent = cartCount;
  } catch {}
}

// ---- Login ----
async function handleLogin(e) {
  e.preventDefault();
  const email    = $('login-email').value.trim();
  const password = $('login-password').value;
  try {
    const res = await API.post('/auth/login', { email, password });
    currentUser = res.data;
    updateNavbar();
    if (currentUser.role === 'admin') {
      showPage('page-admin');
      loadAdminDashboard();
    } else {
      showPage('page-menu');
      loadMenu();
    }
  } catch (err) {
    showAlert('login-alert', err.message || 'Login gagal');
  }
}

// ---- Register ----
async function handleRegister(e) {
  e.preventDefault();
  const body = {
    name:     $('reg-name').value.trim(),
    email:    $('reg-email').value.trim(),
    password: $('reg-password').value,
    phone:    $('reg-phone').value.trim()
  };
  try {
    await API.post('/auth/register', body);
    showAlert('reg-alert', 'Registrasi berhasil! Silakan login.', 'success');
    setTimeout(() => showPage('page-login'), 1500);
  } catch (err) {
    const msg = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
    showAlert('reg-alert', msg || 'Registrasi gagal');
  }
}

// ---- Logout ----
async function handleLogout() {
  try { await API.post('/auth/logout'); } catch {}
  currentUser = null;
  cartCount = 0;
  updateNavbar();
  showPage('page-login');
}

// =============================================
// Menu Makanan
// =============================================
let allFoods = [];
let allCategories = [];

async function loadMenu() {
  showPage('page-menu');
  const grid = $('menu-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  try {
    const [foodsRes, catRes] = await Promise.all([
      API.get('/foods'),
      API.get('/categories')
    ]);
    allFoods      = foodsRes.data || [];
    allCategories = catRes.data   || [];
    // Update hero stats
    const hfc = $('hero-food-count'); if (hfc) hfc.textContent = allFoods.length;
    const hcc = $('hero-cat-count');  if (hcc) hcc.textContent = allCategories.length;
    renderCategoryFilter();
    renderMenuGrid(allFoods);
  } catch {
    grid.innerHTML = '<p class="empty-state">Gagal memuat menu.</p>';
  }
}

function renderCategoryFilter() {
  const el = $('category-filter');
  if (!el) return;
  el.innerHTML = '<button class="btn btn-sm btn-primary" onclick="filterMenu(null)">Semua</button>';
  allCategories.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline';
    btn.textContent = c.name;
    btn.onclick = () => filterMenu(c.id);
    el.appendChild(btn);
  });
}

function filterMenu(categoryId) {
  const filtered = categoryId
    ? allFoods.filter(f => f.category_id === categoryId)
    : allFoods;
  renderMenuGrid(filtered);
}

function searchMenu() {
  const q = $('menu-search').value.toLowerCase();
  const filtered = allFoods.filter(f =>
    f.name.toLowerCase().includes(q) ||
    (f.description || '').toLowerCase().includes(q)
  );
  renderMenuGrid(filtered);
}

function renderMenuGrid(foods) {
  const grid = $('menu-grid');
  if (!grid) return;
  if (!foods.length) {
    grid.innerHTML = '<p class="empty-state">Tidak ada makanan tersedia.</p>';
    return;
  }
  grid.innerHTML = '';
  foods.forEach(f => {
    // Card wrapper
    const card = document.createElement('div');
    card.className = 'food-card';
    card.style.cursor = 'pointer';

    // Wrapper gambar
    const imgWrap = document.createElement('div');
    imgWrap.className = 'food-card-img-wrap';
    const img = document.createElement('img');
    img.src     = f.image_url || '/placeholder/240/180?text=No+Image';
    img.alt     = f.name;
    img.loading = 'lazy';
    img.addEventListener('error', () => { img.src = '/placeholder/240/180?text=No+Image'; });
    img.addEventListener('click', () => showFoodDetail(f.id));
    imgWrap.appendChild(img);

    // Body
    const body = document.createElement('div');
    body.className = 'food-card-body';

    const cat = document.createElement('div');
    cat.className   = 'food-card-cat';
    cat.textContent = f.category?.name || '';

    const name = document.createElement('div');
    name.className   = 'food-card-name';
    name.textContent = f.name;
    name.style.cursor = 'pointer';
    name.addEventListener('click', () => showFoodDetail(f.id));

    const price = document.createElement('div');
    price.className   = 'food-card-price';
    price.textContent = formatRupiah(f.price);

    const stock = document.createElement('div');
    stock.className   = 'food-card-stock';
    stock.textContent = 'Stok: ' + f.stock;

    // Footer card: harga + tombol
    const footer = document.createElement('div');
    footer.className = 'food-card-footer';
    price.remove(); // pindah ke footer
    footer.appendChild(price);

    // Tombol keranjang — hanya untuk customer
    if (currentUser && currentUser.role === 'customer') {
      const btn = document.createElement('button');
      btn.className   = 'btn-add-cart';
      btn.title       = 'Tambah ke Keranjang';
      btn.textContent = '+';
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        quickAddToCart(f.id, f.name);
      });
      footer.appendChild(btn);
    }

    body.appendChild(cat);
    body.appendChild(name);
    body.appendChild(stock);
    body.appendChild(footer);

    card.appendChild(imgWrap);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

// ---- Detail Makanan ----
async function showFoodDetail(id) {
  try {
    const res = await API.get(`/foods/${id}`);
    const f = res.data;
    $('detail-name').textContent  = f.name;
    $('detail-cat').textContent   = f.category?.name || '';
    $('detail-price').textContent = formatRupiah(f.price);
    $('detail-stock').textContent = `Stok: ${f.stock}`;
    $('detail-desc').textContent  = f.description || '-';
    $('detail-img').src = f.image_url || '/placeholder/400/250?text=No+Image';
    $('detail-qty').value = 1;
    const addBtn = $('detail-add-btn');
    if (addBtn) {
      if (currentUser && currentUser.role === 'customer') {
        addBtn.classList.remove('hidden');
        addBtn.onclick = () => addToCartFromDetail(f.id);
      } else {
        addBtn.classList.add('hidden');
      }
    }
    showModal('modal-food-detail');
  } catch {
    toast('Gagal memuat detail makanan', 'danger');
  }
}

async function quickAddToCart(foodId, name) {
  if (!currentUser) { showPage('page-login'); return; }
  try {
    await API.post('/cart/items', { food_id: foodId, quantity: 1 });
    updateCartBadge();
    toast(`${name} ditambahkan ke keranjang`);
  } catch (err) {
    toast(err.message || 'Gagal menambahkan ke keranjang', 'danger');
  }
}

async function addToCartFromDetail(foodId) {
  const qty = parseInt($('detail-qty').value) || 1;
  try {
    await API.post('/cart/items', { food_id: foodId, quantity: qty });
    updateCartBadge();
    hideModal('modal-food-detail');
    toast('Berhasil ditambahkan ke keranjang!');
  } catch (err) {
    toast(err.message || 'Gagal menambahkan ke keranjang', 'danger');
  }
}

// =============================================
// Cart
// =============================================
let cartData = null;

async function loadCart() {
  if (!currentUser) { showPage('page-login'); return; }
  showPage('page-cart');
  const container = $('cart-container');
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await API.get('/cart');
    cartData = res.data;
    renderCart();
  } catch {
    container.innerHTML = '<p class="empty-state">Gagal memuat keranjang.</p>';
  }
}

function renderCart() {
  const container = $('cart-container');
  const summary   = $('cart-summary');
  const items = cartData?.cart?.items || [];

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">
      <i>&#128722;</i><p>Keranjang Anda kosong</p>
      <button class="btn btn-primary mt-2" onclick="loadMenu()">Lihat Menu</button>
    </div>`;
    if (summary) summary.classList.add('hidden');
    return;
  }

  if (summary) summary.classList.remove('hidden');

  container.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';

    // Gambar
    const img = document.createElement('img');
    img.className = 'cart-item-img';
    img.src = item.food?.image_url || '/placeholder/60/60?text=F';
    img.alt = item.food?.name || '';
    img.addEventListener('error', () => { img.src = '/placeholder/60/60?text=F'; });

    // Info
    const info = document.createElement('div');
    info.className = 'cart-item-info';
    info.innerHTML = `
      <div class="cart-item-name">${escapeHtml(item.food?.name || '')}</div>
      <div class="cart-item-price">${formatRupiah(item.price_at_add)} / porsi</div>
      <div class="text-muted">Subtotal: ${formatRupiah(item.price_at_add * item.quantity)}</div>`;

    // Qty control
    const qtyCtrl = document.createElement('div');
    qtyCtrl.className = 'qty-control';

    const btnDec = document.createElement('button');
    btnDec.className   = 'qty-btn';
    btnDec.textContent = '−';
    btnDec.addEventListener('click', () => changeQty(item.id, item.quantity - 1));

    const qtySpan = document.createElement('span');
    qtySpan.textContent = item.quantity;

    const btnInc = document.createElement('button');
    btnInc.className   = 'qty-btn';
    btnInc.textContent = '+';
    btnInc.addEventListener('click', () => changeQty(item.id, item.quantity + 1));

    qtyCtrl.appendChild(btnDec);
    qtyCtrl.appendChild(qtySpan);
    qtyCtrl.appendChild(btnInc);

    // Hapus
    const btnDel = document.createElement('button');
    btnDel.className   = 'btn btn-danger btn-sm';
    btnDel.textContent = 'Hapus';
    btnDel.addEventListener('click', () => removeItem(item.id));

    div.appendChild(img);
    div.appendChild(info);
    div.appendChild(qtyCtrl);
    div.appendChild(btnDel);
    container.appendChild(div);
  });

  const totalEl = $('cart-total');
  const subEl   = $('cart-subtotal');
  if (totalEl) totalEl.textContent = formatRupiah(cartData.total);
  if (subEl)   subEl.textContent   = formatRupiah(cartData.total);
}

async function changeQty(itemId, newQty) {
  try {
    await API.put(`/cart/items/${itemId}`, { quantity: newQty });
    const res = await API.get('/cart');
    cartData = res.data;
    renderCart();
    updateCartBadge();
  } catch (err) { toast(err.message, 'danger'); }
}

async function removeItem(itemId) {
  if (!confirm('Hapus item ini?')) return;
  try {
    await API.delete(`/cart/items/${itemId}`);
    const res = await API.get('/cart');
    cartData = res.data;
    renderCart();
    updateCartBadge();
  } catch (err) { toast(err.message, 'danger'); }
}

async function clearCartAll() {
  if (!confirm('Kosongkan semua keranjang?')) return;
  try {
    await API.delete('/cart');
    const res = await API.get('/cart');
    cartData = res.data;
    renderCart();
    updateCartBadge();
  } catch (err) { toast(err.message, 'danger'); }
}

// =============================================
// Checkout & Payment
// =============================================
function showCheckout() {
  const items = cartData?.cart?.items || [];
  if (!items.length) { toast('Keranjang kosong!', 'warning'); return; }
  const totalEl = $('checkout-total');
  if (totalEl) totalEl.textContent = formatRupiah(cartData.total);
  showModal('modal-checkout');
}

async function handleCheckout(e) {
  e.preventDefault();
  const body = {
    delivery_address: $('checkout-address').value.trim(),
    notes:            $('checkout-notes').value.trim(),
    payment_method:   $('checkout-payment').value
  };
  try {
    const res = await API.post('/orders/checkout', body);
    hideModal('modal-checkout');
    showPaymentModal(res.data.order, res.data.payment);
    cartData = null;
    updateCartBadge();
  } catch (err) {
    const msg = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
    showAlert('checkout-alert', msg);
  }
}

function showPaymentModal(order, payment) {
  $('pay-order-num').textContent = order.order_number;
  $('pay-amount').textContent    = formatRupiah(order.total_amount);
  $('pay-method').textContent    = payment.payment_method;
  $('pay-ref').textContent       = payment.transaction_ref;
  const payBtn = $('pay-btn');
  if (payBtn) payBtn.onclick = () => doPayment(order.id);
  showModal('modal-payment');
}

async function doPayment(orderId) {
  try {
    await API.post(`/orders/${orderId}/pay`);
    hideModal('modal-payment');
    toast('Pembayaran berhasil! Pesanan sedang diproses.');
    loadOrders();
  } catch (err) {
    toast(err.message || 'Pembayaran gagal', 'danger');
  }
}

// =============================================
// Riwayat Pesanan (Customer)
// =============================================
async function loadOrders() {
  if (!currentUser) { showPage('page-login'); return; }
  showPage('page-orders');
  const container = $('orders-container');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await API.get('/orders');
    const orders = res.data || [];
    if (!orders.length) {
      container.innerHTML = `<div class="empty-state">
        <i>&#128203;</i><p>Belum ada pesanan</p>
        <button class="btn btn-primary mt-2" onclick="loadMenu()">Pesan Sekarang</button>
      </div>`;
      return;
    }
    container.innerHTML = '';
    orders.forEach(o => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div class="d-flex justify-between align-center flex-wrap gap-1 mb-1">
          <div>
            <strong>${escapeHtml(o.order_number)}</strong>
            <span class="text-muted"> &bull; ${formatDate(o.createdAt || o.created_at)}</span>
          </div>
          <div>${statusBadge(o.status)} ${statusBadge(o.payment?.status)}</div>
        </div>
        <div class="order-steps">
          <div class="step ${o.status === 'pending' ? 'active' : ['processing','completed'].includes(o.status) ? 'done' : ''}">Menunggu</div>
          <div class="step ${o.status === 'processing' ? 'active' : o.status === 'completed' ? 'done' : ''}">Diproses</div>
          <div class="step ${o.status === 'completed' ? 'done active' : ''}">Selesai</div>
        </div>
        <div class="text-muted">
          ${(o.items || []).map(i => `${escapeHtml(i.food_name)} x${i.quantity}`).join(', ')}
        </div>
        <div class="mt-1"><strong>Total: ${formatRupiah(o.total_amount)}</strong></div>
        ${o.status === 'pending' && o.payment?.status !== 'paid'
          ? `<button class="btn btn-primary btn-sm mt-1" id="pay-now-${o.id}">Bayar Sekarang</button>`
          : ''}`;
      const payNow = div.querySelector(`#pay-now-${o.id}`);
      if (payNow) payNow.onclick = () => doPayment(o.id);
      container.appendChild(div);
    });
  } catch {
    container.innerHTML = '<p class="empty-state">Gagal memuat pesanan.</p>';
  }
}

// =============================================
// Profil
// =============================================
async function loadProfile() {
  if (!currentUser) { showPage('page-login'); return; }
  showPage('page-profile');

  // Avatar dari inisial nama
  const av = $('profile-avatar');
  if (av) av.textContent = (currentUser.name || '?').charAt(0).toUpperCase();

  const dn = $('profile-display-name');
  if (dn) dn.textContent = currentUser.name || '-';

  const de = $('profile-display-email');
  if (de) de.textContent = currentUser.email || '-';

  const roleEl = $('prof-role');
  if (roleEl) {
    roleEl.textContent = currentUser.role === 'admin' ? 'Administrator' : 'Pelanggan';
    roleEl.className = `badge badge-${currentUser.role}`;
  }
  const fields = { 'prof-name': 'name', 'prof-email': 'email', 'prof-phone': 'phone', 'prof-address': 'address' };
  Object.entries(fields).forEach(([id, key]) => {
    const el = $(id);
    if (el) el.value = currentUser[key] || '';
  });
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const body = {
    name:    $('prof-name').value.trim(),
    phone:   $('prof-phone').value.trim(),
    address: $('prof-address').value.trim()
  };
  try {
    const res = await API.put('/auth/profile', body);
    currentUser = res.data;
    updateNavbar();
    showAlert('prof-alert', 'Profil berhasil diperbarui!', 'success');
  } catch (err) {
    showAlert('prof-alert', err.message || 'Gagal memperbarui profil');
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const body = {
    current_password: $('cp-current').value,
    new_password:     $('cp-new').value,
    confirm_password: $('cp-confirm').value
  };
  try {
    await API.put('/auth/change-password', body);
    toast('Password berhasil diubah. Silakan login kembali.');
    currentUser = null;
    updateNavbar();
    showPage('page-login');
  } catch (err) {
    const msg = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
    showAlert('cp-alert', msg);
  }
}

// =============================================
// ADMIN
// =============================================
function showAdminSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active-section'));
  const sec = $(sectionId);
  if (sec) sec.classList.add('active-section');
  document.querySelectorAll('.sidebar-item').forEach(s => {
    s.classList.toggle('active', s.dataset.section === sectionId);
  });
}

async function loadAdminDashboard() {
  showPage('page-admin');
  showAdminSection('admin-dashboard');
  const wn = $('admin-welcome-name');
  if (wn && currentUser) wn.textContent = currentUser.name;
  try {
    const [ordersRes, foodsRes] = await Promise.all([
      API.get('/admin/orders'),
      API.get('/admin/foods')
    ]);
    const orders = ordersRes.data || [];
    const foods  = foodsRes.data  || [];

    const s = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    s('stat-orders',  orders.length);
    s('stat-pending', orders.filter(o => o.status === 'pending').length);
    s('stat-process', orders.filter(o => o.status === 'processing').length);
    s('stat-foods',   foods.length);

    renderAdminOrderTable(orders.slice(0, 10), 'dashboard-orders-table');
  } catch (err) {
    toast('Gagal memuat dashboard: ' + (err.message || ''), 'danger');
  }
}

// ---- Admin: Kelola Makanan ----
let editingFoodId = null;
let adminFoodsCache = [];

async function loadAdminFoods() {
  showPage('page-admin');
  showAdminSection('admin-foods');
  const tbody = $('admin-foods-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner"></div></td></tr>';
  try {
    const res = await API.get('/admin/foods');
    adminFoodsCache = res.data || [];
    if (!adminFoodsCache.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada makanan</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    adminFoodsCache.forEach(f => {
      const tr = document.createElement('tr');

      // Kolom ID
      const tdId = document.createElement('td');
      tdId.textContent = f.id;

      // Kolom Nama + Gambar
      const tdName = document.createElement('td');
      const img = document.createElement('img');
      img.src    = f.image_url || '/placeholder/40/40';
      img.width  = 40;
      img.height = 40;
      img.style.cssText = 'object-fit:cover;border-radius:5px;vertical-align:middle;margin-right:6px;';
      img.addEventListener('error', () => { img.src = '/placeholder/40/40'; });
      tdName.appendChild(img);
      tdName.appendChild(document.createTextNode(f.name));

      // Kolom lainnya
      const tdCat   = document.createElement('td'); tdCat.textContent = f.category?.name || '-';
      const tdPrice = document.createElement('td'); tdPrice.textContent = formatRupiah(f.price);
      const tdStock = document.createElement('td'); tdStock.textContent = f.stock;

      const tdStatus = document.createElement('td');
      tdStatus.innerHTML = f.is_available
        ? '<span class="badge badge-completed">Aktif</span>'
        : '<span class="badge badge-cancelled">Nonaktif</span>';

      // Kolom Aksi
      const tdAksi = document.createElement('td');
      const btnEdit = document.createElement('button');
      btnEdit.className   = 'btn btn-warning btn-sm';
      btnEdit.textContent = 'Edit';
      btnEdit.addEventListener('click', () => openEditFood(f.id));

      const btnDel = document.createElement('button');
      btnDel.className   = 'btn btn-danger btn-sm';
      btnDel.textContent = 'Hapus';
      btnDel.style.marginLeft = '4px';
      btnDel.addEventListener('click', () => deleteFood(f.id));

      tdAksi.appendChild(btnEdit);
      tdAksi.appendChild(btnDel);

      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdCat);
      tr.appendChild(tdPrice);
      tr.appendChild(tdStock);
      tr.appendChild(tdStatus);
      tr.appendChild(tdAksi);
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Gagal memuat data</td></tr>';
  }
}

async function loadCategoriesForSelect(selectId) {
  try {
    const res = await API.get('/categories');
    const sel = $(selectId);
    if (!sel) return;
    sel.innerHTML = (res.data || [])
      .map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join('');
  } catch {}
}

function openAddFood() {
  editingFoodId = null;
  const form = $('food-form');
  if (form) form.reset();
  const title = $('food-modal-title');
  if (title) title.textContent = 'Tambah Makanan';
  loadCategoriesForSelect('food-category');
  showModal('modal-food');
}

async function openEditFood(id) {
  editingFoodId = id;
  // Cari dari cache dulu, kalau tidak ada fetch ulang
  let f = adminFoodsCache.find(x => x.id === id);
  if (!f) {
    const res = await API.get('/admin/foods');
    adminFoodsCache = res.data || [];
    f = adminFoodsCache.find(x => x.id === id);
  }
  if (!f) { toast('Makanan tidak ditemukan', 'danger'); return; }

  await loadCategoriesForSelect('food-category');
  const title = $('food-modal-title');
  if (title) title.textContent = 'Edit Makanan';

  $('food-name').value        = f.name || '';
  $('food-category').value    = f.category_id || '';
  $('food-price').value       = f.price || '';
  $('food-stock').value       = f.stock || 0;
  $('food-description').value = f.description || '';
  $('food-image').value       = f.image_url || '';
  $('food-available').checked = !!f.is_available;
  showModal('modal-food');
}

async function handleFoodSubmit(e) {
  e.preventDefault();
  const body = {
    name:         $('food-name').value.trim(),
    category_id:  parseInt($('food-category').value),
    price:        parseFloat($('food-price').value),
    stock:        parseInt($('food-stock').value),
    description:  $('food-description').value.trim(),
    image_url:    $('food-image').value.trim() || null,
    is_available: $('food-available').checked
  };
  try {
    if (editingFoodId) {
      await API.put(`/admin/foods/${editingFoodId}`, body);
      toast('Makanan berhasil diperbarui');
    } else {
      await API.post('/admin/foods', body);
      toast('Makanan berhasil ditambahkan');
    }
    hideModal('modal-food');
    loadAdminFoods();
  } catch (err) {
    const msg = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
    showAlert('food-alert', msg);
  }
}

async function deleteFood(id) {
  if (!confirm('Yakin ingin menghapus permanen makanan ini?')) return;
  try {
    await API.delete(`/admin/foods/${id}`);
    toast('Makanan dinonaktifkan');
    loadAdminFoods();
  } catch (err) { toast(err.message, 'danger'); }
}

// ---- Admin: Kelola Kategori ----
async function loadAdminCategories() {
  showPage('page-admin');
  showAdminSection('admin-categories');
  const tbody = $('admin-cat-tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner"></div></td></tr>';
  try {
    const res = await API.get('/categories');
    const cats = res.data || [];
    if (!cats.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada kategori</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    cats.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.description || '-')}</td>
        <td><button class="btn btn-danger btn-sm" id="del-cat-${c.id}">Hapus</button></td>`;
      tr.querySelector(`#del-cat-${c.id}`).onclick = () => deleteCategory(c.id);
      tbody.appendChild(tr);
    });
  } catch { tbody.innerHTML = '<tr><td colspan="4">Gagal memuat</td></tr>'; }
}

async function handleAddCategory(e) {
  e.preventDefault();
  const body = {
    name:        $('cat-name').value.trim(),
    description: $('cat-desc').value.trim()
  };
  try {
    await API.post('/admin/categories', body);
    toast('Kategori berhasil ditambahkan');
    $('add-cat-form').reset();
    loadAdminCategories();
  } catch (err) {
    showAlert('cat-alert', err.message);
  }
}

async function deleteCategory(id) {
  if (!confirm('Hapus kategori ini?')) return;
  try {
    await API.delete(`/admin/categories/${id}`);
    toast('Kategori dihapus');
    loadAdminCategories();
  } catch (err) { toast(err.message, 'danger'); }
}

// ---- Admin: Kelola Pesanan ----
async function loadAdminOrders() {
  showPage('page-admin');
  showAdminSection('admin-orders');
  const tbody = $('admin-orders-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-wrap"><div class="spinner"></div></div></td></tr>';
  try {
    const res = await API.get('/admin/orders');
    renderAdminOrderTable(res.data || [], 'admin-orders-tbody');
  } catch {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Gagal memuat</td></tr>';
  }
}

function renderAdminOrderTable(orders, tbodyId) {
  const tbody = $(tbodyId);
  if (!tbody) return;
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:2rem">Belum ada pesanan</td></tr>`;
    return;
  }
  tbody.innerHTML = '';
  orders.forEach(o => {
    const tr = document.createElement('tr');

    // Item pesanan
    const items = o.items || [];
    const itemsHtml = items.length
      ? items.map(i => `<div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:2px">
          <span style="font-weight:600;font-size:0.82rem">${escapeHtml(i.food_name)}</span>
          <span style="background:var(--gray-200);border-radius:50px;padding:1px 7px;font-size:0.72rem;font-weight:700">x${i.quantity}</span>
          <span style="color:var(--gray-500);font-size:0.75rem">${formatRupiah(i.subtotal)}</span>
        </div>`).join('')
      : '<span class="text-muted" style="font-size:0.8rem">-</span>';

    // Catatan pesanan
    const notesHtml = o.notes
      ? `<div style="margin-top:6px;padding:5px 8px;background:#FFFBEB;border-left:3px solid var(--warning);border-radius:4px;font-size:0.78rem;color:#92400E">
           <strong>Catatan:</strong> ${escapeHtml(o.notes)}
         </div>`
      : '';

    // Alamat pendek
    const alamat = o.delivery_address || '-';
    const alamatShort = alamat.length > 30 ? alamat.substring(0, 30) + '…' : alamat;

    tr.innerHTML = `
      <td>
        <div style="font-size:0.78rem;font-weight:700;color:var(--gray-700)">${escapeHtml(o.order_number)}</div>
        <div style="font-size:0.75rem;color:var(--gray-500);margin-top:2px">${formatDate(o.createdAt || o.createdAt || o.created_at)}</div>
      </td>
      <td>
        <div style="font-weight:600;font-size:0.88rem">${escapeHtml(o.user?.name || '-')}</div>
        <div style="font-size:0.75rem;color:var(--gray-400)">${escapeHtml(o.user?.email || '')}</div>
      </td>
      <td>
        <div style="line-height:1.6">${itemsHtml}</div>
        ${notesHtml}
      </td>
      <td style="font-weight:800;color:var(--primary)">${formatRupiah(o.total_amount)}</td>
      <td title="${escapeHtml(alamat)}" style="font-size:0.82rem;color:var(--gray-600);max-width:130px">${escapeHtml(alamatShort)}</td>
      <td>${statusBadge(o.status)}<br><span style="margin-top:3px;display:inline-block">${statusBadge(o.payment?.status)}</span></td>
      <td>
        <div class="d-flex gap-1 flex-wrap">
          ${o.status === 'pending'    ? `<button class="btn btn-warning btn-sm" id="proc-${o.id}">Proses</button>` : ''}
          ${o.status === 'processing' ? `<button class="btn btn-success btn-sm" id="done-${o.id}">Selesai</button>` : ''}
          ${['pending','processing'].includes(o.status) ? `<button class="btn btn-danger btn-sm" id="cancel-${o.id}">Batalkan</button>` : ''}
          ${!['pending','processing'].includes(o.status) ? `<span class="text-muted" style="font-size:0.8rem">—</span>` : ''}
        </div>
      </td>`;

    const proc   = tr.querySelector(`#proc-${o.id}`);
    const done   = tr.querySelector(`#done-${o.id}`);
    const cancel = tr.querySelector(`#cancel-${o.id}`);
    if (proc)   proc.onclick   = () => changeOrderStatus(o.id, 'processing');
    if (done)   done.onclick   = () => changeOrderStatus(o.id, 'completed');
    if (cancel) cancel.onclick = () => changeOrderStatus(o.id, 'cancelled');
    tbody.appendChild(tr);
  });
}

async function changeOrderStatus(orderId, status) {
  if (!confirm(`Ubah status ke "${status}"?`)) return;
  try {
    await API.put(`/admin/orders/${orderId}/status`, { status });
    toast('Status pesanan diperbarui');
    // Refresh tabel yang sedang aktif
    const adminOrdersSection = $('admin-orders');
    if (adminOrdersSection && !adminOrdersSection.classList.contains('hidden')) {
      loadAdminOrders();
    } else {
      loadAdminDashboard();
    }
  } catch (err) { toast(err.message, 'danger'); }
}

// ---- Admin: Security Logs ----
async function loadAdminLogs() {
  showPage('page-admin');
  showAdminSection('admin-logs');
  const tbody = $('admin-logs-tbody');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner"></div></td></tr>';
  try {
    const res = await API.get('/admin/logs');
    const logs = res.data || [];
    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada log</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    logs.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(l.createdAt || l.created_at)}</td>
        <td>${escapeHtml(l.user?.email || 'Guest')}</td>
        <td><code>${escapeHtml(l.activity_type)}</code></td>
        <td>${escapeHtml(l.description)}</td>
        <td>${escapeHtml(l.ip_address || '-')}</td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Gagal memuat log</td></tr>';
  }
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Pasang semua event listener form
  const forms = {
    'login-form':           handleLogin,
    'register-form':        handleRegister,
    'profile-form':         handleProfileUpdate,
    'change-password-form': handleChangePassword,
    'checkout-form':        handleCheckout,
    'food-form':            handleFoodSubmit,
    'add-cat-form':         handleAddCategory
  };
  Object.entries(forms).forEach(([id, fn]) => {
    const el = $(id);
    if (el) el.addEventListener('submit', fn);
  });

  // Cek apakah sudah login
  const loggedIn = await loadCurrentUser();
  if (loggedIn) {
    if (currentUser.role === 'admin') {
      showPage('page-admin');
      loadAdminDashboard();
    } else {
      showPage('page-menu');
      loadMenu();
    }
  } else {
    showPage('page-login');
  }
});

// =============================================
// Expose fungsi ke window agar bisa dipanggil
// dari onclick di HTML
// =============================================
window.showPage           = showPage;
window.handleLogout       = handleLogout;
window.loadMenu           = loadMenu;
window.loadCart           = loadCart;
window.loadOrders         = loadOrders;
window.loadProfile        = loadProfile;
window.loadAdminDashboard = loadAdminDashboard;
window.loadAdminFoods     = loadAdminFoods;
window.loadAdminCategories= loadAdminCategories;
window.loadAdminOrders    = loadAdminOrders;
window.loadAdminLogs      = loadAdminLogs;
window.showAdminSection   = showAdminSection;
window.filterMenu         = filterMenu;
window.searchMenu         = searchMenu;
window.showFoodDetail     = showFoodDetail;
window.quickAddToCart     = quickAddToCart;
window.addToCartFromDetail= addToCartFromDetail;
window.changeQty          = changeQty;
window.removeItem         = removeItem;
window.clearCartAll       = clearCartAll;
window.showCheckout       = showCheckout;
window.doPayment          = doPayment;
window.openAddFood        = openAddFood;
window.openEditFood       = openEditFood;
window.deleteFood         = deleteFood;
window.deleteCategory     = deleteCategory;
window.changeOrderStatus  = changeOrderStatus;
window.showModal          = showModal;
window.hideModal          = hideModal;




