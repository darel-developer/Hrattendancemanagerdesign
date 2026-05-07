// ─── Employees ───────────────────────────────────────────────────────────────
export type Role = "Admin" | "Manager" | "Employee";
export type Department = "Ingénierie" | "RH" | "Marketing" | "Finance" | "Direction" | "Design";
export type ContractType = "CDI" | "CDD" | "Stage" | "Freelance";
export type EmployeeStatus = "Actif" | "Inactif" | "En congé";

export interface Employee {
  id: string;
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
}

export const employees: Employee[] = [
  {
    id: "EMP001",
    firstName: "Sophie",
    lastName: "Moreau",
    email: "sophie.moreau@company.com",
    phone: "+33 6 12 34 56 78",
    avatar: "https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    role: "Admin",
    department: "Direction",
    position: "DRH",
    contractType: "CDI",
    startDate: "2019-03-15",
    salary: 6500,
    status: "Actif",
    manager: null,
    address: "12 Rue de la Paix, Paris",
    birthDate: "1985-07-22",
    leaveBalance: 25,
    leaveUsed: 8,
  },
  {
    id: "EMP002",
    firstName: "Thomas",
    lastName: "Dubois",
    email: "thomas.dubois@company.com",
    phone: "+33 6 98 76 54 32",
    avatar: "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    role: "Manager",
    department: "Ingénierie",
    position: "Lead Developer",
    contractType: "CDI",
    startDate: "2020-06-01",
    salary: 5800,
    status: "Actif",
    manager: "EMP001",
    address: "45 Avenue Victor Hugo, Lyon",
    birthDate: "1990-02-14",
    leaveBalance: 25,
    leaveUsed: 12,
  },
  {
    id: "EMP003",
    firstName: "Amina",
    lastName: "Benali",
    email: "amina.benali@company.com",
    phone: "+33 6 55 44 33 22",
    avatar: "https://images.unsplash.com/photo-1666867936058-de34bfd5b320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    role: "Employee",
    department: "RH",
    position: "Chargée RH",
    contractType: "CDI",
    startDate: "2021-09-01",
    salary: 3800,
    status: "Actif",
    manager: "EMP001",
    address: "8 Rue des Fleurs, Marseille",
    birthDate: "1993-11-30",
    leaveBalance: 25,
    leaveUsed: 5,
  },
  {
    id: "EMP004",
    firstName: "Lucas",
    lastName: "Bernard",
    email: "lucas.bernard@company.com",
    phone: "+33 7 11 22 33 44",
    avatar: "https://images.unsplash.com/photo-1753450298481-362990f811ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    role: "Employee",
    department: "Ingénierie",
    position: "Développeur Frontend",
    contractType: "CDI",
    startDate: "2022-02-14",
    salary: 4200,
    status: "Actif",
    manager: "EMP002",
    address: "33 Boulevard Montparnasse, Paris",
    birthDate: "1996-05-08",
    leaveBalance: 25,
    leaveUsed: 3,
  },
  {
    id: "EMP005",
    firstName: "Claire",
    lastName: "Fontaine",
    email: "claire.fontaine@company.com",
    phone: "+33 6 77 88 99 00",
    avatar: "https://images.unsplash.com/photo-1758518727888-ffa196002e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    role: "Manager",
    department: "Marketing",
    position: "Responsable Marketing",
    contractType: "CDI",
    startDate: "2020-11-03",
    salary: 5200,
    status: "En congé",
    manager: "EMP001",
    address: "19 Rue du Commerce, Bordeaux",
    birthDate: "1988-09-17",
    leaveBalance: 25,
    leaveUsed: 18,
  },
  {
    id: "EMP006",
    firstName: "Mehdi",
    lastName: "Karim",
    email: "mehdi.karim@company.com",
    phone: "+33 6 33 44 55 66",
    avatar: "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    role: "Employee",
    department: "Finance",
    position: "Contrôleur Financier",
    contractType: "CDI",
    startDate: "2021-04-12",
    salary: 4600,
    status: "Actif",
    manager: "EMP001",
    address: "27 Rue Nationale, Lille",
    birthDate: "1991-01-25",
    leaveBalance: 25,
    leaveUsed: 7,
  },
  {
    id: "EMP007",
    firstName: "Léa",
    lastName: "Martin",
    email: "lea.martin@company.com",
    phone: "+33 6 22 11 00 99",
    avatar: "https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    role: "Employee",
    department: "Design",
    position: "UI/UX Designer",
    contractType: "CDD",
    startDate: "2023-01-09",
    salary: 3500,
    status: "Actif",
    manager: "EMP002",
    address: "5 Allée des Roses, Nice",
    birthDate: "1998-08-12",
    leaveBalance: 18,
    leaveUsed: 2,
  },
  {
    id: "EMP008",
    firstName: "Antoine",
    lastName: "Leroy",
    email: "antoine.leroy@company.com",
    phone: "+33 7 99 88 77 66",
    avatar: "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    role: "Employee",
    department: "Ingénierie",
    position: "Développeur Backend",
    contractType: "Stage",
    startDate: "2024-02-01",
    salary: 1800,
    status: "Inactif",
    manager: "EMP002",
    address: "14 Rue de la République, Strasbourg",
    birthDate: "2000-03-29",
    leaveBalance: 10,
    leaveUsed: 0,
  },
];

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

