import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home.js';
import Blindtest from './pages/Blindtest.js';
import Rankings from './pages/Rankings.js';
import About from './pages/About.js';
import Onboarding from './pages/Onboarding.js';

// ─── 全局字体 & 动效注入 ───
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  background: #FAF8F4;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif;
  color: #1A1714;
  -webkit-font-smoothing: antialiased;
}
/* 滚动条 */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #D5D0C8; border-radius: 3px; }
/* 输入框聚焦 */
input:focus, select:focus { border-color: #6B5ECD !important; box-shadow: 0 0 0 3px rgba(107,94,205,0.12); outline: none; }
/* 通用卡片进场动画 */
@keyframes card-enter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.card-enter { animation: card-enter 0.45s cubic-bezier(0.4,0,0.2,1) both; }
/* AI 分析加载三点 */
@keyframes dotBounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-5px); opacity: 1; }
}
.ai-dot-1 { animation: dotBounce 1.2s ease infinite 0s; }
.ai-dot-2 { animation: dotBounce 1.2s ease infinite 0.2s; }
.ai-dot-3 { animation: dotBounce 1.2s ease infinite 0.4s; }
/* 进度条展开 */
@keyframes bar-expand { from { transform: scaleX(0); } to { transform: scaleX(1); } }
/* fade-scale */
@keyframes fade-scale { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
.fade-scale { animation: fade-scale 0.4s ease both; }
`;

if (typeof document !== 'undefined') {
  if (!document.querySelector('[data-fatelab-global]')) {
    const st = document.createElement('style');
    st.setAttribute('data-fatelab-global', '1');
    st.textContent = GLOBAL_CSS;
    document.head.appendChild(st);
  }
}

// ─── 是否已看过 onboarding ───
const ONBOARDING_KEY = 'fatelab2_onboarding_done';

const TABS = [
  { path: '/',          label: '🔮 命盘综合' },
  { path: '/blindtest', label: '🎯 盲测实验' },
  { path: '/rankings',  label: '📊 效力榜单' },
  { path: '/about',     label: '✍️ 创作者说' },
];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header style={{
      ...S.header,
      boxShadow: scrolled ? '0 1px 20px rgba(60,48,32,0.08)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
    }}>
      <div style={S.headerInner}>
        {/* Logo */}
        <div style={S.logo} onClick={() => navigate('/')} >
          <span style={S.logoMark}>◆</span>
          <span style={S.logoText}>FateLab 3.0</span>
          <span style={S.logoTag}>玄学效力验证</span>
        </div>

        {/* Nav Tabs */}
        <nav style={S.nav}>
          {TABS.map(tab => {
            const active = location.pathname === tab.path ||
              (tab.path === '/' && location.pathname === '');
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)}
                style={{ ...S.navBtn, ...(active ? S.navActive : {}) }}>
                {tab.label}
                {active && <span style={S.navIndicator} />}
              </button>
            );
          })}
        </nav>

        <div style={S.headerRight}>
          <span style={S.version}>v2.1.0</span>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !sessionStorage.getItem(ONBOARDING_KEY); } catch { return false; }
  });

  const handleFinishOnboarding = () => {
    try { sessionStorage.setItem(ONBOARDING_KEY, '1'); } catch {}
    setShowOnboarding(false);
  };

  return (
    <div style={S.root}>
      {showOnboarding && <Onboarding onFinish={handleFinishOnboarding} />}
      <Header />
      <main style={S.main}>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/blindtest" element={<Blindtest />} />
          <Route path="/rankings"  element={<Rankings />} />
          <Route path="/about"     element={<About />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer style={S.footer}>
        <span style={S.footerText}>FateLab 3.0 · 个人算法实验室 · 让数据说话</span>
      </footer>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column' },
  header: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    background: 'rgba(250,248,244,0.88)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    transition: 'box-shadow 0.3s, border-color 0.3s',
  },
  headerInner: {
    maxWidth: 980, margin: '0 auto', padding: '0 28px',
    display: 'flex', alignItems: 'center', height: 58, gap: 20,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: 'pointer', flexShrink: 0, userSelect: 'none',
  },
  logoMark: { fontSize: 16, color: '#6B5ECD', lineHeight: 1 },
  logoText: { fontSize: 17, fontWeight: 700, color: '#1A1714', letterSpacing: '-0.3px' },
  logoTag: {
    fontSize: 11, color: '#B5AFA6', fontWeight: 400,
    background: '#EDE9E1', padding: '2px 8px', borderRadius: 20,
  },
  nav: { display: 'flex', gap: 2, flex: 1, justifyContent: 'center' },
  navBtn: {
    position: 'relative', padding: '6px 16px', fontSize: 13, fontWeight: 500,
    color: '#7A7268', background: 'transparent', border: 'none',
    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  navActive: { color: '#1A1714', fontWeight: 700 },
  navIndicator: {
    position: 'absolute', bottom: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: 16, height: 2, background: '#6B5ECD', borderRadius: 2,
  },
  headerRight: { flexShrink: 0 },
  version: { fontSize: 11, color: '#B5AFA6' },
  main: { maxWidth: 980, margin: '0 auto', padding: '80px 28px 48px', flex: 1, width: '100%' },
  footer: {
    borderTop: '1px solid #EDE9E1', padding: '20px 28px',
    textAlign: 'center',
  },
  footerText: { fontSize: 12, color: '#B5AFA6', letterSpacing: '1px' },
};
