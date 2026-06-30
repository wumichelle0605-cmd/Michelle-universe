/**
 * Dexie 数据层
 * - diaryEntries: 日记
 * - influencers: 收藏的大V
 * 全部存浏览器本地，不上传服务器
 */
import Dexie, { type Table } from 'dexie'

export interface DiaryEntry {
  id?: number
  date: string                        // YYYY-MM-DD
  mood: 'good' | 'fair' | 'bad'        // 主观当日运势
  tags: string[]                       // 自由标签：工作顺利/破财/感情/...
  note: string                         // 备注
  /** 当日各算法记录的得分（创建时快照） */
  algoScores: Record<string, number>
  createdAt: number
}

export interface Influencer {
  id?: number
  name: string
  school: string                       // 流派：星座/八字/紫微...
  url: string
  note?: string
  rssUrl?: string
  createdAt: number
}

class XuanxueDB extends Dexie {
  diaryEntries!: Table<DiaryEntry, number>
  influencers!: Table<Influencer, number>

  constructor() {
    super('xuanxue-db')
    this.version(1).stores({
      diaryEntries: '++id, date, mood, createdAt',
      influencers: '++id, name, school, createdAt',
    })
  }
}

export const db = new XuanxueDB()
