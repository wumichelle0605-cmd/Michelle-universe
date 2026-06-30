import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { defaultProfile, useUserStore, type BirthProfile } from '../lib/store'

export default function Home() {
  const profile = useUserStore(s => s.profile)
  const setProfile = useUserStore(s => s.setProfile)
  const nav = useNavigate()

  const [form, setForm] = useState<BirthProfile>(profile ?? defaultProfile())
  const upd = <K extends keyof BirthProfile>(k: K, v: BirthProfile[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setProfile(form)
    nav('/reading')
  }

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="text-center mb-2">
          <h2 className="text-3xl font-semibold tracking-[0.4em] text-amber-200 mb-2">玄 学 综 合</h2>
          <p className="text-amber-100/60 tracking-widest text-sm">
            八字 · 紫微 · 占星 · 小六壬 · 黄历 · 日记验证
          </p>
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">出生档案（仅存于本机）</h3>
        <p className="text-amber-100/60 text-sm mb-4">
          所有算法都基于你的出生时间在浏览器本地计算，不会上传任何信息。
        </p>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="field-label">称呼（可选）</div>
              <input className="field-input" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="如：阿玄" />
            </div>
            <div>
              <div className="field-label">性别</div>
              <select className="field-input" value={form.gender} onChange={e => upd('gender', e.target.value as any)}>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {(['year','month','day','hour','minute'] as const).map(k => {
              const labels: Record<string,string> = { year:'年', month:'月', day:'日', hour:'时', minute:'分' }
              const bounds: Record<string,[number,number]> = {
                year:[1900,2100], month:[1,12], day:[1,31], hour:[0,23], minute:[0,59],
              }
              return (
                <div key={k}>
                  <div className="field-label">{labels[k]}</div>
                  <input type="number" className="field-input"
                    min={bounds[k][0]} max={bounds[k][1]} required
                    value={form[k]}
                    onChange={e => upd(k, +e.target.value as any)} />
                </div>
              )
            })}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <div className="field-label">出生地（描述）</div>
              <input className="field-input" value={form.birthPlace}
                onChange={e => upd('birthPlace', e.target.value)} placeholder="如：北京" />
            </div>
            <div>
              <div className="field-label">经度（真太阳时校正）</div>
              <input type="number" step={0.1} className="field-input" value={form.longitude}
                onChange={e => upd('longitude', +e.target.value)} />
            </div>
            <div>
              <div className="field-label">纬度（占星用）</div>
              <input type="number" step={0.1} className="field-input" value={form.latitude}
                onChange={e => upd('latitude', +e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Link to="/daily" className="btn-ghost">仅看今日运势</Link>
            <button type="submit" className="btn-primary">保 存 并 起 盘</button>
          </div>
        </form>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { to:'/reading', title:'我的命盘', desc:'八字 / 紫微 / 占星，多算法同时排盘对照' },
          { to:'/daily',   title:'今日运势', desc:'当日多算法吉凶聚合' },
          { to:'/diary',   title:'日记验证', desc:'记录每日实际遭遇，统计哪个算法更准' },
        ].map(c => (
          <Link key={c.to} to={c.to} className="card hover:border-amber-300/40 hover:bg-white/[0.07] transition">
            <div className="text-amber-200 text-lg font-semibold tracking-widest mb-2">{c.title}</div>
            <div className="text-amber-100/60 text-sm">{c.desc}</div>
          </Link>
        ))}
      </section>
    </div>
  )
}
