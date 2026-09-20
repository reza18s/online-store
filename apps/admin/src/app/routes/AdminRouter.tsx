import { type ReactNode } from 'react';

import {
  isStaffAuthFailure,
  isStaffAuthorizationFailure,
  useStaffUser,
} from '@/features/auth';
import { DashboardView, hasAdminDashboardRole } from '@/features/dashboard';

import { OrderDetailView, OrdersView } from '@/features/orders';
import { SupportFinanceView } from '@/features/support';
import { CatalogInventoryView } from '@/features/catalog';
import { ContentSeoView } from '@/features/content';

import { decodeRouteSegment } from '@/app/routing/decode-route-segment';

import { AdminLoginPage } from '@/features/auth';

import { AdminPermissionDeniedPage } from '@/features/auth';

import { AdminRouteUnavailablePage } from '@/app/routes/AdminRouteUnavailablePage';

import { AdminSessionLoading } from '@/features/auth';

import { AdminWorkspaceLayout } from '@/app/layouts/AdminWorkspaceLayout';


export function AdminRouter({ page, queryString = '' }: { page: string; queryString?: string }) {
  const isLoginPage = page === 'login';
  const sessionExpired = new URLSearchParams(queryString).get('expired') === '1';
  const staffQuery = useStaffUser(!isLoginPage);
  const authFailure = isStaffAuthFailure(staffQuery.error);
  const authorizationFailure = isStaffAuthorizationFailure(staffQuery.error);
  const hasStaffSession = Boolean(staffQuery.data) && !authFailure;
  const staffRoles = staffQuery.data?.roles;

  if (isLoginPage) return <AdminLoginPage sessionExpired={sessionExpired} />;
  if (authorizationFailure) return <AdminPermissionDeniedPage />;
  if (staffQuery.isPending) return <AdminSessionLoading />;
  if (authFailure && staffQuery.data) return <AdminLoginPage sessionExpired />;
  if (!hasStaffSession) return <AdminLoginPage />;
  if (page === 'admin' && hasStaffSession && !hasAdminDashboardRole(staffRoles)) {
    return <AdminPermissionDeniedPage />;
  }
  const adminDisplayName = staffQuery.data?.email ?? 'کاربر مدیریت';
  const withWorkspaceShell = (content: ReactNode) => (
    <AdminWorkspaceLayout
      page={page}
      adminDisplayName={adminDisplayName}
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
          orderNumber={decodeRouteSegment(encodedOrderNumber)}
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
          productId={decodeRouteSegment(encodedId)}
          staffRoles={staffRoles}
        />,
      );
    }
    if (adminSection === 'inventory') {
      return withWorkspaceShell(
        <CatalogInventoryView
          view="inventory"
          variantId={encodedId ? decodeRouteSegment(encodedId) : undefined}
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
          pageId={decodeRouteSegment(encodedId)}
          staffRoles={staffRoles}
        />,
      );
    }
    return withWorkspaceShell(<ContentSeoView view="content" staffRoles={staffRoles} />);
  }
  if (page !== 'admin') {
    return withWorkspaceShell(<AdminRouteUnavailablePage page={page} />);
  }
  return withWorkspaceShell(
    <DashboardView staffRoles={staffRoles} />,
  );
}
