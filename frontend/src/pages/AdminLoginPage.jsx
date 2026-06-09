import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminLoginPage.css';
import LotusLogo from '../components/LotusLogo';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(form.username, form.password);
      toast.success('Đăng nhập thành công!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Sai tài khoản hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__bg" />
      <div className="admin-login__card scale-in">
        <div className="admin-login__logo">
          <LotusLogo size={44} />
          <div>
            <div className="admin-login__brand">Bếp Việt</div>
            <div className="admin-login__sub">Trang quản trị</div>
          </div>
        </div>

        <h1 className="admin-login__title">Đăng nhập</h1>
        <p className="admin-login__desc">Nhập tên đăng nhập và mật khẩu quản trị viên</p>

        <form onSubmit={handleSubmit} className="admin-login__form">
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              type="text"
              className="form-input"
              placeholder="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <><span className="spinner spinner-sm" /> Đang xử lý...</> : '🔐 Đăng nhập'}
          </button>
        </form>

        <div className="admin-login__hint">
          <span>Demo: </span>
          <code>admin</code>
          <span> / </span>
          <code>admin123</code>
        </div>

        <a href="/" className="admin-login__back">← Quay về trang chủ</a>
      </div>
    </div>
  );
}
