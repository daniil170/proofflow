import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/features/auth'
import { router } from './providers/index.js'

export const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
