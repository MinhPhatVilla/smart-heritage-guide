import React from 'react';
import {
  AdminWorkspaceShell,
  AdminWorkspaceShellProps,
} from './admin/AdminWorkspaceShell';

export type AdminDashboardViewProps = AdminWorkspaceShellProps;

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = (
  props
) => <AdminWorkspaceShell {...props} />;

export default AdminDashboardView;
