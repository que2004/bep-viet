import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, productsAPI, categoriesAPI, usersAPI, reviewsAPI } from '../api';
import LotusLogo from '../components/LotusLogo';
import toast from 'react-hot-toast';
import './AdminPage.css';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

// ─── Constants ─
// Thứ tự trạng thái — chỉ tiến về phía trước
const STATUS_ORDER = ['pending','confirmed','cooking','cooked','delivering','delivered','completed'];

const getNextStatus = (current) => {
  if (current === 'cancelled' || current === 'completed') return null;
  const idx = STATUS_ORDER.indexOf(current);
  return idx !== -1 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
};


const STATUS_META = {
  pending:    { label: 'Chờ xác nhận', color: '#f59e0b', icon: '📋', bg: '#FEF3C7' },
  confirmed:  { label: 'Đã xác nhận',  color: '#3b82f6', icon: '✅', bg: '#DBEAFE' },
  cooking:    { label: 'Đang nấu',     color: '#8b5cf6', icon: '👨‍🍳', bg: '#EDE9FE' },
  cooked:     { label: 'Đã nấu',       color: '#06b6d4', icon: '🍱', bg: '#CFFAFE' },
  delivering: { label: 'Đang giao',    color: '#f97316', icon: '🛵', bg: '#FFEDD5' },
  delivered:  { label: 'Đã giao',      color: '#0ea5e9', icon: '📦', bg: '#E0F2FE' },
  completed:  { label: 'Hoàn thành',   color: '#22c55e', icon: '🎉', bg: '#DCFCE7' },
  cancelled:  { label: 'Đã hủy',       color: '#ef4444', icon: '❌', bg: '#FEE2E2' },
  // payment statuses
  
};



// Luồng trạng thái — chỉ được đi tới, không quay lui
const NEXT_ALLOWED_DINE_IN = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['cooking',   'cancelled'],
  cooking:   ['cooked',    'cancelled'],
  cooked:    ['completed', 'cancelled'],
  completed: [], cancelled: [],
};
const NEXT_ALLOWED_DELIVERY = {
  pending:    ['confirmed',  'cancelled'],
  confirmed:  ['cooking',    'cancelled'],
  cooking:    ['cooked',     'cancelled'],
  cooked:     ['delivering', 'cancelled'],
  delivering: ['delivered',  'cancelled'],
  delivered:  ['completed',  'cancelled'],
  completed: [], cancelled: [],
};
const getNextAllowed = (orderType) =>
  orderType === 'delivery' ? NEXT_ALLOWED_DELIVERY : NEXT_ALLOWED_DINE_IN;
const ROLE_META = {
  admin:    { label: 'Admin',       color: '#7B1F3A', icon: '👑' },
  staff:    { label: 'Nhân viên',   color: '#3b82f6', icon: '🧑‍💼' },
  shipper:  { label: 'Shipper',     color: '#10b981', icon: '🛵'  },
  customer: { label: 'Khách hàng', color: '#6b7280', icon: '👤'  },
};
const ROLE_CONFIG = {
  admin:   { label: 'Quản trị viên', icon: '👑',      color: '#7B1F3A',
    allowedStatuses: ['pending','confirmed','cooking','cooked','delivering','completed','cancelled'],
    tabs: ['dashboard','orders','products','categories','users','reviews'] },
  staff:   { label: 'Nhân viên',     icon: '🧑‍💼', color: '#3b82f6',
    allowedStatuses: ['pending','confirmed','cooking','cooked','delivering','completed','cancelled'],
    tabs: ['dashboard','orders','products','categories','reviews'] },
  shipper: { label: 'Shipper',        icon: '🛵',      color: '#10b981',
    allowedStatuses: ['cooked','delivering','completed'],
    tabs: ['delivery_self'] },
};
const TAB_META = {
  dashboard:     { label: 'Dashboard',    icon: '📊', shortLabel: 'Dash' },
  orders:        { label: 'Đơn hàng',     shortLabel: 'Đơn',     icon: '📦' },
  products:      { label: 'Món ăn',        shortLabel: 'Món',       icon: '🍜' },
  categories:    { label: 'Danh mục',      shortLabel: 'DM',     icon: '📂' },
  users:         { label: 'Tài khoản',     shortLabel: 'TK',    icon: '👤' },
  reviews:       { label: 'Đánh giá',      shortLabel: 'ĐG',     icon: '⭐' },
  delivery_self: { label: 'Đơn của tôi',  shortLabel: 'Của tôi',  icon: '🛵' },
};

