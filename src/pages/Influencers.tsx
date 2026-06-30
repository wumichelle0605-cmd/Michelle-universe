import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, type Influencer } from '../lib/db'

const SCHOOLS = ['星座', '八字', '紫微', '塔罗', '占星', '风水', '综合', '其他']

export default function Influencers() {
  const list = useLiveQuery(() => db.influencers.orderBy('createdAt').reverse().toArray(), [])
  const [form, setForm] = useState<Influencer>({
    name: '', school: '星座', url: '', note: '', rssUrl: '', createdAt: 0,
  })

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) return
    await db.influencers.put({ ...form, createdAt: Date.now() })
    setForm({ name: '', school: form.school, url: '', note: '', rssUrl: '', createdAt: 0 })
  }
  const del = async (id?: number) => { if (id != null) await db.influencers.delete(id) }

  return (
    <div className="grid gap-6">
      <div className="card">
        <h3 className="card-title">收藏关注的大V</h3>
        <p className="text-amber-100/60 text-sm leading-relaxed">
          这里仅保存「跳转入口」，不抓取任何博主的视频/微博正文（避免版权与反爬风险）。
          推荐做法：把博主的官方主页或 RSS 链接保存下来，点击直达即可。
          所有数据存在你浏览器本地。
        </p>
      </div>

      <div className="card">
        <h4 className="card-title">添加新博主</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="field-label">名字</div>
            <input className="field-input" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如：陶白白" />
          </div>
          <div>
            <div className="field-label">流派</div>
            <select className="field-input" value={form.school}
              onChange={e => setForm({ ...form, school: e.target.value })}>
              {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <div className="field-label">主页 / 视频号链接</div>
            <input className="field-input" value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://weibo.com/xxx" />
          </div>
          <div className="sm:col-span-2">
            <div className="field-label">RSS（可选，若博主有 RSS 订阅源）</div>
            <input className="field-input" value={form.rssUrl}
              onChange={e => setForm({ ...form, rssUrl: e.target.value })}
              placeholder="https://rsshub.app/..." />
          </div>
          <div className="sm:col-span-2">
            <div className="field-label">备注</div>
            <input className="field-input" value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })} placeholder="风格 / 更新频率 / 你的评价" />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button className="btn-primary" onClick={save}>添 加</button>
        </div>
      </div>

      <div className="card">
        <h4 className="card-title">我的收藏（{list?.length ?? 0}）</h4>
        {!list?.length ? (
          <div className="text-amber-100/50 text-sm text-center py-6">还没有收藏，添加一个开始追更吧</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {list.map(v => (
              <div key={v.id} className="bg-white/[0.04] rounded-lg p-3 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-amber-200 font-semibold tracking-widest">{v.name}</span>
                  <span className="tag">{v.school}</span>
                  <button className="ml-auto text-amber-100/40 hover:text-rose-300 text-xs"
                    onClick={() => del(v.id)}>删除</button>
                </div>
                {v.note && <div className="text-amber-100/70 text-sm">{v.note}</div>}
                <div className="flex gap-3 text-xs mt-1">
                  <a href={v.url} target="_blank" rel="noreferrer"
                    className="text-amber-300 hover:underline">→ 主页</a>
                  {v.rssUrl && (
                    <a href={v.rssUrl} target="_blank" rel="noreferrer"
                      className="text-amber-300 hover:underline">→ RSS</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-amber-100/40 tracking-wider">
        如果之后要做"运势聚合阅读"，建议接 RSS（如 RSSHub）而非抓取页面。
      </div>
    </div>
  )
}
