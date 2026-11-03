export type CatalogLink = { id: string | number; tipo: string; url: string }
export type CatalogResource = { id: string | number; tipo: string; nombre: string; enlaces: CatalogLink[]; carpetas: { id: string | number; ruta: string }[] }
export type CatalogModule = { id: string | number; nombre: string; semestre: string; recursos: CatalogResource[] }
export type CatalogProgram = { id: string | number; nombre: string; modulos: CatalogModule[] }
export type CatalogFaculty = { id: string | number; nombre: string; programas: CatalogProgram[] }
export type Catalog = { facultades: CatalogFaculty[] }

export async function fetchCatalog(): Promise<Catalog> {
  const config = useRuntimeConfig()
  const response = await $fetch<{ success: boolean; data: Catalog; error?: { message: string } }>(
    config.public.apiBase,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'catalog.get' })
    }
  )
  if (!response.success) throw new Error(response.error?.message || 'No se pudo cargar el catálogo')
  return response.data
}
