import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Trade } from "@shared/schema";
import NavSidebar from "@/components/nav-sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  UserCheck,
  AlertCircle,
  BadgeCheck,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: trades } = useQuery<Trade[]>({ queryKey: ["/api/trades"] });

  // Calculate trading statistics
  const totalTrades = trades?.length || 0;
  const totalVolume = trades?.reduce((sum, trade) => sum + Number(trade.amount) * Number(trade.price), 0) || 0;
  const lastTradeDate = trades?.length ? new Date(trades[0].timestamp).toLocaleDateString() : 'No trades';

  async function startVerification() {
    try {
      await apiRequest("POST", "/api/verify", {});
      toast({
        title: "Verification started",
        description: "Your account verification is being processed",
      });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex h-screen">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-muted-foreground">
                Manage your account and review your trading activity
              </p>
            </div>
            {user?.isVerified ? (
              <div className="flex items-center gap-2 text-green-600">
                <BadgeCheck className="h-5 w-5" />
                <span>Verified Account</span>
              </div>
            ) : (
              <Button onClick={startVerification}>
                Start Verification
              </Button>
            )}
          </div>

          {/* KYC Notice */}
          {!user?.isVerified && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Required</AlertTitle>
              <AlertDescription>
                Complete KYC verification to unlock all trading features and higher limits
              </AlertDescription>
            </Alert>
          )}

          {/* Account Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${user?.balance?.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Available for trading
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Trading Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Trades</span>
                    <span className="font-medium">{totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Volume</span>
                    <span className="font-medium">${totalVolume.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Account Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Trade</span>
                    <span className="font-medium">{lastTradeDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-medium">2024</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your personal and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Username
                    </label>
                    <p className="mt-1">{user?.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Account Status
                    </label>
                    <p className="mt-1 flex items-center gap-2">
                      {user?.isVerified ? (
                        <>
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span>Unverified</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest trades and account actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Action</th>
                      <th className="text-left py-3 px-4">Details</th>
                      <th className="text-right py-3 px-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades?.slice(0, 5).map((trade) => (
                      <tr key={trade.id} className="border-b">
                        <td className="py-3 px-4">
                          {new Date(trade.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 capitalize">{trade.type}</td>
                        <td className="py-3 px-4">{trade.symbol}</td>
                        <td className="py-3 px-4 text-right">
                          ${(Number(trade.amount) * Number(trade.price)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
