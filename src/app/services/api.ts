import type {
  Employee,
  Company,
  AttendanceRecord,
  LeaveRequest,
  Notification,
  Report,
} from "../data/mockData";

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
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
  markAllRead: () =>
    request<{ success: boolean }>("/notifications/read-all", { method: "PUT" }),
  deleteOne: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}`, { method: "DELETE" }),
  deleteAll: () =>
    request<{ success: boolean }>("/notifications", { method: "DELETE" }),
};

// ─── Reports ──────────────────────────────────────────────────
export const reportsApi = {
  getReceived: (recipientId: string) =>
    request<Report[]>(`/reports?recipientId=${recipientId}`),
  getSent: (senderId: string) =>
    request<Report[]>(`/reports?senderId=${senderId}`),
  create: (report: { senderId: string; recipientId?: string; title: string; type: string; content: string }) =>
    request<Report>("/reports", { method: "POST", body: JSON.stringify(report) }),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/reports/${id}/read`, { method: "PUT" }),
};

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<Employee>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  changePassword: (employeeId: string, currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ employeeId, currentPassword, newPassword }),
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
  deleteCompany: (id: string) =>
    request<{ success: boolean }>(`/companies/${id}`, { method: "DELETE" }),
  getAdmins: (companyId: string) =>
    request<Employee[]>(`/employees?companyId=${companyId}&role=Admin`),
};

// ─── Kiosk ────────────────────────────────────────────────────
export const kioskApi = {
  getEmployees: (companyId: string) =>
    request<Pick<Employee, "id" | "firstName" | "lastName" | "avatar" | "position" | "department">[]>(
      `/kiosk/employees/${companyId}`
    ),
  checkin: (employeeId: string, pin: string, companyId: string) =>
    request<{ success: boolean; action: "check_in" | "check_out"; time: string; hoursWorked?: number; employee: string; status?: string }>(
      "/kiosk/checkin",
      { method: "POST", body: JSON.stringify({ employeeId, pin, companyId }) }
    ),
};
