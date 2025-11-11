<script setup lang="ts">
import Calendar from './components/Calendar.vue'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Planificador Semanal</h1>
    </header>

    <main class="app-main">
      <Calendar />
    </main>

    <footer class="app-footer"></footer>
  </div>
</template>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.app-footer {
  background-color: white;
  padding: 2rem;
}
</style>
