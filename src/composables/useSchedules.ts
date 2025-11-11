import { ref, computed } from 'vue'
import { scheduleService } from '@/services/scheduleService'
import type {
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  CalendarEvent,
} from '@/types/schedule'

export function useSchedules() {
  const schedules = ref<Schedule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const parseDateString = (dateStr: string): Date => {
    // Parse YYYY-MM-DD format ensuring local timezone
    // Split the date parts to avoid timezone issues
    const parts = dateStr.split('-').map(Number)
    const year = parts[0] || 2025
    const month = parts[1] || 1
    const day = parts[2] || 1
    return new Date(year, month - 1, day)
  }

  const formatDateToString = (date: Date): string => {
    // Format to YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [hours = 0, minutes = 0] = timeStr.split(':').map(Number)
    return { hours, minutes }
  }

  const transformSchedulesToEvents = (schedulesList: Schedule[]): CalendarEvent[] => {
    // Handle case where API returns non-array data
    if (!Array.isArray(schedulesList)) {
      console.error('Expected array of schedules, got:', schedulesList)
      return []
    }

    return schedulesList.map((schedule) => {
      // Parse the date string (YYYY-MM-DD)
      const baseDate = parseDateString(schedule.day)

      const startTime = parseTime(schedule.startTime)
      const endTime = parseTime(schedule.endTime)

      const start = new Date(baseDate)
      start.setHours(startTime.hours, startTime.minutes, 0, 0)

      const end = new Date(baseDate)
      end.setHours(endTime.hours, endTime.minutes, 0, 0)
      const resourceId = schedule.day

      return {
        id: String(schedule.id),
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: '#3788d8',
        borderColor: '#3788d8',
        editable: true,
        resourceId,
        extendedProps: {
          scheduleId: schedule.id,
        },
      }
    })
  }

  const fetchSchedules = async (): Promise<CalendarEvent[]> => {
    loading.value = true
    error.value = null
    try {
      const data = await scheduleService.getSchedules()
      schedules.value = data
      return transformSchedulesToEvents(data)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching schedules'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createSchedule = async (scheduleData: CreateScheduleDto): Promise<Schedule> => {
    loading.value = true
    error.value = null
    try {
      const newSchedule = await scheduleService.createSchedule(scheduleData)
      schedules.value.push(newSchedule)
      return newSchedule
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating schedule'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSchedule = async (id: number, scheduleData: UpdateScheduleDto): Promise<Schedule> => {
    loading.value = true
    error.value = null
    try {
      const updatedSchedule = await scheduleService.updateSchedule(id, scheduleData)
      const index = schedules.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        schedules.value[index] = updatedSchedule
      }
      return updatedSchedule
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error updating schedule'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteSchedule = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await scheduleService.deleteSchedule(id)
      schedules.value = schedules.value.filter((s) => s.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting schedule'
      throw err
    } finally {
      loading.value = false
    }
  }

  const extractScheduleData = (start: Date, end: Date): CreateScheduleDto => {
    const formatTime = (date: Date): string => {
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    }

    return {
      day: formatDateToString(start),
      startTime: formatTime(start),
      endTime: formatTime(end),
    }
  }

  const hasSchedules = computed(() => schedules.value.length > 0)

  return {
    schedules,
    loading,
    error,
    hasSchedules,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    transformSchedulesToEvents,
    extractScheduleData,
  }
}