export const attendanceRecords: AttendanceRecord[] = [
  { id: "ATT001", employeeId: "EMP001", date: "2026-04-14", checkIn: "08:55", checkOut: "18:10", status: "Présent", hoursWorked: 9.25, note: "" },
  { id: "ATT002", employeeId: "EMP002", date: "2026-04-14", checkIn: "09:15", checkOut: "18:30", status: "Retard", hoursWorked: 9.25, note: "Retard de 15 min" },
  { id: "ATT003", employeeId: "EMP003", date: "2026-04-14", checkIn: "08:45", checkOut: "17:45", status: "Présent", hoursWorked: 9.0, note: "" },
  { id: "ATT004", employeeId: "EMP004", date: "2026-04-14", checkIn: "09:00", checkOut: null, status: "Présent", hoursWorked: null, note: "" },
  { id: "ATT005", employeeId: "EMP005", date: "2026-04-14", checkIn: null, checkOut: null, status: "Congé", hoursWorked: 0, note: "Congé validé" },
  { id: "ATT006", employeeId: "EMP006", date: "2026-04-14", checkIn: "08:30", checkOut: "17:30", status: "Présent", hoursWorked: 9.0, note: "" },
  { id: "ATT007", employeeId: "EMP007", date: "2026-04-14", checkIn: "09:00", checkOut: "18:00", status: "Télétravail", hoursWorked: 9.0, note: "Télétravail approuvé" },
  { id: "ATT008", employeeId: "EMP008", date: "2026-04-14", checkIn: null, checkOut: null, status: "Absent", hoursWorked: 0, note: "Non justifié" },

  { id: "ATT009", employeeId: "EMP001", date: "2026-04-13", checkIn: "09:00", checkOut: "18:00", status: "Présent", hoursWorked: 9.0, note: "" },
  { id: "ATT010", employeeId: "EMP002", date: "2026-04-13", checkIn: "09:00", checkOut: "18:30", status: "Présent", hoursWorked: 9.5, note: "" },
  { id: "ATT011", employeeId: "EMP003", date: "2026-04-13", checkIn: "09:30", checkOut: "18:00", status: "Retard", hoursWorked: 8.5, note: "" },
  { id: "ATT012", employeeId: "EMP004", date: "2026-04-13", checkIn: "09:00", checkOut: "18:00", status: "Présent", hoursWorked: 9.0, note: "" },
  { id: "ATT013", employeeId: "EMP006", date: "2026-04-13", checkIn: "08:30", checkOut: "17:30", status: "Présent", hoursWorked: 9.0, note: "" },
  { id: "ATT014", employeeId: "EMP007", date: "2026-04-13", checkIn: "09:00", checkOut: "18:00", status: "Télétravail", hoursWorked: 9.0, note: "" },
];

