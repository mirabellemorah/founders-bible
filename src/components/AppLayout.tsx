import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  const location = useLocation();
  const isChat = location.pathname === "/chat";

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {/* Top brand bar */}
      {!isChat && (
        <div className="px-5 pt-safe">
          <div className="flex items-center justify-between pt-3 pb-1">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">
              Founder's Bible
            </p>
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
        </div>
      )}
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
