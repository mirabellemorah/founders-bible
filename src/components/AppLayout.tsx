import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  const location = useLocation();
  const isChat = location.pathname === "/chat";

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {/* Top brand bar — editorial style */}
      {!isChat && (
        <div className="px-5 pt-safe">
          <div className="flex items-center justify-between pt-3 pb-2 border-b-2 border-foreground">
            <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-foreground">
              Founder's Bible
            </p>
            <p className="font-body text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
            </p>
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
