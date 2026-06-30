/**
 * 全局状态：用户档案（出生信息）
 * 持久化到 localStorage，所有页面共享
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BirthProfile {
  name: string
  gender: 'male' | 'female'
  /** 公历 */
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** 经度（用于真太阳时校正，正东为正） */
  longitude: number
  /** 纬度（占星用） */
  latitude: number
  /** 出生地（描述） */
  birthPlace: string
}

interface UserState {
  profile: BirthProfile | null
  setProfile: (p: BirthProfile) => void
  clearProfile: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (p) => set({ profile: p }),
      clearProfile: () => set({ profile: null }),
    }),
    { name: 'xuanxue-user' }
  )
)

export const defaultProfile = (): BirthProfile => {
  const d = new Date()
  return {
    name: '',
    gender: 'male',
    year: d.getFullYear() - 25,
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: 12,
    minute: 0,
    longitude: 116.4,   // 北京
    latitude: 39.9,
    birthPlace: '北京',
  }
}
