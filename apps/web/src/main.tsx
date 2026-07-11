import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import './styles/tokens.css'
import '@fontsource/geist-sans'
import '@fontsource/geist-mono'
import App from './App'
import { queryClient } from './lib/queryClient'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />

    </QueryClientProvider>
  </React.StrictMode>,
)
