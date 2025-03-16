import { useQuery } from "@tanstack/react-query";
import { Investment } from "@shared/schema";
import NavSidebar from "@/components/nav-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const INVESTMENT_PLANS = [
  {
    name: "Conservative",
    description: "Low risk, stable returns",
    minAmount: "1000",
    duration: 3,
    expectedReturn: "5-8% annually",
  },
  {
    name: "Balanced",
    description: "Medium risk, balanced returns",
    minAmount: "5000",
    duration: 6,
    expectedReturn: "8-12% annually",
  },
  {
    name: "Aggressive",
    description: "High risk, high potential returns",
    minAmount: "10000",
    duration: 12,
    expectedReturn: "12-20% annually",
  },
];

export default function Investments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: investments } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
  });

  async function invest(plan: typeof INVESTMENT_PLANS[0]) {
    if (!user) return;

    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      await apiRequest("POST", "/api/investments", {
        planName: plan.name,
        amount: plan.minAmount,
        endDate: endDate.toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      toast({
        title: "Investment successful",
        description: `You have invested in the ${plan.name} plan`,
      });
    } catch (error) {
      toast({
        title: "Investment failed",
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
          <div className="grid md:grid-cols-3 gap-6">
            {INVESTMENT_PLANS.map((plan) => (
              <Card key={plan.name}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Minimum:</span> $
                      {parseInt(plan.minAmount).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium">Duration:</span>{" "}
                      {plan.duration} months
                    </p>
                    <p>
                      <span className="font-medium">Expected return:</span>{" "}
                      {plan.expectedReturn}
                    </p>
                    <Button
                      className="w-full mt-4"
                      onClick={() => invest(plan)}
                      disabled={!user || Number(user.balance) < Number(plan.minAmount)}
                    >
                      {Number(user?.balance) < Number(plan.minAmount) 
                        ? "Insufficient Balance" 
                        : "Invest Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Plan</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Start Date</th>
                      <th className="text-left py-3 px-4">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments?.map((investment) => (
                      <tr key={investment.id} className="border-b">
                        <td className="py-3 px-4">{investment.planName}</td>
                        <td className="py-3 px-4">
                          ${Number(investment.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(investment.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(investment.endDate).toLocaleDateString()}
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