// ─── Leave Requests ───────────────────────────────────────────────────────────
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

export const leaveRequests: LeaveRequest[] = [
  {
    id: "LVE001", employeeId: "EMP004", type: "Congé annuel",
    startDate: "2026-04-20", endDate: "2026-04-25", days: 5,
    reason: "Vacances en famille", status: "En attente",
    requestDate: "2026-04-10", reviewedBy: null, reviewDate: null, comment: "",
  },
  {
    id: "LVE002", employeeId: "EMP003", type: "RTT",
    startDate: "2026-04-16", endDate: "2026-04-16", days: 1,
    reason: "RTT accumulée", status: "Approuvé",
    requestDate: "2026-04-08", reviewedBy: "EMP001", reviewDate: "2026-04-09", comment: "Approuvé",
  },
  {
    id: "LVE003", employeeId: "EMP005", type: "Congé annuel",
    startDate: "2026-04-07", endDate: "2026-04-18", days: 10,
    reason: "Congé printemps", status: "Approuvé",
    requestDate: "2026-03-15", reviewedBy: "EMP001", reviewDate: "2026-03-17", comment: "",
  },
  {
    id: "LVE004", employeeId: "EMP006", type: "Maladie",
    startDate: "2026-04-02", endDate: "2026-04-03", days: 2,
    reason: "Arrêt médical", status: "Approuvé",
    requestDate: "2026-04-02", reviewedBy: "EMP001", reviewDate: "2026-04-02", comment: "Justificatif reçu",
  },
  {
    id: "LVE005", employeeId: "EMP007", type: "Exceptionnel",
    startDate: "2026-04-28", endDate: "2026-04-28", days: 1,
    reason: "Déménagement", status: "En attente",
    requestDate: "2026-04-12", reviewedBy: null, reviewDate: null, comment: "",
  },
  {
    id: "LVE006", employeeId: "EMP002", type: "Congé annuel",
    startDate: "2026-05-05", endDate: "2026-05-09", days: 5,
    reason: "Vacances", status: "Refusé",
    requestDate: "2026-04-01", reviewedBy: "EMP001", reviewDate: "2026-04-03", comment: "Pic de charge projet en mai",
  },
];

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

export const notifications: Notification[] = [
  { id: "N001", type: "absence", title: "Absence non justifiée", message: "Antoine Leroy est absent aujourd'hui sans justificatif.", date: "2026-04-14T08:30:00", read: false, employeeId: "EMP008" },
  { id: "N002", type: "retard", title: "Retard signalé", message: "Thomas Dubois a pointé avec 15 min de retard.", date: "2026-04-14T09:20:00", read: false, employeeId: "EMP002" },
  { id: "N003", type: "conge", title: "Demande de congé en attente", message: "Lucas Bernard a soumis une demande de congé du 20 au 25 avril.", date: "2026-04-10T10:00:00", read: false, employeeId: "EMP004" },
  { id: "N004", type: "conge", title: "Demande de congé en attente", message: "Léa Martin a soumis une demande de congé exceptionnel.", date: "2026-04-12T14:00:00", read: false, employeeId: "EMP007" },
  { id: "N005", type: "document", title: "Contrat expirant", message: "Le CDD de Léa Martin expire dans 60 jours (09 Juillet 2026).", date: "2026-04-13T09:00:00", read: true, employeeId: "EMP007" },
  { id: "N006", type: "system", title: "Export rapport mensuel", message: "Le rapport de présence de mars 2026 est prêt à être exporté.", date: "2026-04-01T07:00:00", read: true, employeeId: null },
  { id: "N007", type: "document", title: "Stage expirant", message: "Le stage d'Antoine Leroy expire dans 45 jours.", date: "2026-04-13T09:05:00", read: true, employeeId: "EMP008" },
  { id: "N008", type: "absence", title: "Taux d'absence élevé", message: "Le département Ingénierie a un taux d'absence de 12% cette semaine.", date: "2026-04-14T07:00:00", read: false, employeeId: null },
];

// ─── Weekly attendance chart data ─────────────────────────────────────────────
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