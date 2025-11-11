<script setup lang="ts">
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'

import type { DateSelectArg, EventClickArg, EventDropArg, EventInput, DatesSetArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import type { CreateScheduleDto } from '@/types/schedule'
import { useSchedules } from '@/composables/useSchedules'
import ScheduleModal from './ScheduleModal.vue'

defineOptions({
  name: 'CalendarComponent',
})

// Use the schedules composable
const {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  extractScheduleData,
  loading,
  error,
} = useSchedules()

// Component state
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const showModal = ref(false)
const isEditing = ref(false)
const selectedScheduleId = ref<number | null>(null)
const scheduleFormData = ref<CreateScheduleDto | undefined>(undefined)
const calendarResources = ref<Array<{ id: string; title: string }>>([])

// Calendar configuration
const calendarOptions = ref({
  plugins: [resourceTimelinePlugin, interactionPlugin],
  initialView: 'resourceTimelineWeek',
  views: {
    resourceTimelineWeek: {
      type: 'resourceTimeline',
      duration: { days: 1 },
      buttonText: 'Semana',
      slotDuration: '01:00:00',
      slotMinTime: '06:00:00',
      slotMaxTime: '23:00:00',
    },
  },
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: '',
  },
  locale: 'es',
  titleFormat: { year: 'numeric' as const, month: 'short' as const, day: 'numeric' as const },
  slotMinTime: '06:00:00',
  slotMaxTime: '23:00:00',
  slotDuration: '01:00:00',
  resourceAreaHeaderContent: 'Día',
  resourceAreaWidth: '100px',
  slotLabelInterval: '01:00:00',
  resources: calendarResources,
  resourceOrder: 'id',
  editable: true,
  selectable: true,
  selectMirror: true,
  nowIndicator: false,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  datesSet: (dateInfo: DatesSetArg) => {
    // Generate 7 consecutive days when the view changes
    const startDate = new Date(dateInfo.start)
    const newResources = []

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)

      const dateStr = formatDateToString(currentDate)
      const day = currentDate.getDate()

      newResources.push({
        id: dateStr,
        title: `Día ${day}`,
      })
    }

    calendarResources.value = newResources
  },
  events: async (
    fetchInfo: { start: Date; end: Date; timeZone: string },
    successCallback: (events: EventInput[]) => void,
    failureCallback: (error: Error) => void,
  ) => {
    try {
      const events = await fetchSchedules()
      successCallback(events as EventInput[])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch schedules')
      failureCallback(error)
    }
  },
  eventTimeFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false,
  },
  slotLabelFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false,
  },
  buttonText: {
    today: 'Hoy',
  },
  height: 'auto',
  contentHeight: 600,
})

function handleDateSelect(selectInfo: DateSelectArg) {
  const resourceDate = selectInfo.resource?.id || formatDateToString(selectInfo.start)

  const startTime = `${String(selectInfo.start.getHours()).padStart(2, '0')}:${String(selectInfo.start.getMinutes()).padStart(2, '0')}`
  const endTime = `${String(selectInfo.end.getHours()).padStart(2, '0')}:${String(selectInfo.end.getMinutes()).padStart(2, '0')}`

  scheduleFormData.value = {
    day: resourceDate,
    startTime,
    endTime,
  }
  isEditing.value = false
  selectedScheduleId.value = null
  showModal.value = true
}

function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function handleEventClick(clickInfo: EventClickArg) {
  const event = clickInfo.event
  const scheduleId = event.extendedProps?.scheduleId

  if (!scheduleId || !event.start || !event.end) return

  const scheduleData = extractScheduleData(event.start, event.end)
  scheduleFormData.value = scheduleData
  selectedScheduleId.value = scheduleId
  isEditing.value = true
  showModal.value = true
}

