import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Shield, Users, KeyRound, BarChart3, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Vue d'ensemble", path: "/admin/board", icon: BarChart3, end: true },
  { title: "Membres", path: "/admin/board/members", icon: Users, end: false },
  { title: "Mot de passe", path: "/admin/board/password", icon: KeyRound, end: false },
];

const AdminBoardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8" />
        Tableau de bord Admin
      </h1>

      <div className="flex gap-6">
        {/* Mobile toggle */}
        <Button
          variant="outline"
          size="icon"
          className="md:hidden fixed bottom-4 right-4 z-50 shadow-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed md:sticky top-24 md:top-auto w-64 shrink-0 bg-background z-40 md:z-auto transition-transform md:translate-x-0 md:block self-start",
            sidebarOpen ? "translate-x-0 left-0 p-4 border-r h-[calc(100vh-6rem)]" : "-translate-x-full md:translate-x-0"
          )}
        >
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminBoardLayout;
