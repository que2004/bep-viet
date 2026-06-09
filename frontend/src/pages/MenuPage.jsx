import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../api';
import ProductCard from '../components/ProductCard';
import './MenuPage.css';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Mới nhất' },
  { value: 'price', label: 'Giá: Thấp → Cao' },
  { value: '-price', label: 'Giá: Cao → Thấp' },
  { value: '-rating.average', label: 'Đánh giá cao nhất' },
  { value: '-soldCount', label: 'Bán chạy nhất' },
];

export default function MenuPage() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [searchInput, setSearchInput] = useState('');

  // Load categories once
  useEffect(() => {
    categoriesAPI.getAll().then((res) => {
      setCategories(res.data || []);
    });
  }, []);

  // Sync selectedCategory from URL param
  useEffect(() => {
    if (categories.length > 0 && categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      setSelectedCategory(cat || null);
    } else if (!categorySlug) {
      setSelectedCategory(null);
    }
  }, [categorySlug, categories]);

  const loadProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (selectedCategory) params.category = selectedCategory._id;
      if (search) params.search = search;
      const res = await productsAPI.getAll(params);
      setProducts(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search, sort]);

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  const handleCategorySelect = (cat) => {
    if (cat) {
      navigate(`/menu/${cat.slug}`);
    } else {
      navigate('/menu');
    }
    setSelectedCategory(cat);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="menu-page" style={{ paddingTop: 70 }}>
      {/* Header */}
      <div className="menu-header">
        <div className="container">
          <div className="section-tag">🍽️ Thực đơn</div>
          <h1 className="menu-header__title">
            {selectedCategory ? (
              <>{selectedCategory.icon} {selectedCategory.name}</>
            ) : (
              'Tất cả món ăn'
            )}
          </h1>
          <p className="menu-header__sub">
            {pagination.total} món ăn{selectedCategory ? ` trong ${selectedCategory.name}` : ''}
          </p>
        </div>
      </div>

      <div className="container menu-page__inner">
        {/* Sidebar */}
        <aside className="menu-sidebar">
          <div className="menu-sidebar__card">
            <h3 className="menu-sidebar__title">Danh mục</h3>
            <ul className="menu-sidebar__cats">
              <li>
                <button
                  className={`menu-sidebar__cat ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(null)}
                >
                  <span>🍽️</span> Tất cả
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat._id}>
                  <button
                    className={`menu-sidebar__cat ${selectedCategory?._id === cat._id ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <span>{cat.icon}</span> {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <div className="menu-main">
          {/* Toolbar */}
          <div className="menu-toolbar">
            <form onSubmit={handleSearch} className="menu-search">
              <input
                type="text"
                placeholder="Tìm món ăn..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="form-input menu-search__input"
              />
              <button type="submit" className="btn btn-primary btn-sm">🔍</button>
              {search && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setSearch(''); setSearchInput(''); }}
                >✕</button>
              )}
            </form>

            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ width: 'auto' }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Category pills (mobile) */}
          <div className="menu-cats-mobile">
            <button
              className={`cat-pill ${!selectedCategory ? 'active' : ''}`}
              onClick={() => handleCategorySelect(null)}
            >
              🍽️ Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                className={`cat-pill ${selectedCategory?._id === cat._id ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Products */}
          {loading ? (
            <div className="products-grid">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="product-card-skeleton">
                  <div className="skeleton" style={{ height: 200 }} />
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="skeleton" style={{ height: 14, width: '60%' }} />
                    <div className="skeleton" style={{ height: 18 }} />
                    <div className="skeleton" style={{ height: 14, width: '75%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map((p, i) => (
                  <div key={p._id} className="fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      className={`pagination__btn ${pagination.page === pg ? 'active' : ''}`}
                      onClick={() => loadProducts(pg)}
                    >
                      {pg}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">Không tìm thấy món ăn</div>
              <p className="empty-desc">Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
              <button className="btn btn-primary" onClick={() => { setSearch(''); setSearchInput(''); setSelectedCategory(null); navigate('/menu'); }}>
                Xem tất cả món
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
