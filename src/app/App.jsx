import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/features/auth'
import { CookieBanner } from '@/components/legal'
import { router } from './providers/index.js'

export const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <CookieBanner />
    </AuthProvider>
  )
}
