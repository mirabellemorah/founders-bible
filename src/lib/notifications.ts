/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
}

/**
 * Schedule daily notification check. Stores a timer that checks every minute
 * if the current time matches the scheduled time and fires a notification.
 */
let notifInterval: ReturnType<typeof setInterval> | null = null;
let lastFiredDate = "";

export function startNotificationScheduler() {
  stopNotificationScheduler();
  
  notifInterval = setInterval(() => {
    const enabled = localStorage.getItem("fb-notifications") === "true";
    if (!enabled) return;
    
    const scheduledTime = localStorage.getItem("fb-notif-time") || "08:00";
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const today = now.toISOString().split("T")[0];
    
    if (currentTime === scheduledTime && lastFiredDate !== today) {
      lastFiredDate = today;
      showNotification(
        "Founder's Bible",
        "Your daily scripture is ready. Take a moment to read and reflect."
      );
    }
  }, 30000); // Check every 30 seconds
}

export function stopNotificationScheduler() {
  if (notifInterval) {
    clearInterval(notifInterval);
    notifInterval = null;
  }
}
