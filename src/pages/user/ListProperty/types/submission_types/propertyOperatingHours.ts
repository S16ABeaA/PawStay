export interface PropertyOperatingHours {
  sameHoursEveryDay: boolean
  dailyOpenTime: string
  dailyCloseTime: string
  weeklyHours: Record<string, { open: string; close: string }>
}