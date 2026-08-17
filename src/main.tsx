import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { reconcilePlantStatuses } from './db/plants'

import '@fontsource-variable/outfit'
import './index.css'

const ROOT_ELEMENT_ID = 'root'

const container = document.getElementById(ROOT_ELEMENT_ID)
if (!container) throw new Error(`#${ROOT_ELEMENT_ID} fehlt in index.html`)

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * Einmal beim Start einen inzwischen eingetretenen Pflanzentod festschreiben.
 * Bewusst ohne await und ohne Einfluss auf das Rendern: die Anzeige braucht das
 * nicht, weil der Zustand ohnehin bei jedem Render aus den Zeitstempeln
 * berechnet wird. Der Aufruf ist zugleich der Nachweis, dass IndexedDB
 * erreichbar ist.
 */
void reconcilePlantStatuses().catch((error: unknown) => {
  console.error('[db] Status-Abgleich fehlgeschlagen', error)
})
