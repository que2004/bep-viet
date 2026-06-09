import React, { useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Register form
  const [registerForm, setRegisterForm] = useState({
    username: '', name: '', phone: '', password: '', confirm: '',
  });
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'

  // Kiểm tra username realtime
  const checkUsername = useCallback(async (username) => {
    if (username.length < 3) { setUsernameStatus(null); return; }
    setUsernameStatus('checking');
    try {
      const res = await authAPI.checkUsername(username);
      setUsernameStatus(res.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus(null);
    }
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
    setRegisterForm({ ...registerForm, username: val });
    if (val.length >= 3) checkUsername(val);
    else setUsernameStatus(null);
  };

  // Đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.username, loginForm.password);
      toast.success('Đăng nhập thành công! 🎉');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Username hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    if (usernameStatus === 'taken') { toast.error('Username đã được dùng'); return; }
    if (registerForm.password !== registerForm.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    if (registerForm.password.length < 6) { toast.error('Mật khẩu tối thiểu 6 ký tự'); return; }
    setLoading(true);
    try {
      await authAPI.register({
        username: registerForm.username,
        name: registerForm.name,
        phone: registerForm.phone,
        password: registerForm.password,
      });
      toast.success('Đăng ký thành công! Hãy đăng nhập.');
      setTab('login');
      setLoginForm({ username: registerForm.username, password: '' });
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const usernameHint = {
    checking:  { text: '⏳ Đang kiểm tra...', color: 'var(--text-muted)' },
    available: { text: '✅ Username có thể dùng', color: 'var(--green)' },
    taken:     { text: '❌ Username đã được dùng', color: 'var(--red)' },
  }[usernameStatus];

  return (
    <div className="login-page">
      <div className="login-page__bg" />
      <div className="login-card scale-in">

        {/* Logo */}
        <Link to="/" className="login-card__logo">
          <span>🍜</span>
          <div>
            <div className="login-card__brand">Bếp Việt</div>
            <div className="login-card__tagline">Hương vị quê hương</div>
          </div>
        </Link>

        {/* Tabs */}
        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            Đăng nhập
          </button>
          <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            Đăng ký
          </button>
        </div>

        {/* ── Login form ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="login-form fade-in">
            <p className="login-form__hint">Đăng nhập để đặt hàng và theo dõi đơn hàng</p>

            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">👤</span>
                <input
                  type="text" className="form-input login-input"
                  placeholder="username của bạn"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value.toLowerCase() })}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  type="password" className="form-input login-input"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm" /> Đang xử lý...</> : '🔐 Đăng nhập'}
            </button>

            <p className="login-form__switch">
              Chưa có tài khoản?{' '}
              <button type="button" className="login-form__link" onClick={() => setTab('register')}>
                Đăng ký ngay
              </button>
            </p>
          </form>
        )}

        {/* ── Register form ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="login-form fade-in">
            <p className="login-form__hint">Tạo tài khoản để đặt hàng nhanh hơn</p>

            <div className="form-group">
              <label className="form-label">Tên đăng nhập *</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">👤</span>
                <input
                  type="text" className={`form-input login-input ${usernameStatus === 'taken' ? 'input-error' : usernameStatus === 'available' ? 'input-ok' : ''}`}
                  placeholder="vd: nguyen_van_a (chữ, số, dấu _)"
                  value={registerForm.username}
                  onChange={handleUsernameChange}
                  autoComplete="username"
                  maxLength={30}
                  required
                />
              </div>
              {usernameHint && (
                <span className="login-field-hint" style={{ color: usernameHint.color }}>
                  {usernameHint.text}
                </span>
              )}
              <span className="login-field-sub">Chỉ dùng chữ cái, số và dấu gạch dưới _</span>
            </div>

            <div className="form-group">
              <label className="form-label">Họ và tên *</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">📛</span>
                <input
                  type="text" className="form-input login-input"
                  placeholder="Nguyễn Văn A"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">📞</span>
                <input
                  type="tel" className="form-input login-input"
                  placeholder="0901 234 567"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu *</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  type="password" className="form-input login-input"
                  placeholder="Tối thiểu 6 ký tự"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu *</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔑</span>
                <input
                  type="password" className="form-input login-input"
                  placeholder="Nhập lại mật khẩu"
                  value={registerForm.confirm}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>
              {registerForm.confirm && registerForm.password !== registerForm.confirm && (
                <span className="login-field-hint" style={{ color: 'var(--red)' }}>❌ Mật khẩu không khớp</span>
              )}
              {registerForm.confirm && registerForm.password === registerForm.confirm && registerForm.confirm.length > 0 && (
                <span className="login-field-hint" style={{ color: 'var(--green)' }}>✅ Mật khẩu khớp</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
            >
              {loading ? <><span className="spinner spinner-sm" /> Đang xử lý...</> : '✨ Tạo tài khoản'}
            </button>

            <p className="login-form__switch">
              Đã có tài khoản?{' '}
              <button type="button" className="login-form__link" onClick={() => setTab('login')}>
                Đăng nhập
              </button>
            </p>
          </form>
        )}

        <Link to="/" className="login-card__back">← Tiếp tục mua sắm không cần đăng nhập</Link>
      </div>
    </div>
  );
}
