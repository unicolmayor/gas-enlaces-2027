<script setup lang="ts">
const config = useRuntimeConfig()
const token = ref('')
const users = ref<any[]>([])
const errorMessage = ref('')

onMounted(async () => {
  token.value = localStorage.getItem('enlaces_token') || ''
  if (!token.value) return navigateTo('/admin/login')
  try {
    const response = await $fetch<any>(config.public.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'users.list', token: token.value, page: 1, pageSize: 100 })
    })
    if (!response.success) throw new Error(response.error?.message || 'No fue posible cargar los usuarios')
    users.value = response.data.data
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No fue posible cargar los usuarios'
  }
})
</script>

<template>
  <div class="page">
    <h1>Usuarios</h1>
    <p>Usuarios activos y desbloqueados con acceso administrativo.</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <section v-else class="catalog-grid">
      <article v-for="user in users" :key="user.id" class="card">
        <h2>{{ user.name }}</h2>
        <p>{{ user.email }}</p>
        <small>{{ user.username }}</small>
      </article>
    </section>
  </div>
</template>
