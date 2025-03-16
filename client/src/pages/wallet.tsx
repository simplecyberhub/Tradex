import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import NavSidebar from "@/components/nav-sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Wallet, ArrowUpCircle, ArrowDownCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const transactionSchema = z.object({
  type: z.enum(["deposit", "withdrawal"]),
  amount: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function WalletPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "deposit",
      amount: "",
    },
  });

  async function onSubmit(data: TransactionFormData) {
    if (!user) return;

    try {
      await apiRequest("POST", "/api/transactions", data);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", "/api/user"] });
      form.reset();
      toast({
        title: "Transaction submitted",
        description: `Your ${data.type} request has been submitted.`,
      });
    } catch (error) {
      toast({
        title: "Transaction failed",
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
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-muted-foreground">
              Manage your deposits and withdrawals
            </p>
          </div>

          {/* Verification Notice */}
          {!user?.isVerified && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Required</AlertTitle>
              <AlertDescription>
                Complete account verification to enable deposits and withdrawals
              </AlertDescription>
            </Alert>
          )}

          {/* Balance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Number(user?.balance).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">
                Available for trading
              </p>
            </CardContent>
          </Card>

          {/* Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle>New Transaction</CardTitle>
              <CardDescription>
                Request a deposit or withdrawal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={form.getValues("type") === "deposit" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => form.setValue("type", "deposit")}
                    >
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Deposit
                    </Button>
                    <Button
                      type="button"
                      variant={form.getValues("type") === "withdrawal" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => form.setValue("type", "withdrawal")}
                    >
                      <ArrowDownCircle className="mr-2 h-4 w-4" />
                      Withdraw
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!user?.isVerified}
                  >
                    Submit Request
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions?.map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-3 px-4">
                          {new Date(transaction.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 capitalize">{transaction.type}</td>
                        <td className="py-3 px-4">
                          ${Number(transaction.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 capitalize">{transaction.status}</td>
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
