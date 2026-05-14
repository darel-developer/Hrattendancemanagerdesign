export interface QueuedAction {
  localId: string;
  type: "checkIn" | "checkOut";
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
  note?: string;
  hoursWorked?: number | null;
  recordId?: string;
  savedAt: string;
}

const QUEUE_KEY = "hr_attendance_queue";

export function getQueue(employeeId?: string): QueuedAction[] {
  try {
    const all: QueuedAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    return employeeId ? all.filter((a) => a.employeeId === employeeId) : all;
  } catch {
    return [];
  }
}

export function enqueue(action: Omit<QueuedAction, "localId" | "savedAt">): void {
  try {
    const all: QueuedAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    all.push({
      ...action,
      localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(all));
    // Register Background Sync so the SW can wake the app when connectivity returns
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready
        .then((reg) => (reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register("attendance-sync"))
        .catch(() => {});
    }
  } catch {}
}

export function dequeue(localId: string): void {
  try {
    const all: QueuedAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    localStorage.setItem(QUEUE_KEY, JSON.stringify(all.filter((a) => a.localId !== localId)));
  } catch {}
}
