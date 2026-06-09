import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text: '👋 Xin chào! Tôi là trợ lý AI của **Bếp Việt**.\nBạn muốn xem thực đơn, hỏi về món ăn hay cần tư vấn gì không? 🍜',
};

const SUGGESTIONS = [
  {
    group: '🍜 Món ăn',
    items: [
      'Hôm nay có món gì ngon?',
      'Món nào phù hợp cho gia đình?',
      'Có món chay không?',
      'Món nào bán chạy nhất?',
    ],
  },
  {
    group: '💰 Giá cả',
    items: [
      'Món nào dưới 80.000đ?',
      'Combo tiết kiệm có không?',
      'Món đắt nhất là bao nhiêu?',
    ],
  },
  {
    group: '💳 Thanh toán',
    items: [
      'Thanh toán bằng gì?',
      'Có nhận chuyển khoản không?',
      'Có thanh toán khi nhận hàng không?',
    ],
  },
  {
    group: '🛵 Đặt hàng',
    items: [
      'Cách đặt hàng như thế nào?',
      'Giao hàng mất bao lâu?',
      'Có ăn tại chỗ không?',
    ],
  },
];

function renderText(text) {
  return text
    .split('\n')
    .map((line, i, arr) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p))}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeGroup, setActiveGroup] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendText = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Gửi toàn bộ lịch sử (bỏ welcome msg), dùng field 'content' cho backend
    const allMsgs = [...messages.filter((m) => m.id !== 'welcome'), userMsg];
    const history = allMsgs.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        }
      );
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: data.message || 'Xin lỗi, có lỗi xảy ra.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: '😞 Không thể kết nối lúc này. Vui lòng thử lại sau.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendText(input.trim());
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };
  const reset = () => { setMessages([WELCOME]); setShowSuggestions(true); };

  return (
    <div className="cw-root">
      {open && (
        <div className="cw-window">
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-left">
              <div className="cw-avatar">🍜</div>
              <div>
                <div className="cw-title">Trợ lý Bếp Việt</div>
                <div className="cw-status"><span className="cw-dot" />Trực tuyến</div>
              </div>
            </div>
            <div className="cw-header-actions">
              <button className="cw-icon-btn" onClick={reset} title="Cuộc trò chuyện mới">↺</button>
              <button className="cw-icon-btn" onClick={() => setOpen(false)} title="Đóng">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="cw-messages">
            {messages.map((m) => (
              <div key={m.id} className={`cw-msg cw-msg--${m.role}`}>
                {m.role === 'assistant' && <div className="cw-msg-avatar">🍜</div>}
                <div className="cw-bubble">{renderText(m.text)}</div>
              </div>
            ))}
            {loading && (
              <div className="cw-msg cw-msg--assistant">
                <div className="cw-msg-avatar">🍜</div>
                <div className="cw-bubble cw-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div className="cw-sugg-panel">
            <button className="cw-sugg-toggle" onClick={() => setShowSuggestions((v) => !v)}>
              <span>💡 Câu hỏi gợi ý</span>
              <span className={`cw-sugg-arrow ${showSuggestions ? 'open' : ''}`}>▾</span>
            </button>
            {showSuggestions && (
              <div className="cw-sugg-body">
                <div className="cw-sugg-tabs">
                  {SUGGESTIONS.map((g, i) => (
                    <button
                      key={i}
                      className={`cw-sugg-tab ${activeGroup === i ? 'active' : ''}`}
                      onClick={() => setActiveGroup(i)}
                    >
                      {g.group}
                    </button>
                  ))}
                </div>
                <div className="cw-sugg-items">
                  {SUGGESTIONS[activeGroup].items.map((s) => (
                    <button key={s} className="cw-chip" onClick={() => sendText(s)} disabled={loading}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="cw-input-row">
            <textarea
              ref={inputRef}
              className="cw-input"
              rows={1}
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className="cw-send-btn" onClick={send} disabled={!input.trim() || loading}>
              ➤
            </button>
          </div>
        </div>
      )}

      <button className={`cw-toggle ${open ? 'cw-toggle--open' : ''}`} onClick={() => setOpen((v) => !v)}>
        {open ? '✕' : '💬'}
        {!open && <span className="cw-toggle-label">Chat với AI</span>}
      </button>
    </div>
  );
}
