import type {
  Employee,
  Company,
  AttendanceRecord,
  LeaveRequest,
  Notification,
  Report,
  PerformanceReview,
  EmployeeDocument,
  TeamShift,
} from "../data/mockData";

// Dev : VITE_API_URL absent → /api proxifié par Vite vers localhost:3002
// Prod : VITE_API_URL=https://xxx.koyeb.app → requêtes directes vers Koyeb
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_authToken) headers["Authorization"] = `Bearer ${_authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> | undefined) },
  });

  if (res.status === 401) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    window.dispatchEvent(new CustomEvent("auth:expired", { detail: body }));
    throw new Error(body.error || "Session expirée");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─── Companies ────────────────────────────────────────────────
export const companiesApi = {
  getAll: () => request<Company[]>("/companies"),
  getById: (id: string) => request<Company>(`/companies/${id}`),
  update: (id: string, data: Partial<Company>) =>
    request<Company>(`/companies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Employees ────────────────────────────────────────────────
export const employeesApi = {
  getAll: (params?: { companyId?: string }) => {
    const qs = params?.companyId ? `?companyId=${params.companyId}` : "";
    return request<Employee[]>(`/employees${qs}`);
  },
  getById: (id: string) => request<Employee>(`/employees/${id}`),
  create: (emp: Employee & { password?: string }) =>
    request<Employee>("/employees", { method: "POST", body: JSON.stringify(emp) }),
  update: (id: string, updates: Partial<Employee> & { password?: string }) =>
    request<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/employees/${id}`, { method: "DELETE" }),
};

// ─── Attendance ───────────────────────────────────────────────
export const attendanceApi = {
  getAll: (params?: { date?: string; employeeId?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null)) as Record<string, string>
    ).toString();
    return request<AttendanceRecord[]>(`/attendance${qs ? "?" + qs : ""}`);
  },
  create: (record: Partial<AttendanceRecord>) =>
    request<AttendanceRecord>("/attendance", { method: "POST", body: JSON.stringify(record) }),
  update: (id: string, updates: Partial<AttendanceRecord>) =>
    request<AttendanceRecord>(`/attendance/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
};

// ─── Leaves ───────────────────────────────────────────────────
export const leavesApi = {
  getAll: (params?: { employeeId?: string; companyId?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null)) as Record<string, string>
    ).toString();
    return request<LeaveRequest[]>(`/leaves${qs ? "?" + qs : ""}`);
  },
  create: (leave: Partial<LeaveRequest>) =>
    request<LeaveRequest>("/leaves", { method: "POST", body: JSON.stringify(leave) }),
  update: (id: string, updates: Partial<LeaveRequest>) =>
    request<LeaveRequest>(`/leaves/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
};

// ─── Notifications ────────────────────────────────────────────
export const notificationsApi = {
  getAll: (companyId?: string) => {
    const qs = companyId ? `?companyId=${companyId}` : "";
    return request<Notification[]>(`/notifications${qs}`);
  },
  create: (notif: { type: string; title: string; message: string; employeeId?: string }) =>
    request<Notification>("/notifications", { method: "POST", body: JSON.stringify(notif) }),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: (companyId?: string) => {
    const qs = companyId ? `?companyId=${companyId}` : "";
    return request<{ success: boolean }>(`/notifications/read-all${qs}`, { method: "PUT" });
  },
  deleteOne: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}`, { method: "DELETE" }),
  deleteAll: (companyId: string) =>
    request<{ success: boolean }>(`/notifications?companyId=${companyId}`, { method: "DELETE" }),
};

// ─── Reports ──────────────────────────────────────────────────
export const reportsApi = {
  getReceived: (recipientId: string) =>
    request<Report[]>(`/reports?recipientId=${recipientId}`),
  getSent: (senderId: string) =>
    request<Report[]>(`/reports?senderId=${senderId}`),
  create: (report: { senderId: string; recipientId?: string; title: string; type: string; content: string; attachmentName?: string; attachmentData?: string }) =>
    request<Report>("/reports", { method: "POST", body: JSON.stringify(report) }),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/reports/${id}/read`, { method: "PUT" }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/reports/${id}`, { method: "DELETE" }),
};

// ─── Performance ──────────────────────────────────────────────
export const performanceApi = {
  getAll: (params?: { employeeId?: string; reviewerId?: string; companyId?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null)) as Record<string, string>
    ).toString();
    return request<PerformanceReview[]>(`/performance${qs ? "?" + qs : ""}`);
  },
  create: (review: Partial<PerformanceReview>) =>
    request<PerformanceReview>("/performance", { method: "POST", body: JSON.stringify(review) }),
  update: (id: string, updates: Partial<PerformanceReview>) =>
    request<PerformanceReview>(`/performance/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/performance/${id}`, { method: "DELETE" }),
};

// ─── Documents ────────────────────────────────────────────────
export const documentsApi = {
  getAll: (params?: { employeeId?: string; companyId?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null)) as Record<string, string>
    ).toString();
    return request<EmployeeDocument[]>(`/documents${qs ? "?" + qs : ""}`);
  },
  create: (doc: Partial<EmployeeDocument>) =>
    request<EmployeeDocument>("/documents", { method: "POST", body: JSON.stringify(doc) }),
  update: (id: string, updates: Partial<EmployeeDocument>) =>
    request<EmployeeDocument>(`/documents/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/documents/${id}`, { method: "DELETE" }),
};

// ─── Planning ─────────────────────────────────────────────────
export const planningApi = {
  getAll: (params?: { employeeId?: string; companyId?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null)) as Record<string, string>
    ).toString();
    return request<TeamShift[]>(`/planning${qs ? "?" + qs : ""}`);
  },
  create: (shift: Partial<TeamShift>) =>
    request<TeamShift>("/planning", { method: "POST", body: JSON.stringify(shift) }),
  update: (id: string, updates: Partial<TeamShift>) =>
    request<TeamShift>(`/planning/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/planning/${id}`, { method: "DELETE" }),
};

