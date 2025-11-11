<script setup lang="ts">
import { ref, watch } from 'vue'

interface ScheduleForm {
  day: string // YYYY-MM-DD format
  startTime: string
  endTime: string
}

interface Props {
  show: boolean
  isEditing?: boolean
  initialData?: Partial<ScheduleForm>
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: ScheduleForm): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
})

const emit = defineEmits<Emits>()

const getTodayString = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formData = ref<ScheduleForm>({
  day: getTodayString(),
  startTime: '09:00',
  endTime: '17:00',
})

// Watch for initial data changes
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      formData.value = {
        day: newData.day || getTodayString(),
        startTime: newData.startTime || '09:00',
        endTime: newData.endTime || '17:00',
      }
    }
  },
  { immediate: true },
)

const handleClose = () => {
  emit('close')
}

const handleSave = () => {
  emit('save', formData.value)
}

const handleDelete = () => {
  if (confirm('¿Estás seguro de que deseas eliminar este horario?')) {
    emit('delete')
  }
}

const isFormValid = () => {
  return formData.value.day && formData.value.startTime && formData.value.endTime
}
</script>

<template>
  <div
    v-if="show"
    class="modal"
    tabindex="-1"
    style="display: block; background-color: rgba(0, 0, 0, 0.5)"
    @click.self="handleClose"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditing ? 'Editar Horario' : 'Nuevo Horario' }}</h5>
          <button type="button" class="btn-close" @click="handleClose"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="scheduleDay" class="form-label">Fecha</label>
            <input
              type="date"
              class="form-control"
              id="scheduleDay"
              v-model="formData.day"
              required
            />
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="startTime" class="form-label">Hora de Inicio</label>
              <input
                type="time"
                class="form-control"
                id="startTime"
                v-model="formData.startTime"
                required
              />
            </div>
            <div class="col-md-6 mb-3">
              <label for="endTime" class="form-label">Hora de Fin</label>
              <input
                type="time"
                class="form-control"
                id="endTime"
                v-model="formData.endTime"
                required
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="handleClose">Cerrar</button>
          <button
            v-if="isEditing"
            type="button"
            class="btn btn-danger me-auto"
            @click="handleDelete"
          >
            Eliminar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleSave"
            :disabled="!isFormValid()"
          >
            {{ isEditing ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  z-index: 1050;
}

.modal-dialog {
  margin: 1.75rem auto;
}
</style>
