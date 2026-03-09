import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Initialize push notifications (native mobile)
 */
export async function initializePushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log("Not on native platform, skipping push notifications setup");
    return;
  }

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive === "granted") {
      await PushNotifications.register();
    }

    // Handle registration success
    PushNotifications.addListener("registration", async (token) => {
      console.log("Push registration success, token:", token.value);
      localStorage.setItem("fb-push-token", token.value);
      
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const deviceId = await Capacitor.getDeviceId().then(info => info.identifier);
        const { data: session } = await supabase.auth.getSession();
        
        await supabase.from("push_tokens").upsert({
          device_id: deviceId,
          token: token.value,
          platform: Capacitor.getPlatform(),
          user_id: session?.session?.user?.id || null,
        }, { onConflict: "device_id" });
      } catch (err) {
        console.error("Failed to save push token to DB:", err);
      }
    });

    // Handle registration errors
    PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error);
    });

    // Handle push notification received (app in foreground)
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push notification received:", notification);
    });

    // Handle push notification tapped
    PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
      console.log("Push notification action performed:", notification);
    });
  } catch (error) {
    console.error("Error initializing push notifications:", error);
  }
}

/**
 * Request browser notification permission (web fallback)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // On native, use Capacitor LocalNotifications
  if (Capacitor.isNativePlatform()) {
    try {
      const permResult = await LocalNotifications.requestPermissions();
      return permResult.display === "granted";
    } catch (error) {
      console.warn("Failed to request local notification permission:", error);
      return false;
    }
  }

  // Web fallback
  if (!("Notification" in window)) {
    return false;
  }
  try {
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch (error) {
    console.warn("Failed to request notification permission:", error);
    return false;
  }
}

/**
 * Show a notification (native or browser)
 */
export async function showNotification(title: string, body: string) {
  // Native platform
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }, // Show after 1 second
            sound: undefined,
            attachments: undefined,
            actionTypeId: "",
            extra: null,
          },
        ],
      });
    } catch (error) {
      console.error("Failed to show local notification:", error);
    }
    return;
  }

  // Web fallback
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
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

/**
 * Schedule daily local notifications (native only, more reliable than interval)
 */
export async function scheduleDailyNotification(time: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Cancel existing scheduled notifications
    await LocalNotifications.cancel({ notifications: [{ id: 999 }] });

    // Parse time (format: "HH:MM")
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledDate < now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Founder's Bible",
          body: "Your daily scripture is ready. Take a moment to read and reflect.",
          id: 999,
          schedule: {
            at: scheduledDate,
            every: "day",
          },
          sound: undefined,
          attachments: undefined,
          actionTypeId: "",
          extra: null,
        },
      ],
    });

    console.log("Daily notification scheduled for", time);
  } catch (error) {
    console.error("Failed to schedule daily notification:", error);
  }
}

export async function cancelDailyNotification() {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 999 }] });
    console.log("Daily notification cancelled");
  } catch (error) {
    console.error("Failed to cancel daily notification:", error);
  }
}