async function handleEventDrop(dropInfo: EventDropArg) {
  const event = dropInfo.event
  const scheduleId = event.extendedProps?.scheduleId
  const newResourceId = (
    event as { getResources?: () => Array<{ id: string }> }
  ).getResources?.()?.[0]?.id

  if (!scheduleId || !event.start || !event.end) {
    dropInfo.revert()
    return
  }

  try {
    const startTime = `${String(event.start.getHours()).padStart(2, '0')}:${String(event.start.getMinutes()).padStart(2, '0')}`
    const endTime = `${String(event.end.getHours()).padStart(2, '0')}:${String(event.end.getMinutes()).padStart(2, '0')}`

    const scheduleData = {
      day: newResourceId || formatDateToString(event.start),
      startTime,
      endTime,
    }
    await updateSchedule(scheduleId, scheduleData)
  } catch (err) {
    console.error('Error updating schedule:', err)
    dropInfo.revert()
  }
}

async function handleEventResize(resizeInfo: EventResizeDoneArg) {
  const event = resizeInfo.event
  const scheduleId = event.extendedProps?.scheduleId
  const resourceId = (event as { getResources?: () => Array<{ id: string }> }).getResources?.()?.[0]
    ?.id

  if (!scheduleId || !event.start || !event.end) {
    resizeInfo.revert()
    return
  }

  try {
    const startTime = `${String(event.start.getHours()).padStart(2, '0')}:${String(event.start.getMinutes()).padStart(2, '0')}`
    const endTime = `${String(event.end.getHours()).padStart(2, '0')}:${String(event.end.getMinutes()).padStart(2, '0')}`

    const scheduleData = {
      day: resourceId || formatDateToString(event.start),
      startTime,
      endTime,
    }
    await updateSchedule(scheduleId, scheduleData)
  } catch (err) {
    console.error('Error resizing schedule:', err)
    resizeInfo.revert()
  }
}

// Modal handlers
async function handleSaveSchedule(formData: CreateScheduleDto) {
  try {
    if (isEditing.value && selectedScheduleId.value) {
      await updateSchedule(selectedScheduleId.value, formData)
    } else {
      await createSchedule(formData)
    }
    closeModal()
    refreshCalendar()
  } catch (err) {
    console.error('Error saving schedule:', err)
    alert('Error al guardar el horario')
  }
}

async function handleDeleteSchedule() {
  if (!selectedScheduleId.value) return

  try {
    await deleteSchedule(selectedScheduleId.value)
    closeModal()
    refreshCalendar()
  } catch (err) {
    console.error('Error deleting schedule:', err)
    alert('Error al eliminar el horario')
  }
}

function closeModal() {
  showModal.value = false
  scheduleFormData.value = undefined
  selectedScheduleId.value = null
  isEditing.value = false
}

function refreshCalendar() {
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.refetchEvents()
  }
}
</script>

<template>
  <div class="calendar-container">
    <!-- Loading indicator -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
      {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>

    <!-- Calendar -->
    <FullCalendar ref="calendarRef" :options="calendarOptions" class="calendar" />

    <!-- Schedule Modal -->
    <ScheduleModal
      :show="showModal"
      :is-editing="isEditing"
      :initial-data="scheduleFormData"
      @close="closeModal"
      @save="handleSaveSchedule"
      @delete="handleDeleteSchedule"
    />
  </div>
</template>

<style>
@import 'bootstrap/dist/css/bootstrap.css';

.calendar-container {
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
}

.fc {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.fc-event {
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.fc-event:hover {
  opacity: 0.9;
}

/* Resource timeline customization */
.fc-timeline-slot {
  border-right: 1px solid #ddd;
}

.fc-timeline-slot-cushion {
  padding: 4px;
}

.fc-resource-timeline-divider {
  width: 2px;
  background: #ddd;
}

.modal {
  z-index: 1050;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .fc-toolbar {
    flex-direction: column;
    gap: 10px;
  }

  .fc-toolbar-chunk {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
  }

  .fc-header-toolbar {
    margin-bottom: 0.5em !important;
  }
}
</style>
