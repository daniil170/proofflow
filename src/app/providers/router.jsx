import { createBrowserRouter } from 'react-router-dom'
import {
  CaseProcessPage,
  CasesListPage,
  InvitePage,
  LandingPage,
  LoginPage,
  NewCasePage,
  PublicCasePage,
  SettingsPage,
  WelcomePage,
  TermsPage,
  PrivacyPage,
  CookiesPage,
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
    path: '/invite/:code',
    element: <InvitePage />,
  },
  {
    path: '/c/:id',
    element: <PublicCasePage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/cookies',
    element: <CookiesPage />,
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
        path: 'welcome',
        element: <WelcomePage />,
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
