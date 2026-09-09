import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/shared/components/layout/AppShell'
import { AuthGuard, GuestGuard } from '@/app/guards/AuthGuard'
import { ProductSubscriptionGuard } from '@/app/guards/ProductSubscriptionGuard'
import AuthPage from '@/modules/auth/pages/AuthPage'
import ForgotPasswordPage from '@/modules/auth/pages/ForgotPasswordPage'
import VerifyOtpPage from '@/modules/auth/pages/VerifyOtpPage'
import CompleteProfilePage from '@/modules/auth/pages/CompleteProfilePage'
import PlatformDashboard from '@/modules/platform/pages/PlatformDashboard'
import OperatorQueuePage from '@/modules/platform/pages/OperatorQueuePage'
import { PlaceholderPage } from '@/modules/platform/pages/PlaceholderPage'
import ClientsPage from '@/modules/clients/pages/ClientsPage'
import BillingPage from '@/modules/billing/pages/BillingPage'
import SubscribePage from '@/modules/billing/pages/SubscribePage'
import ProfilePage from '@/modules/auth/pages/ProfilePage'
import DashboardPage from '@/products/duewise/pages/DashboardPage'
import InvoicesPage from '@/products/duewise/pages/InvoicesPage'

function ProtectedLayout({ children }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}

function ProductLayout({ product, children }) {
  return (
    <ProtectedLayout>
      <ProductSubscriptionGuard product={product}>{children}</ProductSubscriptionGuard>
    </ProtectedLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <GuestGuard>
              <AuthPage />
            </GuestGuard>
          }
        />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
        <Route
          path="/auth/complete-profile"
          element={
            <AuthGuard>
              <CompleteProfilePage />
            </AuthGuard>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedLayout>
              <PlatformDashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/app/operator"
          element={
            <ProtectedLayout>
              <OperatorQueuePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/app/clients"
          element={
            <ProtectedLayout>
              <ClientsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/app/profile"
          element={
            <ProtectedLayout>
              <ProfilePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/app/billing"
          element={
            <ProtectedLayout>
              <BillingPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/app/billing/subscribe"
          element={
            <ProtectedLayout>
              <SubscribePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/app/integrations"
          element={
            <ProtectedLayout>
              <PlaceholderPage type="integrations" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedLayout>
              <PlaceholderPage type="tenant-settings" />
            </ProtectedLayout>
          }
        />

        <Route
          path="/products/duewise"
          element={
            <ProductLayout product="duewise">
              <DashboardPage />
            </ProductLayout>
          }
        />
        <Route
          path="/products/duewise/invoices"
          element={
            <ProductLayout product="duewise">
              <InvoicesPage />
            </ProductLayout>
          }
        />
        <Route
          path="/products/duewise/insights"
          element={
            <ProductLayout product="duewise">
              <PlaceholderPage type="insights" />
            </ProductLayout>
          }
        />
        <Route
          path="/products/duewise/cashflow"
          element={
            <ProductLayout product="duewise">
              <PlaceholderPage type="cashflow" />
            </ProductLayout>
          }
        />
        <Route
          path="/products/duewise/sequences"
          element={
            <ProductLayout product="duewise">
              <PlaceholderPage type="sequences" />
            </ProductLayout>
          }
        />
        <Route
          path="/products/duewise/settings"
          element={
            <ProductLayout product="duewise">
              <PlaceholderPage type="settings" />
            </ProductLayout>
          }
        />

        <Route path="/dashboard" element={<Navigate to="/products/duewise" replace />} />
        <Route path="/invoices" element={<Navigate to="/products/duewise/invoices" replace />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/integrations" element={<Navigate to="/app/integrations" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
        <Route path="/products/:productId" element={<Navigate to="/app" replace />} />

        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