// ─────────────────────────────────────────────────────────────
// Shared: StatusBadge
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span className="s-badge" style={{ background: meta.bg || meta.color + '22', color: meta.color }}>
      {meta.icon && <span>{meta.icon}</span>} {meta.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(0);

  useEffect(() => {
    ordersAPI.getStats().then((r) => setStats(r.data)).catch(() => {});
    usersAPI.getAll({}).then((r) => setUsers(r.data?.length || 0)).catch(() => {});
  }, []);

  const cards = [
    { icon: '📦', label: 'Đơn hôm nay',          value: stats?.todayOrders ?? '—',                             color: '#FF4E8E', tab: 'orders' },
    { icon: '💰', label: 'Doanh thu hôm nay',     value: stats ? formatPrice(stats.completedRevenue) : '—',    color: '#22c55e', tab: null },
    { icon: '🎉', label: 'Hoàn thành hôm nay',   value: stats?.completedOrders ?? '—',                         color: '#10b981', tab: 'orders' },
    { icon: '⏳', label: 'Đang xử lý hôm nay',   value: stats?.pendingOrders ?? '—',                           color: '#f59e0b', tab: 'orders' },
  ];

  return (
    <div className="dash">
      {/* Stat cards */}
      <div className="dash-grid">
        {cards.map((c) => (
          <div key={c.label} className={`dash-card ${c.tab ? 'clickable' : ''}`}
            onClick={() => c.tab && onNavigate(c.tab)}>
            <div className="dash-card__icon" style={{ background: c.color + '18', color: c.color }}>{c.icon}</div>
            <div className="dash-card__value">{c.value}</div>
            <div className="dash-card__label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Hình thức + Top món */}
      <div className="dash-bottom">
        {/* Theo hình thức */}
        <div className="dash-section">
          <h3 className="dash-section__title">🍽️ Theo hình thức đặt hàng hôm nay</h3>
          <div className="type-cards">
            {[
              { key:'dine_in',  icon:'🪑', label:'Ăn tại quán', color:'#3b82f6' },
              { key:'delivery', icon:'🛵', label:'Giao hàng',   color:'#22c55e' },
            ].map((t) => {
              const ts = stats?.typeStats?.[t.key] || { count:0, revenue:0 };
              return (
                <div key={t.key} className="type-card" style={{ borderTopColor: t.color }}>
                  <div className="type-card__head" style={{ color: t.color }}>{t.icon} {t.label}</div>
                  <div className="type-card__count">{ts.count} đơn</div>
                  <div className="type-card__rev">{formatPrice(ts.revenue)}</div>
                  <div className="type-card__rev-label">đã thanh toán</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top món bán chạy */}
        <div className="dash-section">
          <h3 className="dash-section__title">🔥 Món bán chạy nhất</h3>
          {!stats?.topProducts?.length ? (
            <div className="dash-empty">Chưa có dữ liệu</div>
          ) : (
            <div className="top-products">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="top-product-row">
                  <span className="top-product-rank" style={{ background: i < 3 ? '#FF4E8E22' : '#f3f4f6', color: i < 3 ? '#FF4E8E' : '#6b7280' }}>#{i + 1}</span>
                  <span className="top-product-name">{p._id}</span>
                  <span className="top-product-count">×{p.count}</span>
                  <span className="top-product-rev">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ status:'', orderType:'', search:'' });
  const [shippers, setShippers] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll(filters);
      setOrders(res.data || []);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    usersAPI.getAll({ role: 'shipper' }).then((r) => setShippers(r.data || [])).catch(() => {});
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await ordersAPI.updateStatus(id, { status });
      toast.success('Đã cập nhật trạng thái');
      load();
      if (selected?._id === id) { const r = await ordersAPI.getById(id); setSelected(r.data); }
    } catch (err) { toast.error(err.message); }
  };

  const assignShipper = async (id, shipperId) => {
    try {
      await ordersAPI.assignShipper(id, { shipperId: shipperId || null });
      toast.success(shipperId ? 'Đã gán shipper' : 'Đã bỏ gán shipper');
      load();
      if (selected?._id === id) { const r = await ordersAPI.getById(id); setSelected(r.data); }
    } catch (err) { toast.error(err.message); }
  };

  const ORDER_TYPE_OPTS = [
    { value:'',        label:'Tất cả' },
    { value:'dine_in', label:'🪑 Tại quán' },
      { value:'delivery',label:'🛵 Giao hàng' },
  ];

  return (
    <div className="admin-tab">
      {/* Toolbar */}
      <div className="tab-toolbar">
        <input className="form-input search-input" placeholder="Tìm mã đơn, tên, SĐT..."
          value={filters.search} onChange={(e) => setFilters(f => ({...f, search: e.target.value}))}
          onKeyDown={(e) => e.key === 'Enter' && load()} />
        <select className="form-select" value={filters.status}
          onChange={(e) => setFilters(f => ({...f, status: e.target.value}))}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select className="form-select" value={filters.orderType}
          onChange={(e) => setFilters(f => ({...f, orderType: e.target.value}))}>
          {ORDER_TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄</button>
      </div>

      <div className="split-layout">
        {/* List */}
        <div className="split-list">
          {loading ? Array(6).fill(0).map((_,i) => (
            <div key={i} className="skeleton" style={{ height:84, borderRadius:12, marginBottom:8 }} />
          )) : orders.length === 0 ? (
            <div className="empty-state" style={{ padding:'40px 0' }}>
              <div className="empty-icon">📦</div>
              <div className="empty-title">Không có đơn hàng</div>
            </div>
          ) : orders.map((o) => {
            const sm = STATUS_META[o.status] || {};
            const typeIcon = o.orderType === 'dine_in' ? '🪑' : '🛵';
            return (
              <div key={o._id} className={`order-row ${selected?._id === o._id ? 'active' : ''}`}
                onClick={() => setSelected(o)}>
                <div className="order-row__top">
                  <span className="order-row__num">{typeIcon} {o.orderNumber}</span>
                  <span className="s-badge" style={{ background: sm.bg, color: sm.color }}>{sm.icon} {sm.label}</span>
                </div>
                <div className="order-row__mid">
                  <span>👤 {o.customer.name}</span>
                  <span className="price">{formatPrice(o.total)}</span>
                </div>
                <div className="order-row__bot">
                  <span>{new Date(o.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div className="split-detail">
          {!selected ? (
            <div className="detail-empty"><span>📦</span><p>Chọn đơn để xem chi tiết</p></div>
          ) : (
            <div className="order-detail-full">
              {/* Header */}
              <div className="odf-header">
                <h3>{selected.orderNumber}</h3>
                <span>{new Date(selected.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              {/* Khách + hình thức */}
              <div className="odf-section">
                <div className="odf-label">Khách hàng</div>
                <p><strong>{selected.customer.name}</strong> · {selected.customer.phone}</p>
                {selected.customer.address && <p>📍 {selected.customer.address}</p>}
                {selected.tableNumber && <p>🪑 Bàn {selected.tableNumber}</p>}
                {selected.note && <p>📝 {selected.note}</p>}
              </div>

              {/* Món */}
              <div className="odf-section">
                <div className="odf-label">Món đã đặt</div>
                {selected.items.map((item, i) => (
                  <div key={i} className="odf-item">
                    <span>×{item.quantity} {item.name}</span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
                {selected.deliveryFee > 0 && (
                  <div className="odf-item">
                    <span>🛵 Phí giao hàng</span>
                    <span>{formatPrice(selected.deliveryFee)}</span>
                  </div>
                )}
                <div className="odf-item odf-item--total">
                  <strong>Tổng cộng</strong>
                  <strong className="price">{formatPrice(selected.total)}</strong>
                </div>
              </div>

              {/* Trạng thái đơn */}
              <div className="odf-section">
                <div className="odf-label">Cập nhật trạng thái</div>
                <div className="status-btn-grid">
                  {Object.entries(STATUS_META)
                    .filter(([k]) => {
                      // Ẩn "Đang giao" và "Đã giao" với đơn ăn tại quán
                      if (selected.orderType === 'dine_in' && (k === 'delivering' || k === 'delivered')) return false;
                      return true;
                    })
                    .map(([k, v]) => (
                    <button key={k}
                      className={`status-btn ${selected.status === k ? 'active' : ''}`}
                      style={{ '--sc': v.color, '--sb': v.bg }}
                      onClick={() => selected.status !== k && updateStatus(selected._id, k)}
                      disabled={selected.status === k}>
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gán shipper (chỉ delivery) */}
              {selected.orderType === 'delivery' && (
                <div className="odf-section">
                  <div className="odf-label">Gán shipper</div>
                  <select className="form-select"
                    value={selected.assignedShipper?._id || ''}
                    onChange={(e) => assignShipper(selected._id, e.target.value)}>
                    <option value="">— Chưa gán —</option>
                    {shippers.filter(s => s.isActive).map((s) => (
                      <option key={s._id} value={s._id}>{s.icon || '🛵'} {s.name} (@{s.username})</option>
                    ))}
                  </select>
                  {selected.assignedShipper && (
                    <div className="shipper-assigned">
                      🛵 Đang giao: <strong>{selected.assignedShipper.name}</strong>
                    </div>
                  )}
                </div>
              )}


            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', price:'', originalPrice:'', category:'', image:'', isFeatured:false, isNew:false, isAvailable:true, preparationTime:15, tags:'' });

  const load = async () => {
    setLoading(true);
    try {
      const [pr, cr] = await Promise.all([productsAPI.getAll({ limit:100 }), categoriesAPI.getAll()]);
      setProducts(pr.data || []); setCategories(cr.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ name:'',description:'',price:'',originalPrice:'',category:'',image:'',isFeatured:false,isNew:false,isAvailable:true,preparationTime:15,tags:'' }); setShowForm(true); };
  const openEdit   = (p)  => { setEditItem(p); setForm({ name:p.name,description:p.description,price:p.price,originalPrice:p.originalPrice||'',category:p.category?._id||'',image:p.image,isFeatured:p.isFeatured,isNew:p.isNew,isAvailable:p.isAvailable,preparationTime:p.preparationTime,tags:(p.tags||[]).join(', ') }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : null, tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [] };
    try {
      editItem ? await productsAPI.update(editItem._id, data) : await productsAPI.create(data);
      toast.success(editItem ? 'Đã cập nhật món' : 'Đã thêm món mới');
      setShowForm(false); load();
    } catch (err) { toast.error(err.message); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Xóa món này?')) return;
    try { await productsAPI.delete(id); toast.success('Đã xóa'); load(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div className="admin-tab">
      <div className="tab-toolbar">
        <h3 className="tab-title">Quản lý món ăn ({products.length})</h3>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm món</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editItem ? 'Sửa món ăn' : 'Thêm món mới'}</h3>
              <button className="modal__close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal__form">
              <div className="modal-grid">
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Tên món *</label>
                  <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{resize:'vertical'}} />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá (VNĐ) *</label>
                  <input className="form-input" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá gốc (để trống nếu không giảm giá)</label>
                  <input className="form-input" type="number" value={form.originalPrice} onChange={e=>setForm({...form,originalPrice:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục *</label>
                  <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} required>
                    <option value="">-- Chọn --</option>
                    {categories.map(c=><option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Thời gian nấu (phút)</label>
                  <input className="form-input" type="number" value={form.preparationTime} onChange={e=>setForm({...form,preparationTime:e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">URL ảnh</label>
                  <input className="form-input" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} placeholder="https://..." />
                  {form.image && <img src={form.image} alt="" style={{marginTop:8,height:80,borderRadius:8,objectFit:'cover'}} onError={e=>e.target.style.display='none'} />}
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Tags (phân cách bằng dấu phẩy)</label>
                  <input className="form-input" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="đặc sản, cay, mới..." />
                </div>
                <div className="form-group form-group--check" style={{gridColumn:'1/-1'}}>
                  {[['isFeatured','⭐ Nổi bật'],['isNew','🆕 Mới'],['isAvailable','✅ Còn phục vụ']].map(([k,l])=>(
                    <label key={k} className="check-label">
                      <input type="checkbox" checked={form[k]} onChange={e=>setForm({...form,[k]:e.target.checked})} />{l}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editItem ? '💾 Lưu' : '✨ Thêm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="data-table">
          <table>
            <thead><tr><th>Ảnh</th><th>Tên món</th><th>Danh mục</th><th>Giá</th><th>Tags</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td><img src={p.image} alt={p.name} className="table-img" onError={e=>{e.target.style.display='none'}} /></td>
                  <td>
                    <div className="cell-name">{p.name}</div>
                    <div className="cell-sub">⏱ {p.preparationTime}p</div>
                  </td>
                  <td>{p.category?.icon} {p.category?.name}</td>
                  <td>
                    <div className="price">{formatPrice(p.price)}</div>
                    {p.originalPrice && <div style={{fontSize:11,color:'var(--text-muted)',textDecoration:'line-through'}}>{formatPrice(p.originalPrice)}</div>}
                  </td>
                  <td>
                    <div className="tag-list">
                      {(p.tags||[]).map(t=><span key={t} className="tag-chip">{t}</span>)}
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {p.isFeatured && <span className="badge badge-pink" style={{fontSize:10}}>Nổi bật</span>}
                      {p.isNew && <span className="badge badge-green" style={{fontSize:10}}>Mới</span>}
                      <span className={`badge ${p.isAvailable ? 'badge-green' : 'badge-red'}`} style={{fontSize:10}}>{p.isAvailable ? 'Còn hàng' : 'Hết hàng'}</span>
                    </div>
                  </td>
                  <td><div className="admin-actions">
                    <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(p)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(p._id)}>🗑️</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────
function CategoriesTab() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name:'', icon:'🍽️', description:'', order:0 });

  const load = async () => {
    setLoading(true);
    try { const r = await categoriesAPI.getAll(); setCats(r.data || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ name:'', icon:'🍽️', description:'', order: cats.length+1 }); setShowForm(true); };
  const openEdit   = (c) => { setEditItem(c); setForm({ name:c.name, icon:c.icon, description:c.description||'', order:c.order||0 }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editItem ? await categoriesAPI.update(editItem._id, form) : await categoriesAPI.create(form);
      toast.success(editItem ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
      setShowForm(false); load();
    } catch (err) { toast.error(err.message); }
  };

  const moveOrder = async (id, direction) => {
    const idx  = cats.findIndex(c => c._id === id);
    const next = idx + direction;
    if (next < 0 || next >= cats.length) return;
    const updated = [...cats];
    [updated[idx].order, updated[next].order] = [updated[next].order, updated[idx].order];
    try {
      await categoriesAPI.reorder(updated.map(c => ({ id: c._id, order: c.order })));
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa danh mục này?')) return;
    try { await categoriesAPI.delete(id); toast.success('Đã xóa'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const ICON_SUGGESTIONS = ['🍽️','🏮','🌶️','🌴','🍜','🍛','🥗','🍖','🫕','🥤','🍮'];

  return (
    <div className="admin-tab">
      <div className="tab-toolbar">
        <h3 className="tab-title">Quản lý danh mục ({cats.length})</h3>
        <button className="btn btn-primary" onClick={openCreate}>+ Tạo danh mục</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal scale-in" onClick={e=>e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editItem ? 'Sửa danh mục' : 'Tạo danh mục mới'}</h3>
              <button className="modal__close" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal__form">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Tên danh mục *</label>
                  <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Thứ tự</label>
                  <input className="form-input" type="number" value={form.order} onChange={e=>setForm({...form,order:Number(e.target.value)})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Icon</label>
                  <div className="icon-picker">
                    {ICON_SUGGESTIONS.map(ic=>(
                      <button key={ic} type="button"
                        className={`icon-btn ${form.icon === ic ? 'active' : ''}`}
                        onClick={()=>setForm({...form,icon:ic})}>{ic}</button>
                    ))}
                    <input className="form-input" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} style={{width:60,textAlign:'center'}} />
                  </div>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Mô tả</label>
                  <input className="form-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editItem ? '💾 Lưu' : '✨ Tạo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="cat-list">
          {cats.sort((a,b)=>a.order-b.order).map((c,i)=>(
            <div key={c._id} className="cat-row">
              <div className="cat-row__order">
                <button className="order-btn" onClick={()=>moveOrder(c._id,-1)} disabled={i===0}>▲</button>
                <span>{c.order}</span>
                <button className="order-btn" onClick={()=>moveOrder(c._id,1)} disabled={i===cats.length-1}>▼</button>
              </div>
              <div className="cat-row__icon">{c.icon}</div>
              <div className="cat-row__info">
                <div className="cat-row__name">{c.name}</div>
                {c.description && <div className="cat-row__desc">{c.description}</div>}
              </div>
              <div className="admin-actions">
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(c)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(c._id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState({ username:'', name:'', password:'', role:'staff', phone:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await usersAPI.getAll({ role: roleFilter }); setUsers(r.data || []); }
    finally { setLoading(false); }
  }, [roleFilter]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditUser(null); setForm({ username:'',name:'',password:'',role:'staff',phone:'' }); setShowForm(true); };
  const openEdit   = (u) => { setEditUser(u); setForm({ username:u.username,name:u.name,password:'',role:u.role,phone:u.phone||'' }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const d = { name:form.name, role:form.role, phone:form.phone };
        if (form.password) d.password = form.password;
        await usersAPI.update(editUser._id, d);
        toast.success('Đã cập nhật tài khoản');
      } else {
        if (!form.password) { toast.error('Vui lòng nhập mật khẩu'); return; }
        await usersAPI.create(form);
        toast.success('Đã tạo tài khoản');
      }
      setShowForm(false); load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="admin-tab">
      <div className="tab-toolbar">
        <select className="form-select" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{width:'auto'}}>
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLE_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄</button>
        <button className="btn btn-primary" onClick={openCreate}>+ Tạo tài khoản</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal scale-in" onClick={e=>e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editUser ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}</h3>
              <button className="modal__close" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal__form">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input className="form-input" value={form.username} disabled={!!editUser}
                    onChange={e=>setForm({...form,username:e.target.value.toLowerCase()})} required={!editUser} />
                </div>
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{editUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}</label>
                  <input className="form-input" type="password" value={form.password} placeholder="Tối thiểu 6 ký tự"
                    onChange={e=>setForm({...form,password:e.target.value})} required={!editUser} />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Phân quyền</label>
                  <div className="role-pick-grid">
                    {Object.entries(ROLE_META).filter(([k])=>!['admin','kitchen','customer'].includes(k)).map(([k,v])=>(
                      <button key={k} type="button"
                        className={`role-pick-btn ${form.role===k?'active':''}`}
                        style={{'--rc':v.color}}
                        onClick={()=>setForm({...form,role:k})}>
                        <span>{v.icon}</span><span>{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editUser ? '💾 Lưu' : '✨ Tạo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading-container"><div className="spinner"/></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Username</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const rm = ROLE_META[u.role] || ROLE_META.customer;
                return (
                  <tr key={u._id} className={!u.isActive ? 'row-inactive' : ''}>
                    <td>
                      <div className="table-user-name">
                        <span className="table-avatar" style={{background:rm.color+'22',color:rm.color}}>{u.name?.[0]?.toUpperCase()}</span>
                        {u.name}
                      </div>
                    </td>
                    <td className="text-muted">@{u.username}</td>
                    <td className="text-muted">{u.phone || '—'}</td>
                    <td><span className="role-badge" style={{background:rm.color+'22',color:rm.color}}>{rm.icon} {rm.label}</span></td>
                    <td><span className={`status-dot2 ${u.isActive?'on':'off'}`}>{u.isActive?'● Hoạt động':'● Đã khoá'}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(u)}>✏️</button>
                        <button className="btn btn-sm" style={{background:u.isActive?'#FEF3C7':undefined,color:u.isActive?'#92400E':undefined}}
                          onClick={async()=>{ try { await usersAPI.toggle(u._id); toast.success(u.isActive?'Đã khoá':'Đã mở khoá'); load(); } catch(err){toast.error(err.message);} }}>
                          {u.isActive?'🔒':'🔓'}
                        </button>
                        {u.role!=='admin'&&<button className="btn btn-danger btn-sm"
                          onClick={async()=>{ if(!window.confirm('Xóa tài khoản?'))return; try{await usersAPI.delete(u._id);toast.success('Đã xóa');load();}catch(err){toast.error(err.message);} }}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await reviewsAPI.getAll({ limit: 30 }); setReviews(r.data || []); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    try { await reviewsAPI.delete(id); toast.success('Đã xóa'); load(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div className="admin-tab">
      <div className="tab-toolbar">
        <div className="tab-title">Quản lý đánh giá ({reviews.length})</div>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄</button>
      </div>
      {loading ? <div className="loading-container"><div className="spinner"/></div> : reviews.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">⭐</div><div className="empty-title">Không có đánh giá</div></div>
      ) : (
        <div className="review-table-wrap">
          <table className="review-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Người dùng</th>
                <th>Món ăn</th>
                <th>Sao</th>
                <th>Nội dung</th>
                <th>Ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r, idx) => (
                <tr key={r._id}>
                  <td className="rt-idx">{idx + 1}</td>
                  <td className="rt-user">
                    <div className="rt-avatar">{r.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div className="rt-name">{r.name}</div>
                      <div className="rt-username">@{r.username}</div>
                    </div>
                  </td>
                  <td className="rt-product">{r.product?.name || '—'}</td>
                  <td className="rt-stars">
                    <span className="rt-stars-fill">{'★'.repeat(r.rating)}</span>
                    <span className="rt-stars-empty">{'★'.repeat(5 - r.rating)}</span>
                    <span className="rt-rating-num">{r.rating}/5</span>
                  </td>
                  <td className="rt-comment">{r.comment}</td>
                  <td className="rt-date">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="rt-actions">
                    <button className="btn btn-danger btn-sm" onClick={() => del(r._id)} title="Xóa">
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DELIVERY (Admin view)
// ─────────────────────────────────────────────────────────────
function DeliveryTab() {
  const [shippers, setShippers]   = useState([]);
  const [activeOrders, setActive] = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, or] = await Promise.all([
        usersAPI.getAll({ role: 'shipper' }),
        ordersAPI.getAll({ status: 'delivering', orderType: 'delivery' }),
      ]);
      setShippers(sr.data || []);
      setActive(or.data || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  return (
    <div className="admin-tab">
      <div className="tab-toolbar">
        <div className="tab-title">Theo dõi giao hàng</div>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Làm mới</button>
        <span style={{fontSize:12,color:'var(--text-muted)'}}>Tự cập nhật mỗi 30s</span>
      </div>
      {loading ? <div className="loading-container"><div className="spinner"/></div> : (
        <div className="delivery-layout">
          {/* Danh sách shipper */}
          <div className="delivery-section">
            <h3 className="delivery-section__title">👥 Danh sách Shipper ({shippers.length})</h3>
            {shippers.map(s=>{
              const myOrders = activeOrders.filter(o=>o.assignedShipper?._id===s._id);
              return (
                <div key={s._id} className={`shipper-card2 ${!s.isActive?'inactive':''}`}>
                  <div className="sc2-avatar">{s.name?.[0]?.toUpperCase()}</div>
                  <div className="sc2-info">
                    <div className="sc2-name">{s.name}</div>
                    <div className="sc2-un">@{s.username} · {s.phone||'N/A'}</div>
                  </div>
                  <div className="sc2-right">
                    <div className={`sc2-status ${s.isActive?'on':'off'}`}>{s.isActive?'● Online':'● Offline'}</div>
                    <div className="sc2-orders">{myOrders.length} đơn đang giao</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Đơn đang giao */}
          <div className="delivery-section">
            <h3 className="delivery-section__title">🛵 Đơn đang giao ({activeOrders.length})</h3>
            {activeOrders.length===0 ? (
              <div className="dash-empty">Không có đơn đang giao</div>
            ) : activeOrders.map(o=>(
              <div key={o._id} className="delivery-order-card">
                <div className="doc-top">
                  <span className="doc-num">{o.orderNumber}</span>
                  {o.assignedShipper
                    ? <span className="doc-shipper">🛵 {o.assignedShipper.name}</span>
                    : <span className="doc-shipper unassigned">⚠️ Chưa gán shipper</span>}
                </div>
                <div className="doc-customer">👤 {o.customer.name} · 📞 {o.customer.phone}</div>
                <div className="doc-address">📍 {o.customer.address}</div>
                <div className="doc-total price">{formatPrice(o.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// DELIVERY SELF (shipper view)
// ─────────────────────────────────────────────────────────────
function DeliverySelfTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await ordersAPI.getAll({}); setOrders(r.data||[]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  // Nhận đơn: tự assign + chuyển sang delivering
  const pickup = async (id) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await ordersAPI.pickupOrder(id);
      toast.success('🛵 Đã nhận đơn, bắt đầu giao!');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  // Đánh dấu đã giao
  const markDelivered = async (id) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await ordersAPI.updateStatus(id, { status: 'delivered' });
      toast.success('📦 Đã giao hàng thành công!');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const readyOrders     = orders.filter(o => o.status === 'cooked' && o.orderType === 'delivery');
  const deliveringOrders = orders.filter(o => o.status === 'delivering' && o.assignedShipper?._id === user?._id);
  const deliveredOrders  = orders.filter(o => o.status === 'delivered'  && o.assignedShipper?._id === user?._id);

  const OrderCard = ({ o, children }) => (
    <div className="delivery-order-card">
      <div className="doc-top">
        <span className="doc-num">{o.orderNumber}</span>
        <span className="doc-total price">{formatPrice(o.total)}</span>
      </div>
      <div className="doc-customer">👤 {o.customer.name} · 📞 {o.customer.phone}</div>
      {o.customer.address && <div className="doc-address">📍 {o.customer.address}</div>}
      {o.note && <div className="doc-note">📝 {o.note}</div>}
      {children}
    </div>
  );

  return (
    <div className="admin-tab">
      <div className="tab-toolbar">
        <div className="tab-title">🛵 Bảng giao hàng của tôi</div>
        <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
          {loading ? '...' : '🔄'}
        </button>
      </div>

      <div className="shipper-board" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>

        {/* Cột 1: Sẵn sàng giao */}
        <div className="shipper-col2">
          <div className="sc2-head" style={{ borderTopColor: '#10b981' }}>
            🍱 Sẵn sàng giao
            <span className="kc-count" style={{ background: '#10b98122', color: '#10b981' }}>{readyOrders.length}</span>
          </div>
          {readyOrders.length === 0 && <div className="empty-col">Không có đơn nào</div>}
          {readyOrders.map(o => (
            <OrderCard key={o._id} o={o}>
              <button
                className="btn btn-sm"
                style={{ background: '#f97316', color: '#fff', marginTop: 8, width: '100%' }}
                onClick={() => pickup(o._id)}
                disabled={busy[o._id]}
              >
                {busy[o._id] ? '...' : '🛵 Nhận & Bắt đầu giao'}
              </button>
            </OrderCard>
          ))}
        </div>

        {/* Cột 2: Đang giao */}
        <div className="shipper-col2">
          <div className="sc2-head" style={{ borderTopColor: '#f97316' }}>
            🛵 Đang giao
            <span className="kc-count" style={{ background: '#f9731622', color: '#f97316' }}>{deliveringOrders.length}</span>
          </div>
          {deliveringOrders.length === 0 && <div className="empty-col">Chưa có đơn đang giao</div>}
          {deliveringOrders.map(o => (
            <OrderCard key={o._id} o={o}>
              <button
                className="btn btn-sm"
                style={{ background: '#0ea5e9', color: '#fff', marginTop: 8, width: '100%' }}
                onClick={() => markDelivered(o._id)}
                disabled={busy[o._id]}
              >
                {busy[o._id] ? '...' : '📦 Xác nhận đã giao'}
              </button>
            </OrderCard>
          ))}
        </div>

        {/* Cột 3: Đã giao */}
        <div className="shipper-col2">
          <div className="sc2-head" style={{ borderTopColor: '#0ea5e9' }}>
            ✅ Đã giao hôm nay
            <span className="kc-count" style={{ background: '#0ea5e922', color: '#0ea5e9' }}>{deliveredOrders.length}</span>
          </div>
          {deliveredOrders.length === 0 && <div className="empty-col">Chưa có đơn hoàn thành</div>}
          {deliveredOrders.map(o => (
            <OrderCard key={o._id} o={o}>
              <div style={{ marginTop: 8, padding: '6px 10px', background: '#f0fdf4', borderRadius: 8,
                fontSize: 12, color: '#16a34a', fontWeight: 700, textAlign: 'center' }}>
                ✅ Đã giao thành công
              </div>
            </OrderCard>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.staff;
  const [activeTab, setActiveTab] = useState(roleConfig.tabs[0]);

  useEffect(() => { setActiveTab(roleConfig.tabs[0]); }, [user?.role]);

  const handleLogout = () => { logout(); navigate('/admin/login'); toast.success('Đã đăng xuất'); };

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <LotusLogo size={34} />
          <div>
            <div className="sidebar-brand">Bếp Việt</div>
            <div className="sidebar-sub">Admin</div>
          </div>
        </div>

        <div className="sidebar-role-badge" style={{ background: roleConfig.color+'22', color: roleConfig.color }}>
          {roleConfig.icon} {roleConfig.label}
        </div>

        <nav className="admin-nav">
          {roleConfig.tabs.map(tab => (
            <button key={tab}
              className={`admin-nav__btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? { '--ac': roleConfig.color } : {}}>
              <span className="nav-icon">{TAB_META[tab]?.icon}</span>
              <span>{TAB_META[tab]?.label}</span>
            </button>
          ))}
          <a href="/" className="admin-nav__btn" target="_blank" rel="noreferrer">
            <span className="nav-icon">🌐</span><span>Xem website</span>
          </a>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <div className="admin-user__avatar" style={{ background: roleConfig.color+'22', color: roleConfig.color }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="admin-user__name">{user?.name}</div>
              <div className="admin-user__role">@{user?.username}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm admin-logout" onClick={handleLogout}>↩ Đăng xuất</button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main admin-main--with-mobile-nav">
        <div className="admin-main__header">
          <h2 className="admin-main__title">{TAB_META[activeTab]?.icon} {TAB_META[activeTab]?.label}</h2>
          <div className="admin-main__date">
            {new Date().toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </div>
        </div>

        <div className="admin-main__body">
          {activeTab === 'dashboard'     && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'orders'        && <OrdersTab />}
          {activeTab === 'products'      && <ProductsTab />}
          {activeTab === 'categories'    && <CategoriesTab />}
          {activeTab === 'users'         && <UsersTab />}
          {activeTab === 'reviews'       && <ReviewsTab />}
          {activeTab === 'delivery'      && <DeliveryTab />}
          {activeTab === 'delivery_self' && <DeliverySelfTab />}
        </div>
      </main>

      {/* Mobile bottom navigation — hiện thay sidebar trên điện thoại */}
      <nav className="admin-mobile-nav">
        <div className="admin-mobile-nav__items">
          {roleConfig.tabs.map(tab => (
            <button
              key={tab}
              className={`admin-mobile-nav__item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? { color: roleConfig.color } : {}}
            >
              <span className="admin-mobile-nav__icon">{TAB_META[tab]?.icon}</span>
              <span className="admin-mobile-nav__label">{TAB_META[tab]?.shortLabel || TAB_META[tab]?.label}</span>
            </button>
          ))}
          <button className="admin-mobile-nav__item" onClick={handleLogout}>
            <span className="admin-mobile-nav__icon">↩</span>
            <span className="admin-mobile-nav__label">Thoát</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
