import AdminLayout from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Transaction } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function AdminTransactions() {
  const { toast } = useToast();
  const { data: pendingTransactions, isLoading: loadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions/pending"],
    queryFn: () => apiRequest("GET", "/api/admin/transactions/pending"),
    staleTime: 5000,
  });

  async function approveTransaction(transactionId: number) {
    try {
      await apiRequest("POST", `/api/admin/transactions/${transactionId}/approve`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Transaction approved",
        description: "The transaction has been successfully approved.",
      });
    } catch (error) {
      toast({
        title: "Error approving transaction",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground">
            Approve and manage transactions
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Pending Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingTransactions ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : transactionsError ? (
                <p className="text-sm text-muted-foreground">Error loading transactions</p>
              ) : pendingTransactions?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending transactions</p>
              ) : (
                pendingTransactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between border-b py-4"
                  >
                    <div>
                      <p className="font-medium">
                        {transaction.type.toUpperCase()} - $
                        {Number(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        User ID: {transaction.userId}
                      </p>
                    </div>
                    <Button
                      onClick={() => approveTransaction(transaction.id)}
                    >
                      Approve
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