// ─── Departments ──────────────────────────────────────────────
export type DepartmentItem = { id: string; companyId: string; name: string; employeeCount: number };

export const departmentsApi = {
  getAll: (companyId: string) =>
    request<DepartmentItem[]>(`/departments?companyId=${encodeURIComponent(companyId)}`),
  create: (data: { name: string; companyId: string }) =>
    request<DepartmentItem>("/departments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name: string; companyId: string }) =>
    request<DepartmentItem>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string, companyId: string) =>
    request<{ success: boolean }>(`/departments/${id}?companyId=${encodeURIComponent(companyId)}`, { method: "DELETE" }),
};

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: Employee }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  changePassword: (employeeId: string, currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ employeeId, currentPassword, newPassword }),
    }),
  registerFcmToken: (token: string) =>
    request<{ success: boolean }>("/auth/fcm-token", {
      method: "PUT",
      body: JSON.stringify({ token }),
    }),
};

// ─── Super Admin ──────────────────────────────────────────────
export const superAdminApi = {
  verify: (password: string) =>
    request<{ valid: boolean }>("/superadmin/verify", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  createCompany: (company: { id: string; name: string; sector?: string; address?: string; hrEmail?: string; workStart?: string; lateTolerance?: number }) =>
    request<Company>("/companies", { method: "POST", body: JSON.stringify(company) }),
  deleteCompany: (id: string, superAdminPassword: string) =>
    request<{ success: boolean; deletedEmployees: number }>(`/superadmin/companies/${id}`, {
      method: "DELETE",
      headers: { "x-superadmin-password": superAdminPassword },
    }),
  blockCompany: (id: string, superAdminPassword: string) =>
    request<{ success: boolean; emailsSent: number }>(`/superadmin/companies/${id}/block`, {
      method: "PATCH",
      headers: { "x-superadmin-password": superAdminPassword },
    }),
  unblockCompany: (id: string, superAdminPassword: string) =>
    request<{ success: boolean }>(`/superadmin/companies/${id}/unblock`, {
      method: "PATCH",
      headers: { "x-superadmin-password": superAdminPassword },
    }),
  getAdmins: (companyId: string) =>
    request<Employee[]>(`/employees?companyId=${companyId}&role=Admin`),
  // Appels employés depuis le contexte superadmin (pas de JWT — utilise x-superadmin-password)
  saGetEmployees: (companyId: string, pwd: string) =>
    request<Employee[]>(`/employees?companyId=${companyId}&role=Admin`, {
      headers: { "x-superadmin-password": pwd },
    }),
  saCreateEmployee: (emp: Employee & { password?: string; pin?: string }, pwd: string) =>
    request<Employee>("/employees", {
      method: "POST",
      body: JSON.stringify(emp),
      headers: { "x-superadmin-password": pwd },
    }),
  saDeleteEmployee: (id: string, pwd: string) =>
    request<{ success: boolean }>(`/employees/${id}`, {
      method: "DELETE",
      headers: { "x-superadmin-password": pwd },
    }),
};

// ─── Kiosk ────────────────────────────────────────────────────
export const kioskApi = {
  getEmployees: (companyId: string) =>
    request<Pick<Employee, "id" | "firstName" | "lastName" | "avatar" | "position" | "department">[]>(
      `/kiosk/employees/${companyId}`
    ),
  getToken: (companyId: string) =>
    request<{ token: string; companyId: string; expiresAt: string }>(`/kiosk/token/${companyId}`),
  scan: (token: string, companyId: string, deviceId: string, latitude?: number | null, longitude?: number | null) =>
    request<{ success: boolean; action: "check_in" | "check_out"; time: string; hoursWorked?: number; employee: string; status?: string }>(
      "/kiosk/scan",
      { method: "POST", body: JSON.stringify({ token, companyId, deviceId, latitude, longitude }) }
    ),
};

// ─── Kiosk Accounts (Admin management) ──────────────────────────────────────
export interface KioskAccount {
  id: number;
  email: string;
  label: string | null;
  deviceBound: boolean;
  createdAt: string;
  isActive: boolean;
}

export const kioskAccountsApi = {
  list: () => request<KioskAccount[]>("/kiosk/accounts"),
  create: (data: { email: string; password: string; label?: string }) =>
    request<KioskAccount>("/kiosk/accounts", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/kiosk/accounts/${id}`, { method: "DELETE" }),
  resetDevice: (id: number) =>
    request<{ success: boolean }>(`/kiosk/accounts/${id}/reset-device`, { method: "PATCH" }),
};

export const kioskAuthApi = {
  login: (email: string, password: string, deviceId: string) =>
    request<{ token: string; kioskId: number; companyId: string; companyName: string; label: string | null }>(
      "/kiosk/auth/login",
      { method: "POST", body: JSON.stringify({ email, password, deviceId }) }
    ),
};

// ─── Devices ──────────────────────────────────────────────────
export interface DeviceInfo {
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  deviceName: string;
  registeredAt: string;
  lastSeenAt: string;
  isActive: boolean;
}

export const devicesApi = {
  register: (deviceId: string, deviceName: string) =>
    request<{ success: boolean }>("/devices/register", {
      method: "POST",
      body: JSON.stringify({ deviceId, deviceName }),
    }),
  me: () => request<{ registered: boolean; deviceName?: string; registeredAt?: string }>("/devices/me"),
  list: () => request<DeviceInfo[]>("/devices"),
  reset: (employeeId: string) =>
    request<{ success: boolean }>(`/devices/${employeeId}`, { method: "DELETE" }),
};
