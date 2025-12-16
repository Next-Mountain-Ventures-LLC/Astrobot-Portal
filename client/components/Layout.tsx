import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, Settings, HelpCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/account", label: "Account Settings", icon: Settings },
    { path: "/support", label: "Support", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="container flex h-16 max-w-7xl items-center justify-between px-4 mx-auto">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">AB</span>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">Astrobot</div>
              <div className="text-xs text-muted-foreground">Portal</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <Button
              onClick={() => handleLogout()}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {sidebarOpen && (
          <nav className="md:hidden border-t border-border bg-card">
            <div className="container max-w-7xl px-4 py-4 space-y-2 mx-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card text-center py-6 mt-12">
        <p className="text-sm text-muted-foreground">
          © 2024 Astrobot.design. All rights reserved. | Built for AI-powered web development.
        </p>
      </footer>
    </div>
  );
};

const handleLogout = () => {
  localStorage.removeItem("user");
  window.location.href = "/login";
};
