// Client entry point that mounts the app with its providers.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './shared/tokens.css'
import App from './app/App.jsx'
import { AuthProvider } from './shared/lib/authContext.jsx'
import { ToastProvider } from './shared/lib/toastContext.jsx'
import UpdatePrompt from './shared/components/UpdatePrompt.jsx'
import InstallPrompt from './shared/components/InstallPrompt.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
    <UpdatePrompt />
    <InstallPrompt />
  </StrictMode>,
)
