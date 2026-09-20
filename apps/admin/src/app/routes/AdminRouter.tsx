import { type ReactNode } from 'react';

import {
  isStaffAuthFailure,
  isStaffAuthorizationFailure,
  useStaffUser,
} from '@/features/auth';
import { AdminDashboard, DashboardView, hasAdminDashboardRole } from '@/features/dashboard';

import { OrderDetailView, OrdersView } from '@/features/orders';
import { SupportFinanceView } from '@/features/support';
import { CatalogInventoryView } from '@/features/catalog';
import { ContentSeoView } from '@/features/content';

import { decodeHashSegment } from '@/app/routing/hash-route';

import { AdminLegacyPage } from '@/app/routes/AdminLegacyPage';

import { AdminLoginPage } from '@/features/auth';

import { AdminPermissionDeniedPage } from '@/features/auth';

import { AdminProductsPage } from '@/features/catalog';

import { AdminRouteUnavailablePage } from '@/app/routes/AdminRouteUnavailablePage';

import { AdminSessionLoading } from '@/features/auth';

import { AdminWorkspaceLayout } from '@/app/layouts/AdminWorkspaceLayout';

import { shouldShowAdminDashboardPreview } from '@/shared/utils/should-show-admin-dashboard-preview';

export function AdminRouter({ page, queryString = '' }: { page: string; queryString?: string }) {
  const isLoginPage = page === 'login';
  const sessionExpired = new URLSearchParams(queryString).get('expired') === '1';
  const staffQuery = useStaffUser(!isLoginPage);
  const authFailure = isStaffAuthFailure(staffQuery.error);
  const authorizationFailure = isStaffAuthorizationFailure(staffQuery.error);
  const hasStaffSession = Boolean(staffQuery.data) && !authFailure;
  const staffRoles = staffQuery.data?.roles;
  const allowDevelopmentPreview = shouldShowAdminDashboardPreview({
    page,
    isDevelopment: import.meta.env.DEV,
    hasStaffSession: Boolean(staffQuery.data),
  });

  if (isLoginPage) return <AdminLoginPage sessionExpired={sessionExpired} />;
  if (authorizationFailure) return <AdminPermissionDeniedPage />;
  if (staffQuery.isPending && !allowDevelopmentPreview) return <AdminSessionLoading />;
  if (authFailure && staffQuery.data) return <AdminLoginPage sessionExpired />;
  if (!hasStaffSession && !allowDevelopmentPreview) return <AdminLoginPage />;
  if (page === 'admin' && hasStaffSession && !hasAdminDashboardRole(staffRoles)) {
    return <AdminPermissionDeniedPage />;
  }
  const adminDisplayName = allowDevelopmentPreview
    ? 'مدیر نمونه'
    : (staffQuery.data?.email ?? 'کاربر مدیریت');
  const adminAccountLabel = allowDevelopmentPreview ? 'حساب نمایشی' : 'نشست فعال';
  const withWorkspaceShell = (content: ReactNode) => (
    <AdminWorkspaceLayout
      page={page}
      allowDevelopmentPreview={allowDevelopmentPreview}
      adminDisplayName={adminDisplayName}
      adminAccountLabel={adminAccountLabel}
      staffRoles={staffRoles}
    >
      {content}
    </AdminWorkspaceLayout>
  );
  const [adminSection, ...adminPathSegments] = page.split('/');
  if (adminSection === 'orders') {
    const encodedOrderNumber = adminPathSegments.join('/');
    return withWorkspaceShell(
      encodedOrderNumber ? (
        <OrderDetailView
          orderNumber={decodeHashSegment(encodedOrderNumber)}
          staffRoles={staffRoles}
        />
      ) : (
        <OrdersView staffRoles={staffRoles} />
      ),
    );
  }
  if (
    adminSection === 'payments' ||
    adminSection === 'customers' ||
    adminSection === 'notifications' ||
    adminSection === 'audit'
  ) {
    return withWorkspaceShell(
      <SupportFinanceView view={adminSection} queryString={queryString} />,
    );
  }
  if (adminSection === 'catalog' || adminSection === 'inventory') {
    const [subsection, encodedId] = adminPathSegments;
    if (adminSection === 'catalog' && subsection === 'categories') {
      return withWorkspaceShell(
        <CatalogInventoryView view="categories" staffRoles={staffRoles} />,
      );
    }
    if (adminSection === 'catalog' && subsection === 'products' && encodedId === 'new') {
      return withWorkspaceShell(
        <CatalogInventoryView view="product" staffRoles={staffRoles} />,
      );
    }
    if (adminSection === 'catalog' && subsection === 'products' && encodedId) {
      return withWorkspaceShell(
        <CatalogInventoryView
          view="product"
          productId={decodeHashSegment(encodedId)}
          staffRoles={staffRoles}
        />,
      );
    }
    if (adminSection === 'inventory') {
      return withWorkspaceShell(
        <CatalogInventoryView
          view="inventory"
          variantId={encodedId ? decodeHashSegment(encodedId) : undefined}
          staffRoles={staffRoles}
        />,
      );
    }
    return withWorkspaceShell(<CatalogInventoryView view="catalog" staffRoles={staffRoles} />);
  }
  if (adminSection === 'content') {
    const [subsection, encodedId] = adminPathSegments;
    if (subsection === 'seo' || subsection === 'redirects') {
      return withWorkspaceShell(<ContentSeoView view={subsection} staffRoles={staffRoles} />);
    }
    if (subsection === 'pages' && encodedId) {
      return withWorkspaceShell(
        <ContentSeoView
          view="content"
          pageId={decodeHashSegment(encodedId)}
          staffRoles={staffRoles}
        />,
      );
    }
    return withWorkspaceShell(<ContentSeoView view="content" staffRoles={staffRoles} />);
  }
  if (page === 'products/new') {
    return withWorkspaceShell(<CatalogInventoryView view="product" staffRoles={staffRoles} />);
  }
  if (page === 'products') return withWorkspaceShell(<AdminProductsPage />);
  if (page !== 'admin') {
    if (!allowDevelopmentPreview)
      return withWorkspaceShell(<AdminRouteUnavailablePage page={page} />);
    return withWorkspaceShell(<AdminLegacyPage page={page} />);
  }
  return withWorkspaceShell(
    allowDevelopmentPreview ? <AdminDashboard /> : <DashboardView staffRoles={staffRoles} />,
  );
}
