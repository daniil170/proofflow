import { createBrowserRouter } from 'react-router-dom'
import {
  AdminAnalyticsPage,
  AdminApplicationsPage,
  CaseProcessPage,
  CasesListPage,
  InvitePage,
  LandingPage,
  LoginPage,
  NewCasePage,
  NotFoundPage,
  PublicCasePage,
  SettingsPage,
  WelcomePage,
  TermsPage,
  PrivacyPage,
  CookiesPage,
} from '@/pages'
import { ProtectedRoute } from '@/features/auth'
import { AdminLayout, AppLayout } from '@/widgets'

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
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminApplicationsPage />,
      },
      {
        path: 'applications',
        element: <AdminApplicationsPage />,
      },
      {
        path: 'analytics',
        element: <AdminAnalyticsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
