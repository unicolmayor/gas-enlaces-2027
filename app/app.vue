<template>
  <div class="app-shell">
    <header class="site-header">
      <NuxtLink class="brand" to="/">
        <span class="brand-mark">E</span>
        <span>Enlaces académicos</span>
      </NuxtLink>
      <nav class="site-nav" aria-label="Navegación principal">
        <NuxtLink to="/">Catálogo</NuxtLink>
        <NuxtLink to="/admin/login">Administración</NuxtLink>
      </nav>
    </header>
    <main>
      <NuxtPage />
    </main>
    <footer class="site-footer">Universidad Colegio Mayor de Cundinamarca · Recursos académicos</footer>
  </div>
</template>

<style>
:root {
  --primario: #233a83;
  --secundario: #ffcf02;
  --fondo: #f5f7fb;
  --texto: #1c2540;
  font-family: Roboto, Arial, sans-serif;
  color: var(--texto);
  background: var(--fondo);
}
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; }
a { color: inherit; }
.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.site-header { align-items: center; background: var(--primario); color: white; display: flex; justify-content: space-between; padding: 1rem clamp(1rem, 4vw, 4rem); }
.brand { align-items: center; display: flex; font-size: 1.1rem; font-weight: 700; gap: .65rem; text-decoration: none; }
.brand-mark { align-items: center; background: var(--secundario); border-radius: .45rem; color: var(--primario); display: inline-flex; height: 2rem; justify-content: center; width: 2rem; }
.site-nav { display: flex; gap: 1.25rem; }
.site-nav a { font-weight: 500; text-decoration: none; }
.site-nav a.router-link-active { border-bottom: 2px solid var(--secundario); padding-bottom: .2rem; }
main { flex: 1; }
.site-footer { color: #53607e; font-size: .85rem; padding: 1.5rem clamp(1rem, 4vw, 4rem); text-align: center; }
.page { margin: 0 auto; max-width: 1200px; padding: clamp(1.5rem, 5vw, 4rem) 1rem; }
.hero { background: linear-gradient(135deg, var(--primario), #3654a8); border-radius: 1rem; color: white; padding: clamp(1.5rem, 5vw, 3rem); }
.hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); margin: 0 0 .75rem; }
.hero p { color: #e4e9ff; font-size: 1.1rem; margin: 0; max-width: 680px; }
.toolbar { align-items: center; display: flex; flex-wrap: wrap; gap: .75rem; justify-content: space-between; margin: 2rem 0 1rem; }
.search { border: 1px solid #d5daea; border-radius: .55rem; font: inherit; max-width: 420px; padding: .8rem 1rem; width: 100%; }
.catalog-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.card { background: white; border: 1px solid #e3e7f2; border-radius: .8rem; box-shadow: 0 5px 20px #233a8310; padding: 1.25rem; }
.card h2, .card h3 { color: var(--primario); margin-top: 0; }
.card h3 { font-size: 1rem; }
.card ul { list-style: none; margin: 0; padding: 0; }
.card li { border-top: 1px solid #edf0f7; padding: .7rem 0; }
.link-list { display: flex; flex-wrap: wrap; gap: .5rem; }
.link-chip, .button { background: var(--secundario); border: 0; border-radius: .45rem; color: var(--primario); cursor: pointer; display: inline-block; font: inherit; font-weight: 700; padding: .6rem .8rem; text-decoration: none; }
.button.primary { background: var(--primario); color: white; }
.button:disabled { cursor: wait; opacity: .6; }
.notice { background: #fff8d8; border-left: 4px solid var(--secundario); border-radius: .35rem; padding: .9rem 1rem; }
.error { color: #a62232; }
.form-card { background: white; border-radius: .8rem; margin: 2rem auto; max-width: 460px; padding: 2rem; }
.form-field { display: grid; gap: .35rem; margin-bottom: 1rem; }
.form-field input { border: 1px solid #d5daea; border-radius: .45rem; font: inherit; padding: .75rem; }
@media (max-width: 600px) { .site-header { align-items: flex-start; flex-direction: column; gap: 1rem; } .site-nav { gap: .8rem; } }
</style>
