<script setup lang="ts">
const config = useRuntimeConfig()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

async function login() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await $fetch<any>(config.public.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'auth.login', username: username.value, password: password.value })
    })
    if (!response.success) throw new Error(response.error?.message || 'No fue posible iniciar sesión')
    localStorage.setItem('enlaces_token', response.data.token)
    await navigateTo('/admin/usuarios')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No fue posible iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <form class="form-card" @submit.prevent="login">
      <h1>Administración</h1>
      <p>Inicia sesión para gestionar la información académica.</p>
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      <label class="form-field">
        <span>Usuario o correo electrónico</span>
        <input v-model="username" required autocomplete="username">
      </label>
      <label class="form-field">
        <span>Contraseña</span>
        <input v-model="password" required type="password" autocomplete="current-password">
      </label>
      <button class="button primary" :disabled="loading" type="submit">{{ loading ? 'Ingresando...' : 'Ingresar' }}</button>
    </form>
  </div>
</template>
