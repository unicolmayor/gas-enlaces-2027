<script setup lang="ts">
import { fetchCatalog, type CatalogFaculty } from '~/composables/useCatalog'

const config = useRuntimeConfig()
const { data, error, status } = await useAsyncData('catalogo', fetchCatalog)
const search = ref('')
const expanded = ref<string | number | null>(null)

const filteredFaculties = computed<CatalogFaculty[]>(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return data.value?.facultades || []
  return (data.value?.facultades || []).map((faculty) => ({
    ...faculty,
    programas: faculty.programas.filter((program) => `${faculty.nombre} ${program.nombre}`.toLowerCase().includes(term))
  })).filter((faculty) => faculty.nombre.toLowerCase().includes(term) || faculty.programas.length)
})

const apiConfigured = computed(() => Boolean(config.public.apiBase))
</script>

<template>
  <div class="page">
    <section class="hero">
      <p class="eyebrow">Biblioteca académica</p>
      <h1>Encuentra tus recursos de aprendizaje</h1>
      <p>Explora facultades, programas, módulos y materiales disponibles en un solo lugar.</p>
    </section>

    <div v-if="!apiConfigured" class="notice">
      Configura la URL pública de Apps Script en <code>NUXT_PUBLIC_API_BASE</code> para cargar el catálogo.
    </div>
    <div v-else class="toolbar">
      <h2>Catálogo académico</h2>
      <input v-model="search" class="search" type="search" placeholder="Buscar facultad o programa" aria-label="Buscar facultad o programa">
    </div>

    <p v-if="status === 'pending'">Cargando catálogo...</p>
    <p v-else-if="error" class="error">No fue posible cargar el catálogo. Intenta nuevamente más tarde.</p>
    <p v-else-if="!filteredFaculties.length" class="notice">No hay resultados para tu búsqueda.</p>

    <section v-else class="catalog-grid">
      <article v-for="faculty in filteredFaculties" :key="faculty.id" class="card">
        <h2>{{ faculty.nombre }}</h2>
        <ul>
          <li v-for="program in faculty.programas" :key="program.id">
            <button class="button" type="button" @click="expanded = expanded === program.id ? null : program.id">
              {{ program.nombre }}
            </button>
            <div v-if="expanded === program.id" class="program-detail">
              <p v-if="!program.modulos.length">No hay módulos disponibles.</p>
              <div v-for="module in program.modulos" :key="module.id">
                <h3>{{ module.nombre }} <small>({{ module.semestre }})</small></h3>
                <ul>
                  <li v-for="resource in module.recursos" :key="resource.id">
                    <strong>{{ resource.nombre }}</strong>
                    <div class="link-list">
                      <a v-for="link in resource.enlaces" :key="link.id" class="link-chip" :href="link.url" target="_blank" rel="noopener">{{ link.tipo }}</a>
                      <a v-for="folder in resource.carpetas" :key="folder.id" class="link-chip" :href="folder.ruta" target="_blank" rel="noopener">Carpeta</a>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>
