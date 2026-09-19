import { type ReactNode } from 'react';

import { useStaffUser } from '../../lib/admin/admin-catalog-api';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from '../../lib/admin/admin-auth';
import { AdminDashboardPage, hasAdminDashboardRole } from '../../pages/admin/admin-dashboard-page';

import { AdminOrderDetailPage, AdminOrdersPage } from '../../pages/admin/admin-orders-page';
import { AdminSupportFinancePage } from '../../pages/admin/admin-support-finance-page';
import { AdminCatalogInventoryPage } from '../../pages/admin/admin-catalog-inventory-page';
import { AdminContentSeoPage } from '../../pages/admin/admin-content-seo-page';

import { decodeHashSegment } from '../../hooks/routing/hash-route';

import { AdminDashboard } from './admin-dashboard';

import { AdminLegacyPage } from './admin-legacy-page';

import { AdminLoginPage } from './admin-login-page';

import { AdminPermissionDeniedPage } from './admin-permission-denied-page';

import { AdminProductsPage } from './admin-products-page';

import { AdminRouteUnavailablePage } from './admin-route-unavailable-page';

import { AdminSessionLoading } from './admin-session-loading';

import { AdminWorkspaceShell } from './admin-workspace-shell';

import { shouldShowAdminDashboardPreview } from '../../utils/app/should-show-admin-dashboard-preview';

export function AdminPage({ page, queryString = '' }: { page: string; queryString?: string }) {
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
    <AdminWorkspaceShell
      page={page}
      allowDevelopmentPreview={allowDevelopmentPreview}
      adminDisplayName={adminDisplayName}
      adminAccountLabel={adminAccountLabel}
    >
      {content}
    </AdminWorkspaceShell>
  );
  const [adminSection, ...adminPathSegments] = page.split('/');
  if (adminSection === 'orders') {
    const encodedOrderNumber = adminPathSegments.join('/');
    return withWorkspaceShell(
      encodedOrderNumber ? (
        <AdminOrderDetailPage
          orderNumber={decodeHashSegment(encodedOrderNumber)}
          staffRoles={staffRoles}
        />
      ) : (
        <AdminOrdersPage staffRoles={staffRoles} />
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
      <AdminSupportFinancePage view={adminSection} queryString={queryString} />,
    );
  }
  if (adminSection === 'catalog' || adminSection === 'inventory') {
    const [subsection, encodedId] = adminPathSegments;
    if (adminSection === 'catalog' && subsection === 'categories') {
      return withWorkspaceShell(
        <AdminCatalogInventoryPage view="categories" staffRoles={staffRoles} />,
      );
    }
    if (adminSection === 'catalog' && subsection === 'products' && encodedId === 'new') {
      return withWorkspaceShell(
        <AdminCatalogInventoryPage view="product" staffRoles={staffRoles} />,
      );
    }
    if (adminSection === 'catalog' && subsection === 'products' && encodedId) {
      return withWorkspaceShell(
        <AdminCatalogInventoryPage
          view="product"
          productId={decodeHashSegment(encodedId)}
          staffRoles={staffRoles}
        />,
      );
    }
    if (adminSection === 'inventory') {
      return withWorkspaceShell(
        <AdminCatalogInventoryPage
          view="inventory"
          variantId={encodedId ? decodeHashSegment(encodedId) : undefined}
          staffRoles={staffRoles}
        />,
      );
    }
    return withWorkspaceShell(<AdminCatalogInventoryPage view="catalog" staffRoles={staffRoles} />);
  }
  if (adminSection === 'content') {
    const [subsection, encodedId] = adminPathSegments;
    if (subsection === 'seo' || subsection === 'redirects') {
      return withWorkspaceShell(<AdminContentSeoPage view={subsection} staffRoles={staffRoles} />);
    }
    if (subsection === 'pages' && encodedId) {
      return withWorkspaceShell(
        <AdminContentSeoPage
          view="content"
          pageId={decodeHashSegment(encodedId)}
          staffRoles={staffRoles}
        />,
      );
    }
    return withWorkspaceShell(<AdminContentSeoPage view="content" staffRoles={staffRoles} />);
  }
  if (page === 'products/new') {
    return withWorkspaceShell(<AdminCatalogInventoryPage view="product" staffRoles={staffRoles} />);
  }
  if (page === 'products') return withWorkspaceShell(<AdminProductsPage />);
  if (page !== 'admin') {
    if (!allowDevelopmentPreview)
      return withWorkspaceShell(<AdminRouteUnavailablePage page={page} />);
    return withWorkspaceShell(<AdminLegacyPage page={page} />);
  }
  return withWorkspaceShell(
    allowDevelopmentPreview ? <AdminDashboard /> : <AdminDashboardPage staffRoles={staffRoles} />,
  );
}
