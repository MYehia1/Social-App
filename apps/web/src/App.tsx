import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { I18nProvider } from '@/i18n'
import { AuthProvider } from '@/providers/AuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { router } from '@/routes'

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster
              position="bottom-center"
              toastOptions={{

                style: {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.625rem',
                  fontSize: '0.875rem',
                  boxShadow: 'var(--shadow-pop)',
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
