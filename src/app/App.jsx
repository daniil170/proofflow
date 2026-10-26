import { RouterProvider } from 'react-router-dom'
import { router } from './providers/index.js'

export const App = () => {
  return <RouterProvider router={router} />
}
