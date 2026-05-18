const DEVICE_KEY = "hr_device_id";
const DEVICE_NAME_KEY = "hr_device_name";

/** Returns a stable UUID for this browser/app instance. Generated once, stored in localStorage. */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : fallbackUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/** Human-readable device label (browser + OS). */
export function getDeviceName(): string {
  let name = localStorage.getItem(DEVICE_NAME_KEY);
  if (!name) {
    const ua = navigator.userAgent;
    let os = "Unknown";
    if (/iPhone|iPad/.test(ua)) os = "iOS";
    else if (/Android/.test(ua)) os = "Android";
    else if (/Windows/.test(ua)) os = "Windows";
    else if (/Mac/.test(ua)) os = "macOS";
    else if (/Linux/.test(ua)) os = "Linux";

    let browser = "Browser";
    if (/Chrome\//.test(ua) && !/Edge\/|Edg\//.test(ua)) browser = "Chrome";
    else if (/Firefox\//.test(ua)) browser = "Firefox";
    else if (/Edg\//.test(ua)) browser = "Edge";
    else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

    name = `${browser} / ${os}`;
    localStorage.setItem(DEVICE_NAME_KEY, name);
  }
  return name;
}

function fallbackUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
