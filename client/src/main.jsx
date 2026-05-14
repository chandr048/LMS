import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import { AppContextProvider} from './context/AppContext.jsx'

// Suppress development warnings
if (import.meta.env.DEV) {
  const originalWarn = console.warn
  console.warn = function(...args) {
    if (
      args[0]?.includes?.('Module "os" has been externalized') ||
      args[0]?.includes?.('development keys') ||
      args[0]?.includes?.('Relative route resolution')
    ) {
      return
    }
    originalWarn.apply(console, args)
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if(!PUBLISHABLE_KEY){
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')).render(
   <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </ClerkProvider>
  
);
