import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../lib/store'
import { calcBazi, calcZiwei } from '../lib/calc'

type Tab = 'bazi' | 'ziwei' | 'astro'

export default function Reading() {
  const profile = useUserStore(s => s.profile)
  const [tab, setTab] = useState<Tab>('bazi')

  // 用 useMemo 缓存计算（避免每次切 tab 重算）
  const baziCalc = useMemo(() => safeRun(() => profile && calcBazi(profile)), [profile])
  const ziweiCalc = useMemo(() => safeRun(() => profile && calcZiwei(profile)), [profile])
  // 占星模块带 Node 依赖，单独异步加载并容错
  const [astroCalc, setAstroCalc] = useState<{ value?: any; error: string; loading: boolean }>(
    { value: undefined, error: '', loading: true }
  )
  useEffect(() => {
    let alive = true
    if (!profile) { setAstroCalc({ value: undefined, error: '', loading: false }); return }
    setAstroCalc({ value: undefined, error: '', loading: true })
    import('../lib/calc')
      .then(m => m.calcAstrology(profile))
      .then(value => { if (alive) setAstroCalc({ value, error: '', loading: false }) })
      .catch(e => { if (alive) setAstroCalc({ value: undefined, error: e?.message ?? String(e), loading: false }) })
    return () => { alive = false }
  }, [profile])

  if (!profile) {
    return (
      <div className="card text-center py-16">
        <p className="text-amber-100/70 mb-4">请先在首页填写出生信息</p>
        <Link to="/" className="btn-primary">前往首页</Link>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'bazi',  label: '八字' },
    { key: 'ziwei', label: '紫微斗数' },
    { key: 'astro', label: '西方占星' },
  ]

  return (
    <div className="grid gap-6">
      <div className="card">
        <h3 className="card-title">{profile.name || '无名'} · 命盘</h3>
        <p className="text-amber-100/60 text-sm">
          公历 {profile.year}-{profile.month}-{profile.day} {String(profile.hour).padStart(2,'0')}:{String(profile.minute).padStart(2,'0')}
          {' · '}{profile.gender === 'male' ? '男' : '女'} · {profile.birthPlace}
        </p>
      </div>

      <div className="flex gap-2 border-b border-amber-300/10">
        {tabs.map(t => (
          <button key={t.key}
            className={`px-5 py-2 tracking-widest transition border-b-2 -mb-px ${
              tab === t.key
                ? 'text-amber-200 border-amber-300'
                : 'text-amber-100/50 border-transparent hover:text-amber-200'
            }`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bazi'  && <BaziView calc={baziCalc} />}
      {tab === 'ziwei' && <ZiweiView calc={ziweiCalc} />}
      {tab === 'astro' && <AstroView calc={astroCalc} />}
    </div>
  )
}

// ============================================================
// 八字视图
// ============================================================
function BaziView({ calc }: { calc: ReturnType<typeof safeRun<any>> }) {
  if (calc.error) return <ErrorBox msg={calc.error} />
  const r = calc.value?.result
  if (!r) return null
  const p = r.fourPillars
  const stats = r.fiveStats as Record<string, number>

  return (
    <div className="grid gap-6">
      <div className="card">
        <h4 className="card-title">四柱</h4>
        <div className="grid grid-cols-4 gap-3">
          {(['year','month','day','hour'] as const).map(k => {
            const labels: any = { year:'年柱', month:'月柱', day:'日柱', hour:'时柱' }
            const v = p[k]
            return (
              <div key={k} className="rounded-xl border border-amber-300/20 p-4 text-center relative
                bg-gradient-to-b from-red-900/20 to-amber-300/5">
                {k === 'day' && (
                  <span className="absolute top-2 right-2 text-[10px] bg-red-700 text-white px-1.5 py-0.5 rounded">日主</span>
                )}
                <div className="text-xs text-amber-100/60 tracking-widest mb-2">{labels[k]}</div>
                <div className="text-4xl font-bold text-amber-200 leading-tight">{v.stem}</div>
                <div className="text-4xl font-bold text-amber-100 leading-tight">{v.branch}</div>
                {v.naYin && <div className="text-xs text-amber-100/50 mt-2 tracking-wider">{v.naYin}</div>}
                {v.tenGod && <div className="text-xs text-amber-300/80 mt-1">{v.tenGod}</div>}
              </div>
            )
          })}
        </div>
        {r.taiYuan && (
          <div className="text-xs text-amber-100/60 mt-4 flex gap-4">
            <span>胎元：<b className="text-amber-200">{r.taiYuan}</b></span>
            <span>命宫：<b className="text-amber-200">{r.mingGong}</b></span>
            <span>日主：<b className="text-amber-200">{r.dayMaster}</b></span>
          </div>
        )}
      </div>

      <div className="card">
        <h4 className="card-title">五行统计</h4>
        <div className="grid grid-cols-5 gap-3">
          {(['金','木','水','火','土'] as const).map(el => (
            <div key={el} className="text-center">
              <div className="text-amber-100/60 text-xs tracking-widest mb-1">{el}</div>
              <div className="h-24 relative bg-black/30 rounded-md flex items-end">
                <div className="w-full bg-gradient-to-t from-amber-400 to-amber-200 rounded-md transition"
                  style={{ height: `${Math.min(100, (stats[el] ?? 0) * 12)}%` }} />
                <span className="absolute inset-x-0 top-1 text-amber-100 text-sm font-bold">{(stats[el] ?? 0).toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {Array.isArray(r.relations) && r.relations.length > 0 && (
        <div className="card">
          <h4 className="card-title">支位关系</h4>
          <ul className="grid gap-2 text-sm">
            {r.relations.map((rel: any, i: number) => (
              <li key={i} className="flex items-center gap-3 bg-white/[0.04] rounded-md px-3 py-2">
                <span className="tag">{rel.type}</span>
                <span className="text-amber-100/80">{rel.pillars?.join(' · ')}</span>
                <span className="text-amber-100/50 text-xs ml-auto">{rel.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {calc.value?.daily && <DailyBadge daily={calc.value.daily} algo="八字流日" />}
    </div>
  )
}

// ============================================================
// 紫微视图：12 宫位网格
// ============================================================
function ZiweiView({ calc }: { calc: ReturnType<typeof safeRun<any>> }) {
  if (calc.error) return <ErrorBox msg={calc.error} />
  const r: any = calc.value?.result
  if (!r) return null

  const palaces: any[] = r.palaces ?? r.palaceList ?? r.twelvePalaces ?? []
  if (!palaces.length) {
    return (
      <div className="card">
        <h4 className="card-title">紫微原始数据</h4>
        <RawJson data={r} />
      </div>
    )
  }

  return (
    <div className="card">
      <h4 className="card-title">十二宫</h4>
      <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {palaces.map((pl: any, i: number) => (
          <div key={i} className="rounded-lg border border-amber-300/15 bg-black/20 p-3">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-amber-200 tracking-widest text-sm">{pl.name ?? '宫'}</span>
              <span className="text-amber-100/60 text-xs">{pl.heavenlyStem ?? ''}{pl.earthlyBranch ?? ''}</span>
            </div>
            <div className="text-xs text-amber-100/80 leading-relaxed space-y-1">
              {(pl.majorStars ?? []).slice(0, 6).map((s: any, j: number) => (
                <div key={j} className="text-amber-100">★ {s.name}{s.mutagen ? <span className="ml-1 text-red-300">[{s.mutagen}]</span> : null}</div>
              ))}
              {(pl.minorStars ?? []).slice(0, 6).map((s: any, j: number) => (
                <div key={j} className="text-amber-100/60">· {s.name}</div>
              ))}
            </div>
            {pl.decadalRange && (
              <div className="mt-2 text-[10px] text-amber-100/50">
                大限 {pl.decadalRange[0]}–{pl.decadalRange[1]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 占星视图：行星 + 宫位 + 相位（结构因库而异，做容错）
// ============================================================
function AstroView({ calc }: { calc: { value?: any; error: string; loading: boolean } }) {
  if (calc.loading) {
    return <div className="card text-center py-12 text-amber-100/60">⏳ 占星模块加载中...</div>
  }
  if (calc.error) {
    return (
      <div className="card">
        <h4 className="card-title">西方占星</h4>
        <p className="text-rose-200 text-sm mb-2">占星模块在纯浏览器环境下加载失败：</p>
        <p className="text-amber-100/50 text-xs mb-3 break-all">{calc.error}</p>
        <p className="text-amber-100/60 text-sm">
          该模块依赖 Node 星历库，后续可改接 <code className="text-amber-300">swisseph-wasm</code> 实现浏览器原生计算。
          其余算法（八字 / 紫微 / 小六壬 / 黄历）不受影响。
        </p>
      </div>
    )
  }
  const r: any = calc.value?.result
  if (!r) return null
  const planets: any[] = r.planets ?? r.celestialBodies ?? []
  const aspects: any[] = r.aspects ?? r.natalAspects ?? []

  return (
    <div className="grid gap-6">
      <div className="card">
        <h4 className="card-title">行星落座</h4>
        {planets.length === 0 ? (
          <RawJson data={r} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {planets.map((pl: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-md px-3 py-2 text-sm">
                <span className="text-amber-200 tracking-widest">{pl.name ?? pl.key}</span>
                <span className="text-amber-100/80">{pl.sign ?? pl.signName ?? '—'}</span>
                <span className="text-amber-100/50 text-xs">H{pl.house ?? pl.houseNumber ?? '?'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {aspects.length > 0 && (
        <div className="card">
          <h4 className="card-title">本命相位（前 12 条）</h4>
          <ul className="grid gap-1 text-sm">
            {aspects.slice(0, 12).map((a: any, i: number) => (
              <li key={i} className="flex items-center gap-3 text-amber-100/80">
                <span className="tag">{a.aspect ?? a.type ?? '—'}</span>
                <span>{a.point1 ?? a.from} ↔ {a.point2 ?? a.to}</span>
                <span className="ml-auto text-amber-100/40 text-xs">orb {a.orb ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {calc.value?.daily && <DailyBadge daily={calc.value.daily} algo="今日 Transit" />}
    </div>
  )
}

// ============================================================
// 公用
// ============================================================
function DailyBadge({ daily, algo }: { daily: { score: number; level: string; summary: string }; algo: string }) {
  const color =
    daily.score >= 70 ? 'from-green-500/30 to-emerald-300/10 text-emerald-200' :
    daily.score >= 45 ? 'from-amber-500/30 to-yellow-300/10 text-amber-200' :
                        'from-red-500/30 to-rose-400/10 text-rose-200'
  return (
    <div className={`rounded-2xl border border-amber-300/20 p-5 bg-gradient-to-br ${color} backdrop-blur`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">{Math.round(daily.score)}</span>
        <span className="text-xl tracking-widest">{daily.level}</span>
        <span className="ml-auto text-xs tracking-widest opacity-70">{algo}</span>
      </div>
      <div className="mt-2 text-sm opacity-80">{daily.summary}</div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="card text-rose-200">算法运行出错：{msg}</div>
}

function RawJson({ data }: { data: any }) {
  return (
    <pre className="text-xs text-amber-100/70 max-h-96 overflow-auto bg-black/30 p-3 rounded-lg">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function safeRun<T>(fn: () => T | undefined | null): { value: T | undefined; error: string } {
  try {
    const value = (fn() ?? undefined) as T | undefined
    return { value, error: '' }
  } catch (e: any) {
    return { value: undefined, error: e?.message ?? String(e) }
  }
}
