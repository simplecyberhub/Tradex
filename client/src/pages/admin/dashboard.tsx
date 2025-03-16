import AdminLayout from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Transaction, User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, DollarSign, Users } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { data: users = [], isLoading: loadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users"),
    staleTime: 5000,
  });

  const { data: pendingTransactions = [], isLoading: loadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions/pending"],
    queryFn: () => apiRequest("GET", "/api/admin/transactions/pending"),
    staleTime: 5000,
  });

  const totalBalance = users?.reduce((sum: number, user: any) => sum + Number(user.balance), 0) || 0;
  const totalUsers = users?.length || 0;
  const pendingAmount = pendingTransactions?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;

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

  async function verifyUser(userId: number) {
    try {
      await apiRequest("POST", `/api/admin/users/${userId}/verify`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User verified",
        description: "The user has been successfully verified.",
      });
    } catch (error) {
      toast({
        title: "Error verifying user",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  async function updateSettings(settings: any) {
    try {
      await apiRequest("POST", `/api/admin/settings`, settings);
      toast({
        title: "Settings updated",
        description: "The settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error updating settings",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and management
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingUsers ? "Loading..." : totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Platform registered users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingUsers ? "Loading..." : `$${totalBalance.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined user balances
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              {pendingAmount > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingTransactions ? "Loading..." : `$${pendingAmount.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending transaction total
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pending Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Transactions</CardTitle>
              <CardDescription>
                Transactions waiting for approval
              </CardDescription>
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

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Verify and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : usersError ? (
                  <p className="text-sm text-muted-foreground">Error loading users</p>
                ) : users?.filter(user => !user.isVerified).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending verifications</p>
                ) : (
                  users?.filter(user => !user.isVerified).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between border-b py-4"
                    >
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Balance: ${Number(user.balance).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => verifyUser(user.id)}
                        disabled={user.isVerified}
                      >
                        {user.isVerified ? "Verified" : "Verify User"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <CardDescription>
                Update platform settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add form or settings management UI here */}
                <Button onClick={() => updateSettings({ key: "value" })}>
                  Update Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
