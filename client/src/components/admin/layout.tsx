import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { CreditCard, LogOut, Settings, Users } from "lucide-react";
import React, { ReactNode } from "react";
import { useLocation } from "wouter";
import "./layout.css"; // Import the CSS file
import Link from "next/link";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: Users },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Users", href: "/api/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logoutMutation } = useAuth();

  const [, setLocation] = useLocation();
  
  if (!user || user.role !== "admin") {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="flex">
      <nav className="w-64 bg-gray-800 text-white">
        <ul className="space-y-2 p-4">
          <li>
            <Link href="/admin/dashboard">
              <a className="block p-2">Dashboard</a>
            </Link>
          </li>
          <li>
            <Link href="/admin/users">
              <a className="block p-2">Users</a>
            </Link>
          </li>
          <li>
            <Link href="/admin/transactions">
              <a className="block p-2">Transactions</a>
            </Link>
          </li>
          <li>
            <Link href="/admin/settings">
              <a className="block p-2">Settings</a>
            </Link>
          </li>
        </ul>
      </nav>
      <main className="flex-1 p-4">
        {children}
      </main>
      <Button
        variant="ghost"
        className="justify-start gap-x-3"
        onClick={() => logoutMutation.mutate()}
      >
        <LogOut className="h-5 w-5" />
        Logout
      </Button>
    </div>
  );
};

export default AdminLayout;
