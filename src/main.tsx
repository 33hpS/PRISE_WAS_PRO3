/**
 * Main application entry point
 * ИСПРАВЛЕНО: добавлен явный импорт React для классического JSX transform
 */
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

/**
 * Initialize React application when DOM is ready
 */
function initializeApp() {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    console.error(
      'Root element not found! Make sure there is an element with id="root" in your HTML.'
    )
    return
  }

  // Clear loading content
  rootElement.innerHTML = ''

  try {
    // Create React root
    const root = createRoot(rootElement)

    // Render application
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )

    console.log('✅ React application initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize React application:', error)

    // Show error message to user
    rootElement.innerHTML = `
      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        font-family: system-ui, -apple-system, sans-serif;
        color: #dc2626;
        text-align: center;
        padding: 2rem;
      ">
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Ошибка загрузки приложения</h1>
        <p style="color: #6b7280; margin-bottom: 1rem;">Произошла ошибка при инициализации React приложения</p>
        <details style="margin-top: 1rem; text-align: left;">
          <summary style="cursor: pointer; font-weight: 600;">Техническая информация</summary>
          <pre style="
            margin-top: 0.5rem; 
            padding: 1rem; 
            background: #f3f4f6; 
            border-radius: 0.5rem; 
            font-size: 0.875rem;
            overflow: auto;
          ">${error}</pre>
        </details>
        <button onclick="location.reload()" style="
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
        ">Перезагрузить страницу</button>
      </div>
    `
  }
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  // DOM is already loaded
  initializeApp()
}
