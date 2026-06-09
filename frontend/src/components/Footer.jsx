import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer__top container">
        <div className="footer__brand">
          <div className="footer__logo">
            <span>🍜</span>
            <span className="footer__name">Bếp Việt</span>
          </div>
          <p className="footer__desc">
            Hương vị truyền thống Việt Nam được chắt lọc qua nhiều thế hệ. 
            Chúng tôi mang đến từng bát phở thơm ngon, đậm đà từ trái tim.
          </p>
          <div className="footer__socials">
            <a href="#" className="footer__social">📘</a>
            <a href="#" className="footer__social">📸</a>
            <a href="#" className="footer__social">🎵</a>
          </div>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Thực Đơn</h4>
          <ul>
            <li><Link to="/menu">Tất cả món ăn</Link></li>
            <li><Link to="/menu/pho-bun">Phở & Bún</Link></li>
            <li><Link to="/menu/com-tam">Cơm Tấm</Link></li>
            <li><Link to="/menu/do-nuong">Đồ Nướng</Link></li>
            <li><Link to="/menu/do-uong">Đồ Uống</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Thông Tin</h4>
          <ul>
            <li><a href="#about">Về chúng tôi</a></li>
            <li><a href="#contact">Liên hệ</a></li>
            <li><Link to="/order-tracking">Tra cứu đơn hàng</Link></li>
            <li><Link to="/admin">Quản trị</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Liên Hệ</h4>
          <ul className="footer__contact">
            <li>📍 123 Nguyễn Huệ, Quận 1, TP.HCM</li>
            <li>📞 0901 234 567</li>
            <li>📧 phovang@gmail.com</li>
            <li>🕐 07:00 – 22:00 (Hằng ngày)</li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom container">
        <p>© 2024 Bếp Việt. Tất cả quyền được bảo lưu.</p>
        <p>Được làm với ❤️ tại Việt Nam</p>
      </div>
    </footer>
  );
}
