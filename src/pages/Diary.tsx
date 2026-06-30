import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, type DiaryEntry } from '../lib/db'
import { calcDailyAggregate } from '../lib/calc'
import { useUserStore } from '../lib/store'

const moodLabel = { good: '好', fair: '平', bad: '差' } as const
const moodScore = { good: 80, fair: 50, bad: 20 } as const

export default function Diary() {
  const profile = useUserStore(s => s.profile)
  const entries = useLiveQuery(() => db.diaryEntries.orderBy('date').reverse().toArray(), [])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [mood, setMood] = useState<'good'|'fair'|'bad'>('good')
  const [tags, setTags] = useState('')
  const [note, setNote] = useState('')

  const save = async () => {
    if (!profile) return
    // 当下重算当日 4 个算法得分，存为快照
    const items = calcDailyAggregate(profile, new Date(date + 'T12:00:00'))
    const algoScores: Record<string, number> = {}
    items.forEach(i => { if (i.daily) algoScores[i.algo] = Math.round(i.daily.score) })

    const entry: DiaryEntry = {
      date,
      mood,
      tags: tags.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean),
      note: note.trim(),
      algoScores,
      createdAt: Date.now(),
    }
    await db.diaryEntries.put(entry)
    setNote(''); setTags('')
  }

  const del = async (id?: number) => { if (id != null) await db.diaryEntries.delete(id) }

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
      <div className="card">
        <h3 className="card-title">写日记 · 记录当日真实感受</h3>
        <p className="text-amber-100/60 text-sm mb-4">
          保存时会把当日 4 个算法的得分快照存下来。积累 7 天以上后可在「准确率看板」对比哪个算法更准。
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <div className="field-label">日期</div>
            <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <div className="field-label">当日感受</div>
            <select className="field-input" value={mood} onChange={e => setMood(e.target.value as any)}>
              <option value="good">好</option>
              <option value="fair">平</option>
              <option value="bad">差</option>
            </select>
          </div>
          <div>
            <div className="field-label">标签（空格 / 逗号 分隔）</div>
            <input className="field-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="工作 感情 破财" />
          </div>
        </div>
        <div className="mt-3">
          <div className="field-label">备注</div>
          <textarea className="field-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="今天发生了什么..." />
        </div>
        <div className="flex justify-end mt-3">
          <button className="btn-primary" onClick={save}>保 存</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">历史记录（{entries?.length ?? 0}）</h3>
        {!entries?.length ? (
          <div className="text-amber-100/50 text-sm py-4 text-center">还没有日记，开始记录吧</div>
        ) : (
          <ul className="grid gap-2">
            {entries.map(e => (
              <li key={e.id} className="bg-white/[0.04] rounded-lg p-3 flex gap-3 items-start">
                <div className="flex flex-col items-center min-w-[60px]">
                  <div className="text-xs text-amber-100/60">{e.date}</div>
                  <div className={`mt-1 text-sm font-bold ${
                    e.mood === 'good' ? 'text-emerald-300' : e.mood === 'bad' ? 'text-rose-300' : 'text-amber-200'}`}>{moodLabel[e.mood]}</div>
                  <div className="text-[10px] text-amber-100/50 mt-1">主观 {moodScore[e.mood]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {e.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  {e.note && <div className="text-amber-100/80 text-sm whitespace-pre-wrap">{e.note}</div>}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-amber-100/60">
                    {Object.entries(e.algoScores).map(([k, v]) => (
                      <span key={k} className="px-1.5 py-0.5 bg-amber-300/10 border border-amber-300/20 rounded">
                        {k} <b className="text-amber-200">{v}</b>
                      </span>
                    ))}
                  </div>
                </div>
                <button className="btn-ghost text-xs" onClick={() => del(e.id)}>删除</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
