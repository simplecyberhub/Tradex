import { useQuery } from "@tanstack/react-query";
import { CopyTrade } from "@shared/schema";
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

export default function CopyTrading() {
  const { toast } = useToast();
  const { data: copyTrades } = useQuery<CopyTrade[]>({
    queryKey: ["/api/copy-trades"],
  });

  async function startCopying(traderId: number) {
    try {
      await apiRequest("POST", "/api/copy-trades", { traderId });
      queryClient.invalidateQueries({ queryKey: ["/api/copy-trades"] });
      toast({
        title: "Success",
        description: "You are now copying this trader",
      });
    } catch (error) {
      toast({
        title: "Failed to copy trader",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex h-screen">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Copy Trading</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Traders</CardTitle>
                <CardDescription>
                  Copy successful traders automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">Trader {id}</h3>
                        <p className="text-sm text-gray-500">
                          Win rate: {85 + id}%
                        </p>
                      </div>
                      <Button onClick={() => startCopying(id)}>
                        Copy Trader
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Copies</CardTitle>
                <CardDescription>
                  Traders you are currently copying
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {copyTrades?.map((ct) => (
                    <div
                      key={ct.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">
                          Trader {ct.traderId}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Started: {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          // Implement stop copying
                        }}
                      >
                        Stop Copying
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
