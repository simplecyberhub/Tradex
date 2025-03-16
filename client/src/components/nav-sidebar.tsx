import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  LineChart,
  Users,
  PiggyBank,
  User,
  LogOut,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Market", href: "/market", icon: LineChart },
  { name: "Copy Trading", href: "/copy-trading", icon: Users },
  { name: "Investments", href: "/investments", icon: PiggyBank },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Profile", href: "/profile", icon: User },
];

export default function NavSidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar border-r">
      <div className="flex-1 flex flex-col gap-y-4 px-4 py-6">
        <div className="font-semibold text-2xl px-2 mb-4">TradeX</div>
        <nav className="flex flex-1 flex-col gap-y-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex gap-x-3 rounded-md p-2 text-sm leading-6",
                  location === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <Button
          variant="ghost"
          className="justify-start gap-x-3"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}