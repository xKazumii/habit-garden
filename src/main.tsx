import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { reconcilePlantStatuses } from './db/plants'

import '@fontsource-variable/outfit'
import './index.css'

const ROOT_ELEMENT_ID = 'root'

const container = document.getElementById(ROOT_ELEMENT_ID)
if (!container) throw new Error(`#${ROOT_ELEMENT_ID} is missing from index.html`)

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * Write down, once at start-up, any plant death that has meanwhile occurred.
 * Deliberately without await and without affecting rendering: the UI does not
 * need it, because the state is derived from timestamps on every render anyway.
 * The call doubles as proof that IndexedDB is reachable.
 */
void reconcilePlantStatuses().catch((error: unknown) => {
  console.error('[db] Status reconciliation failed', error)
})
