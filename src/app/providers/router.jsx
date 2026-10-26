import { createBrowserRouter } from 'react-router-dom'
import {
  CaseProcessPage,
  CasesListPage,
  LandingPage,
  LoginPage,
  NewCasePage,
  PublicCasePage,
  SettingsPage,
} from '@/pages'
import { ProtectedRoute } from '@/features/auth'
import { AppLayout } from '@/widgets'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/c/:id',
    element: <PublicCasePage />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <CasesListPage />,
      },
      {
        path: 'cases/new',
        element: <NewCasePage />,
      },
      {
        path: 'cases/:id',
        element: <CaseProcessPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
])
