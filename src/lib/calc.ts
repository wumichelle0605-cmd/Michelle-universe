/**
 * 各算法统一封装层
 *
 * 设计原则：
 * - 每个算法返回 { static: 原始排盘结果, daily: 当日吉凶分（0-100） }
 * - 当日吉凶分通过该算法对今日的简化解读得出（粗糙但可量化，便于"日记验证"对比）
 * - 严禁在此层做任何 LLM 生成；所有数据来自 taibu-core 真实计算
 */
// 注意：八字 / 紫微 / 小六壬 / 黄历 都是纯 JS，可安全静态导入。
// 占星(node:module)、梅花(crypto) 依赖 Node 内置模块，必须改为动态 import 以隔离浏览器报错。
import { calculateBazi, calculateBaziLiuRiData, calculateBaziFiveElementsStats } from 'taibu-core/bazi'
import { calculateZiwei } from 'taibu-core/ziwei'
import { calculateXiaoliurenData } from 'taibu-core/xiaoliuren'
import { calculateDailyAlmanac } from 'taibu-core/almanac'
import type { BirthProfile } from './store'

// ============================================================
// 工具：阳历 → 农历（用 lunar-javascript，taibu-core 已依赖）
// ============================================================
// @ts-ignore: lunar-javascript 无类型声明
import { Solar } from 'lunar-javascript'

export function solarToLunar(year: number, month: number, day: number) {
  const lunar = Solar.fromYmd(year, month, day).getLunar()
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),       // 可能为负（闰月）
    day: lunar.getDay(),
    monthName: lunar.getMonthInChinese(),
    dayName: lunar.getDayInChinese(),
    isLeap: lunar.getMonth() < 0,
  }
}

/** 0-23 小时 → 十二地支时辰序号（子=1 ... 亥=12，23点也算下一天的子时） */
export function hourToShiChen(hour: number): number {
  // 23:00 - 0:59 子, 1:00-2:59 丑 ...
  if (hour === 23 || hour === 0) return 1
  return Math.floor((hour + 1) / 2) + 1
}

// ============================================================
// 类型
// ============================================================
export interface DailyScore {
  score: number   // 0-100
  level: '大吉' | '吉' | '平' | '凶' | '大凶'
  summary: string
}

export interface CalcResult<T> {
  result: T
  daily?: DailyScore
  errors?: string[]
}

function levelOf(score: number): DailyScore['level'] {
  if (score >= 85) return '大吉'
  if (score >= 65) return '吉'
  if (score >= 45) return '平'
  if (score >= 25) return '凶'
  return '大凶'
}

// ============================================================
// 1. 八字（命盘 + 流日得分）
// ============================================================
export function calcBazi(p: BirthProfile, date = new Date()) {
  const result = calculateBazi({
    birthYear: p.year,
    birthMonth: p.month,
    birthDay: p.day,
    birthHour: p.hour,
    birthMinute: p.minute,
    gender: p.gender,
    longitude: p.longitude,
    birthPlace: p.birthPlace,
    calendarType: 'solar',
  })

  const fiveStats = calculateBaziFiveElementsStats(result.fourPillars)

  // 流日得分：取今日干支吉神/凶煞数量比
  let daily: DailyScore | undefined
  try {
    const today = new Date(date)
    const todayStr = today.toISOString().slice(0, 10)
    const ctx = {
      dayStem: result.fourPillars.day.stem,
      dayBranch: result.fourPillars.day.branch,
      yearBranch: result.fourPillars.year.branch,
    }
    const liuRi = calculateBaziLiuRiData(todayStr, todayStr, ctx)
    if (liuRi.length) {
      const t = liuRi[0]
      // 用神煞数评分：吉神越多分越高，凶煞越多分越低
      const shenSha = t.shenSha ?? []
      const goodKeywords = ['吉', '贵', '福', '禄', '财', '喜', '德', '合', '马']
      const badKeywords = ['凶', '杀', '害', '破', '空', '亡', '刑', '冲']
      let g = 0, b = 0
      for (const s of shenSha) {
        if (goodKeywords.some(k => s.includes(k))) g++
        if (badKeywords.some(k => s.includes(k))) b++
      }
      const score = Math.max(0, Math.min(100, 50 + (g - b) * 15))
      daily = {
        score,
        level: levelOf(score),
        summary: `今日 ${t.ganZhi}，神煞：${shenSha.join('、') || '无'}`,
      }
    }
  } catch (e) {
    // 流日计算失败不阻断
  }

  return { result: { ...result, fiveStats }, daily }
}

// ============================================================
// 2. 紫微斗数
// ============================================================
export function calcZiwei(p: BirthProfile) {
  const result = calculateZiwei({
    birthYear: p.year,
    birthMonth: p.month,
    birthDay: p.day,
    birthHour: p.hour,
    birthMinute: p.minute,
    gender: p.gender,
    longitude: p.longitude,
    calendarType: 'solar',
  })
  return { result }
}

