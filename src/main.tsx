/**
 * Main application entry point
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

/**
 * Initialize React application when DOM is ready
 */
function initializeApp() {
  const rootElement = document.getElementById('root')
  
  if (!rootElement) {
    console.error('Root element not found! Make sure there is an element with id="root" in your HTML.')
    return
  }

  // Clear loading content
  rootElement.innerHTML = ''

  // Create React root
  const root = createRoot(rootElement)
  
  // Render application
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  // DOM is already loaded
  initializeApp()
}
