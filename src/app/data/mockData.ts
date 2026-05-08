// ─── Types & Interfaces ───────────────────────────────────────────────────────
export type Role = "Admin" | "Manager" | "Employee";
export type Department = "Ingénierie" | "RH" | "Marketing" | "Finance" | "Direction" | "Design";
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
  manager: string | null;
  address: string;
  birthDate: string;
  leaveBalance: number;
  leaveUsed: number;
  pin?: string | null;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  address: string;
  hrEmail: string;
  workStart: string;
  lateTolerance: number;
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
  read: boolean;
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

// ─── Static chart data (utilisé pour les graphiques de démonstration) ─────────
export const weeklyAttendanceData = [
  { day: "Lun", presents: 6, absents: 1, retards: 1 },
  { day: "Mar", presents: 7, absents: 0, retards: 1 },
  { day: "Mer", presents: 5, absents: 2, retards: 1 },
  { day: "Jeu", presents: 6, absents: 1, retards: 0 },
  { day: "Ven", presents: 7, absents: 1, retards: 0 },
];

export const monthlyAttendanceData = [
  { month: "Oct", taux: 92 },
  { month: "Nov", taux: 88 },
  { month: "Dec", taux: 85 },
  { month: "Jan", taux: 90 },
  { month: "Fév", taux: 93 },
  { month: "Mar", taux: 91 },
  { month: "Avr", taux: 87 },
];

export const departmentData = [
  { name: "Ingénierie", value: 3, color: "#6366F1" },
  { name: "RH", value: 1, color: "#8B5CF6" },
  { name: "Marketing", value: 1, color: "#EC4899" },
  { name: "Finance", value: 1, color: "#14B8A6" },
  { name: "Direction", value: 1, color: "#F59E0B" },
  { name: "Design", value: 1, color: "#10B981" },
];

export const hoursWorkedData = [
  { week: "S1", heures: 42 },
  { week: "S2", heures: 38 },
  { week: "S3", heures: 45 },
  { week: "S4", heures: 40 },
  { week: "S5", heures: 43 },
  { week: "S6", heures: 39 },
  { week: "S7", heures: 44 },
  { week: "S8", heures: 41 },
];

export const departments: Department[] = [
  "Ingénierie", "RH", "Marketing", "Finance", "Direction", "Design"
];
