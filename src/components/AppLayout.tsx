import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function AppLayout() {
  const location = useLocation();
  const isChat = location.pathname === "/chat";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          {/* Mobile top brand bar */}
          {!isChat && (
            <div className="px-5 pt-safe md:hidden shrink-0">
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

          {/* Desktop Header */}
          <div className="hidden md:flex h-14 items-center border-b border-border px-4 shrink-0 bg-background sticky top-0 z-40">
            <SidebarTrigger className="text-foreground" />
            {!isChat && (
              <div className="ml-4 flex items-center justify-between flex-1">
                <p className="font-display text-xs font-black uppercase tracking-[0.3em] text-foreground">
                  Founder's Bible
                </p>
                <p className="font-body text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
                </p>
              </div>
            )}
          </div>

          <main className="flex-1 overflow-y-auto pb-20 md:pb-0 flex flex-col relative">
            <div className="flex-1 mx-auto w-full max-w-5xl relative flex flex-col">
              <Outlet />
            </div>
          </main>
          
          <div className="md:hidden shrink-0">
            <BottomNav />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
