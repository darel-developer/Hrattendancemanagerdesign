// ─── Types & Interfaces ───────────────────────────────────────────────────────
export type Role = "Admin" | "Manager" | "Employee";
export type Department = string;
export type ContractType = "CDI" | "CDD" | "Stage" | "Freelance";
export type EmployeeStatus = "Actif" | "Inactif" | "En congé";

export interface Employee {
  id: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  role: Role;
  department: Department;
  position: string;
  contractType: ContractType;
  startDate: string;
  salary: number;
  status: EmployeeStatus;
  managerId: string | null;
  address: string;
  birthDate: string;
  leaveBalance: number;
  leaveUsed: number;
  pin?: string | null;
  workDays?: string[];
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  address: string;
  hrEmail: string;
  workStart: string;
  lateTolerance: number;
  latitude?: number | null;
  longitude?: number | null;
  geoRadius?: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = "Présent" | "Absent" | "Retard" | "Congé" | "Télétravail";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  hoursWorked: number | null;
  note: string;
  latitude?: number;
  longitude?: number;
}

// ─── Leave requests ───────────────────────────────────────────────────────────
export type LeaveType = "Congé annuel" | "Maladie" | "Congé maternité" | "RTT" | "Exceptionnel";
export type LeaveStatus = "En attente" | "Approuvé" | "Refusé";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  requestDate: string;
  reviewedBy: string | null;
  reviewDate: string | null;
  comment: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotifType = "absence" | "conge" | "document" | "retard" | "system";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  employeeId: string | null;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface Report {
  id: string;
  senderId: string;
  recipientId: string | null;
  title: string;
  type: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  attachmentName?: string | null;
  attachmentData?: string | null;
}

// ─── Performance Reviews ──────────────────────────────────────────────────────
export type ReviewStatus = "Brouillon" | "Soumis" | "Acquitté";

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: string;
  rating: number | null;
  strengths: string;
  improvements: string;
  goals: string;
  status: ReviewStatus;
  createdAt: string | null;
}

// ─── Employee Documents ───────────────────────────────────────────────────────
export interface EmployeeDocument {
  id: string;
  employeeId: string;
  title: string;
  type: string;
  fileUrl: string;
  expiryDate: string | null;
  createdAt: string | null;
}

// ─── Team Shifts ──────────────────────────────────────────────────────────────
export type ShiftType = "Matin" | "Après-midi" | "Nuit" | "Repos";

export interface TeamShift {
  id: string;
  employeeId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  shiftType: ShiftType;
  note: string;
  createdAt: string | null;
}

