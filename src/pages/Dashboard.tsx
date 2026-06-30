import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db } from '../lib/db'

const moodScore = { good: 80, fair: 50, bad: 20 } as const

/** Pearson 相关系数 */
function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length
  if (n < 2) return null
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my
    num += a * b; dx += a * a; dy += b * b
  }
  const denom = Math.sqrt(dx * dy)
  if (denom === 0) return null
  return num / denom
}

/** 命中率：算法分>50 ↔ 用户实际 >50，是否同向 */
function hitRate(xs: number[], ys: number[]): number {
  if (xs.length === 0) return 0
  let hit = 0
  xs.forEach((x, i) => {
    const a = x >= 50, b = ys[i] >= 50
    if (a === b) hit++
  })
  return hit / xs.length
}

export default function Dashboard() {
  const entries = useLiveQuery(() => db.diaryEntries.orderBy('date').toArray(), [])

  const stats = useMemo(() => {
    if (!entries?.length) return null
    const algos = new Set<string>()
    entries.forEach(e => Object.keys(e.algoScores).forEach(k => algos.add(k)))
    const userScores = entries.map(e => moodScore[e.mood])

    return Array.from(algos).map(algo => {
      const pairs = entries
        .map((e, idx) => ({ x: e.algoScores[algo], y: userScores[idx] }))
        .filter(p => typeof p.x === 'number')
      const xs = pairs.map(p => p.x), ys = pairs.map(p => p.y)
      return {
        algo,
        n: pairs.length,
        pearson: pearson(xs, ys),
        hitRate: hitRate(xs, ys),
        avgScore: xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0,
      }
    }).sort((a, b) => b.hitRate - a.hitRate)
  }, [entries])

  return (
    <div className="grid gap-6">
      <div className="card">
        <h3 className="card-title">准确率看板</h3>
        <p className="text-amber-100/60 text-sm">
          基于「日记中你勾选的当日感受 vs 算法当日得分」做相关性分析。样本越多结果越可靠（≥7 天才有参考意义）。
        </p>
      </div>

      {!stats?.length ? (
        <div className="card text-center py-12 text-amber-100/60">
          还没有数据。先在「日记」页面记录几天，再回来看哪个算法准。
        </div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead className="text-amber-100/60 text-left">
              <tr>
                <th className="py-2">算法</th>
                <th className="py-2">样本</th>
                <th className="py-2">命中率</th>
                <th className="py-2">相关系数</th>
                <th className="py-2">均分</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.algo} className="border-t border-amber-300/10">
                  <td className="py-3 text-amber-200 tracking-widest">
                    {i === 0 && <span className="mr-1 text-amber-300">★</span>}
                    {s.algo}
                  </td>
                  <td className="py-3 text-amber-100/80">{s.n}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-black/40 rounded overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-300 to-emerald-300"
                          style={{ width: `${s.hitRate * 100}%` }} />
                      </div>
                      <span className="text-amber-200 w-12">{(s.hitRate * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-amber-100/80">
                    {s.pearson == null ? '—' : s.pearson.toFixed(2)}
                  </td>
                  <td className="py-3 text-amber-100/80">{s.avgScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-xs text-amber-100/40 mt-4 leading-relaxed">
            说明：「命中率」= 算法判定吉 与 用户感受好 的同向比例（50 为分界）；「相关系数」绝对值越大相关越强（正值=同向，负值=反向）。
            样本量 &lt; 7 时仅供娱乐。
          </div>
        </div>
      )}
    </div>
  )
}
