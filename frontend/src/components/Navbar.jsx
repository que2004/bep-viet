import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LotusLogo from './LotusLogo';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout, isStaff } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const handleLogout = () => { logout(); toast.success('Đã đăng xuất 👋'); navigate('/'); };

  return (
    <nav ref={menuRef} className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <LotusLogo size={42} />
          <div className="navbar__logo-text">
            <span className="navbar__brand">Bếp Việt</span>
            <span className="navbar__tagline">🌸 Hương vị quê hương</span>
          </div>
        </Link>

        {/* Desktop links */}
        <ul className="navbar__links">
          {[['/', 'Trang Chủ'], ['#about', 'Giới Thiệu'], ['/menu', 'Thực Đơn'], ['#contact', 'Liên Hệ']].map(([path, label]) => (
            <li key={path}>
              {path.startsWith('#') ? (
                <a href={path} className="navbar__link">{label}</a>
              ) : (
                <Link to={path} className={`navbar__link ${isActive(path) && path !== '#' ? 'active' : ''}`}>{label}</Link>
              )}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="navbar__actions">
          <Link to="/cart" className="navbar__cart">
            <span>🛒</span>
            <span className="navbar__cart-text">Giỏ hàng</span>
            {totalItems > 0 && <span className="navbar__cart-badge">{totalItems}</span>}
          </Link>

          {user ? (
            <div className="navbar__user">
              <div className="navbar__user-info">
                <div className="navbar__user-avatar">{user.name?.[0]?.toUpperCase()}</div>
                <span className="navbar__user-name">{user.name?.split(' ').pop()}</span>
                <span className="navbar__chevron">▾</span>
              </div>
              <div className="navbar__user-dropdown">
                <Link to="/orders" className="navbar__dropdown-item">📋 Đơn hàng của tôi</Link>
                {isStaff && <Link to="/admin" className="navbar__dropdown-item">⚙️ Quản trị</Link>}
                <button className="navbar__dropdown-item" onClick={handleLogout}>👋 Đăng xuất</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="navbar__login-btn">👤 Đăng nhập</Link>
          )}

          <button
            className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay backdrop */}
      {menuOpen && (
        <div
          className="navbar__backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar__mobile" role="dialog" aria-label="Mobile menu">
          <ul>
            {[['/', '🏠 Trang Chủ'], ['#about', '📖 Giới Thiệu'], ['/menu', '🍽️ Thực Đơn'], ['#contact', '📞 Liên Hệ'], ['/cart', `🛒 Giỏ Hàng${totalItems > 0 ? ` (${totalItems})` : ''}`]].map(([path, label]) => (
              <li key={path}>
                {path.startsWith('#') ? (
                  <a href={path} className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>{label}</a>
                ) : (
                  <Link to={path} className="navbar__mobile-link">{label}</Link>
                )}
              </li>
            ))}
            {user ? (
              <>
                <li><Link to="/orders" className="navbar__mobile-link">📋 Đơn hàng của tôi</Link></li>
                {isStaff && <li><Link to="/admin" className="navbar__mobile-link">⚙️ Quản trị</Link></li>}
                <li><button className="navbar__mobile-link navbar__mobile-logout" onClick={handleLogout}>👋 Đăng xuất ({user.name})</button></li>
              </>
            ) : (
              <li><Link to="/login" className="navbar__mobile-link">👤 Đăng nhập / Đăng ký</Link></li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
