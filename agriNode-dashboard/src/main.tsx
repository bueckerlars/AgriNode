import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import routes from './routes.tsx'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './provider/AuthProvider.tsx'
import { Toaster } from 'sonner'

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider >
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster/>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
