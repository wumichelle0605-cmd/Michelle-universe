import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: '首页', emoji: '✦' },
  { to: '/reading', label: '我的命盘', emoji: '◈' },
  { to: '/daily', label: '今日运势', emoji: '☉' },
  { to: '/diary', label: '日记', emoji: '✎' },
  { to: '/dashboard', label: '准确率看板', emoji: '◷' },
  { to: '/influencers', label: '大V收藏', emoji: '☆' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-amber-300/10 backdrop-blur sticky top-0 z-10 bg-[#1a0f1e]/70">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border-2 border-amber-300 flex items-center justify-center text-amber-200 font-bold bg-red-900/30 shadow-lg shadow-amber-400/10">
              玄
            </div>
            <h1 className="text-xl font-semibold tracking-[0.3em] text-amber-200">
              玄学综合
            </h1>
          </div>
          <nav className="flex gap-1 flex-wrap text-sm ml-auto">
            {navItems.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md tracking-wider transition ${
                    isActive
                      ? 'bg-amber-300/15 text-amber-200 border border-amber-300/30'
                      : 'text-amber-100/70 hover:text-amber-200 hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                <span className="mr-1 text-amber-300/70">{n.emoji}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-amber-100/40 tracking-widest py-6 border-t border-amber-300/10">
        本站所有结果均由 <a className="underline text-amber-200/70" href="https://www.npmjs.com/package/taibu-core" target="_blank">taibu-core</a> 在你浏览器本地计算 · 不上传任何数据
      </footer>
    </div>
  )
}
