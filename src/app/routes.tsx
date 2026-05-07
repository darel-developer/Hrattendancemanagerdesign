import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./pages/LoginPage";
import { KioskPage } from "./pages/KioskPage";
import { SuperAdminPage } from "./pages/SuperAdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { AttendancePage } from "./pages/AttendancePage";
import { LeavesPage } from "./pages/LeavesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/kiosk",
    Component: KioskPage,
  },
  {
    path: "/superadmin",
    Component: SuperAdminPage,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", Component: DashboardPage },
      { path: "employees", Component: EmployeesPage },
      { path: "employees/:id", Component: EmployeeDetailPage },
      { path: "attendance", Component: AttendancePage },
      { path: "leaves", Component: LeavesPage },
      { path: "reports", Component: ReportsPage },
      { path: "notifications", Component: NotificationsPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
