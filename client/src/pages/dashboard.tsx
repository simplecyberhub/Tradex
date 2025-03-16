import { useQuery } from "@tanstack/react-query";
import { Trade } from "@shared/schema";
import NavSidebar from "@/components/nav-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MarketChart from "@/components/market-chart";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: trades } = useQuery<Trade[]>({ queryKey: ["/api/trades"] });

  return (
    <div className="flex h-screen">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance</CardTitle>
                <CardDescription>Your current balance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ${user?.balance?.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Trades</CardTitle>
                <CardDescription>Number of executed trades</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{trades?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
                <CardDescription>Account status</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {user?.isVerified ? "Verified" : "Unverified"}
                </p>
              </CardContent>
            </Card>
          </div>

          <MarketChart />

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Symbol</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades?.slice(0, 5).map((trade) => (
                      <tr key={trade.id} className="border-b">
                        <td className="py-3 px-4">
                          {new Date(trade.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">{trade.symbol}</td>
                        <td className="py-3 px-4 capitalize">{trade.type}</td>
                        <td className="py-3 px-4">{trade.amount}</td>
                        <td className="py-3 px-4">${trade.price}</td>
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
