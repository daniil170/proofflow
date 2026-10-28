import { createBrowserRouter } from 'react-router-dom'
import {
  AdminAnalyticsPage,
  AdminApplicationsPage,
  CaseProcessPage,
  CasesListPage,
  ConsentPage,
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
import { AppErrorBoundary, RouteRobotsGuard } from '@/shared/ui'
import { AdminLayout, AppLayout } from '@/widgets'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '/login',
    element: (
      <RouteRobotsGuard noindex={true}>
        <LoginPage />
      </RouteRobotsGuard>
    ),
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '/invite/:code',
    element: (
      <RouteRobotsGuard noindex={true}>
        <InvitePage />
      </RouteRobotsGuard>
    ),
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '/c/:id',
    element: <PublicCasePage />,
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '/consent/:token',
    element: (
      <RouteRobotsGuard noindex={true}>
        <ConsentPage />
      </RouteRobotsGuard>
    ),
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '/cookies',
    element: <CookiesPage />,
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <RouteRobotsGuard noindex={true}>
          <AppLayout />
        </RouteRobotsGuard>
      </ProtectedRoute>
    ),
    errorElement: <AppErrorBoundary />,
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
        <RouteRobotsGuard noindex={true}>
          <AdminLayout />
        </RouteRobotsGuard>
      </ProtectedRoute>
    ),
    errorElement: <AppErrorBoundary />,
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
    errorElement: <AppErrorBoundary />,
  },
])
