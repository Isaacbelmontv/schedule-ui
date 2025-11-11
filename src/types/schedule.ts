export interface Schedule {
  id: number
  day: string // Format: "YYYY-MM-DD"
  startTime: string // Format: "HH:MM"
  endTime: string // Format: "HH:MM"
}

export interface CreateScheduleDto {
  day: string
  startTime: string
  endTime: string
}

export interface UpdateScheduleDto {
  day?: string
  startTime?: string
  endTime?: string
}

export interface CalendarEvent {
  id: string
  start: Date | string
  end: Date | string
  color?: string
  backgroundColor?: string
  borderColor?: string
  editable?: boolean
  resourceId?: string
  extendedProps?: {
    scheduleId?: number
  }
}
