import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../lib/store'
import { calcDailyAggregate } from '../lib/calc'

export default function DailyFortune() {
  const profile = useUserStore(s => s.profile)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const items = useMemo(() => {
    if (!profile) return []
    return calcDailyAggregate(profile, new Date(date + 'T12:00:00'))
  }, [profile, date])

  const valid = items.filter(i => i.daily)
  const avg = valid.length
    ? valid.reduce((s, i) => s + (i.daily!.score), 0) / valid.length
    : 0

  if (!profile) {
    return (
      <div className="card text-center py-16">
        <p className="text-amber-100/70 mb-4">请先在首页填写出生信息</p>
        <Link to="/" className="btn-primary">前往首页</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="card flex items-center gap-4 flex-wrap">
        <h3 className="card-title m-0">查询日期</h3>
        <input type="date" className="field-input max-w-xs"
          value={date} onChange={e => setDate(e.target.value)} />
        <div className="ml-auto text-amber-100/60 text-sm">综合指数 <b className="text-amber-200 text-xl ml-2">{avg.toFixed(1)}</b> / 100</div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.algo} className="card">
            <div className="flex justify-between items-baseline mb-3">
              <h4 className="text-amber-200 tracking-widest text-lg">{item.algo}</h4>
              {item.daily && (
                <span className="tag">{item.daily.level}</span>
              )}
            </div>
            {item.errors ? (
              <div className="text-rose-300 text-sm">运行出错：{item.errors.join('；')}</div>
            ) : item.daily ? (
              <>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-4xl font-bold text-amber-200">{Math.round(item.daily.score)}</span>
                  <span className="text-amber-100/60 text-sm pb-1">/ 100</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400"
                    style={{ width: `${item.daily.score}%` }} />
                </div>
                <div className="text-amber-100/70 text-sm mt-3">{item.daily.summary}</div>
              </>
            ) : (
              <div className="text-amber-100/50 text-sm">未计算出得分</div>
            )}
          </div>
        ))}
      </div>

      <div className="text-amber-100/40 text-xs text-center tracking-wider">
        提示：当日得分由各算法对当日数据的简化解读得出，仅作为对比参考；详细解读请去具体排盘页面查看。
      </div>

      <DailyAggregateSnapshot date={date} items={items} />
    </div>
  )
}

/** 让"今日运势→日记"流程更顺：把当前查看的得分快照打到 localStorage，日记页可一键带入 */
function DailyAggregateSnapshot({ date, items }: { date: string; items: ReturnType<typeof calcDailyAggregate> }) {
  useEffect(() => {
    const snapshot: Record<string, number> = {}
    items.forEach(i => { if (i.daily) snapshot[i.algo] = Math.round(i.daily.score) })
    localStorage.setItem('xuanxue-last-daily', JSON.stringify({ date, snapshot }))
  }, [date, items])
  return null
}