// ============================================================
// 3. 西方占星（本命盘 + 当日 transit 推算简化分）
// ============================================================
export async function calcAstrology(p: BirthProfile, date = new Date()) {
  // 动态导入：占星模块顶层依赖 node:module，必须懒加载并容错
  const { calculateAstrology } = await import('taibu-core/astrology')
  const result = calculateAstrology({
    birthYear: p.year,
    birthMonth: p.month,
    birthDay: p.day,
    birthHour: p.hour,
    birthMinute: p.minute,
    longitude: p.longitude,
    latitude: p.latitude,
    birthPlace: p.birthPlace,
    transitDateTime: date.toISOString(),
  })

  // transit 得分：暂以"和谐相位 - 紧张相位"粗略评分
  let daily: DailyScore | undefined
  const transitAspects: any[] = (result as any)?.transit?.aspects
    ?? (result as any)?.transitAspects ?? []
  if (Array.isArray(transitAspects) && transitAspects.length) {
    const harmoniousTypes = ['trine', 'sextile', 'conjunction', '三分相', '六分相', '合相']
    const tenseTypes = ['square', 'opposition', '四分相', '对分相']
    let h = 0, t = 0
    for (const a of transitAspects) {
      const type = String(a.aspect ?? a.type ?? a.name ?? '').toLowerCase()
      if (harmoniousTypes.some(k => type.includes(k.toLowerCase()))) h++
      if (tenseTypes.some(k => type.includes(k.toLowerCase()))) t++
    }
    const score = Math.max(0, Math.min(100, 50 + (h - t) * 10))
    daily = { score, level: levelOf(score), summary: `今日有 ${h} 个和谐相位，${t} 个紧张相位` }
  }

  return { result, daily }
}

// ============================================================
// 4. 小六壬（当日起卦，按当前时辰）
// ============================================================
export function calcXiaoliuren(date = new Date(), question?: string) {
  const ld = solarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const result = calculateXiaoliurenData({
    lunarMonth: Math.abs(ld.month),
    lunarDay: ld.day,
    hour: date.getHours(),
    question,
  })

  // 小六壬六神吉凶映射
  const fortuneMap: Record<string, number> = {
    '大安': 90, '速喜': 80, '小吉': 70,
    '留连': 40, '赤口': 25, '空亡': 30,
  }
  const r: any = result
  const status: string | undefined =
    r?.timeStatus?.name ?? r?.shenName ?? r?.result?.name
  const score: number = (status ? fortuneMap[status] : undefined) ?? 50

  return {
    result,
    daily: {
      score,
      level: levelOf(score),
      summary: status ? `时辰对应「${status}」` : '当前时辰起卦',
    } as DailyScore,
  }
}

// ============================================================
// 5. 当日黄历
// ============================================================
export function calcAlmanac(date = new Date(), p?: BirthProfile) {
  const dateStr = date.toISOString().slice(0, 10)
  const result = calculateDailyAlmanac({
    date: dateStr,
    ...(p
      ? {
          birthYear: p.year,
          birthMonth: p.month,
          birthDay: p.day,
          birthHour: p.hour,
        }
      : {}),
  })

  // 用宜忌数量评分
  const r: any = result
  const suitable: string[] = r?.dayAlmanac?.suitable ?? r?.suitable ?? []
  const avoid: string[] = r?.dayAlmanac?.avoid ?? r?.avoid ?? []
  const score = Math.max(0, Math.min(100, 50 + (suitable.length - avoid.length) * 4))

  return {
    result,
    daily: {
      score,
      level: levelOf(score),
      summary: `宜 ${suitable.length} 件，忌 ${avoid.length} 件`,
    } as DailyScore,
  }
}

// ============================================================
// 6. 梅花易数（当日按时间起卦）
// ============================================================
export async function calcMeihua(date = new Date(), question = '今日运势如何') {
  const { calculateMeihua } = await import('taibu-core/meihua')
  const result = calculateMeihua({
    question,
    date: date.toISOString(),
    method: 'time' as any,
  })
  return { result }
}

// ============================================================
// 综合：今日多算法得分
// ============================================================
export function calcDailyAggregate(p: BirthProfile, date = new Date()) {
  const items: { algo: string; daily?: DailyScore; errors?: string[] }[] = []
  const safe = (name: string, fn: () => { daily?: DailyScore }) => {
    try {
      const { daily } = fn()
      items.push({ algo: name, daily })
    } catch (e: any) {
      items.push({ algo: name, errors: [e?.message ?? String(e)] })
    }
  }
  // 仅聚合纯 JS 算法，保证同步、稳定、浏览器零依赖问题（占星单独在命盘页异步加载）
  safe('八字流日', () => calcBazi(p, date))
  safe('小六壬', () => calcXiaoliuren(date))
  safe('黄历宜忌', () => calcAlmanac(date, p))
  return items
}
