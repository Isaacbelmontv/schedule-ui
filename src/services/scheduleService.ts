import axios, { type AxiosInstance } from 'axios'
import type { Schedule, CreateScheduleDto, UpdateScheduleDto } from '@/types/schedule'

class ScheduleService {
  private axiosInstance: AxiosInstance
  private baseURL: string

  constructor(baseURL: string = 'http://localhost:8000/api') {
    this.baseURL = baseURL
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor for error handling
    this.axiosInstance.interceptors.request.use(
      (config) => {
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      },
    )
  }

  /**
   * Get all schedules
   */
  async getSchedules(): Promise<Schedule[]> {
    try {
      const response = await this.axiosInstance.get<unknown>('/schedules')
      const data = response.data

      // Log the response to debug structure
      console.log('API Response:', data)

      let schedules: unknown[] = []

      // If it's already an array, use it
      if (Array.isArray(data)) {
        schedules = data
      }
      // Handle if API returns data wrapped in an object (e.g., { data: [...] })
      else if (data && typeof data === 'object') {
        // Check common wrapper patterns
        if ('data' in data && Array.isArray(data.data)) {
          schedules = data.data
        } else if ('schedules' in data && Array.isArray(data.schedules)) {
          schedules = data.schedules
        }
      }

      // Normalize day field from ISO datetime to YYYY-MM-DD
      return schedules.map((schedule) => {
        const s = schedule as Record<string, unknown>
        return {
          ...s,
          day: this.normalizeDateField(s.day as string),
        }
      }) as Schedule[]
    } catch (error) {
      console.error('Error fetching schedules:', error)
      throw new Error('Failed to fetch schedules')
    }
  }

  /**
   * Normalize date field - converts ISO datetime or date string to YYYY-MM-DD
   */
  private normalizeDateField(dateValue: string): string {
    if (!dateValue) return dateValue

    // If it's already in YYYY-MM-DD format (10 chars), return as is
    if (dateValue.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue
    }

    // Extract date portion from ISO string directly (avoid timezone conversion)
    // "2025-11-11T00:00:00+00:00" -> "2025-11-11"
    const dateMatch = dateValue.match(/^(\d{4}-\d{2}-\d{2})/)
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1]
    }

    // Fallback: use UTC methods to avoid timezone issues
    const date = new Date(dateValue)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Get a single schedule by ID
   */
  async getSchedule(id: number): Promise<Schedule> {
    try {
      const response = await this.axiosInstance.get<Schedule>(`/schedules/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching schedule ${id}:`, error)
      throw new Error(`Failed to fetch schedule ${id}`)
    }
  }

  /**
   * Create a new schedule
   */
  async createSchedule(schedule: CreateScheduleDto): Promise<Schedule> {
    try {
      const response = await this.axiosInstance.post<Schedule>('/schedules', schedule)
      return response.data
    } catch (error) {
      console.error('Error creating schedule:', error)
      throw new Error('Failed to create schedule')
    }
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(id: number, schedule: UpdateScheduleDto): Promise<Schedule> {
    try {
      const response = await this.axiosInstance.put<Schedule>(`/schedules/${id}`, schedule)
      return response.data
    } catch (error) {
      console.error(`Error updating schedule ${id}:`, error)
      throw new Error(`Failed to update schedule ${id}`)
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(id: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/schedules/${id}`)
    } catch (error) {
      console.error(`Error deleting schedule ${id}:`, error)
      throw new Error(`Failed to delete schedule ${id}`)
    }
  }
}

// Export singleton instance
export const scheduleService = new ScheduleService()

// Export class for testing purposes
export default ScheduleService
