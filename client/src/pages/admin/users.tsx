import AdminLayout from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function AdminUsers() {
  const { toast } = useToast();
  const { data: users, isLoading: loadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users"),
    staleTime: 5000,
  });

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

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Verify and manage user accounts
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
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
      </div>
    </AdminLayout>
  );
}
