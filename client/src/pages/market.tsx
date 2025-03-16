import NavSidebar from "@/components/nav-sidebar";
import MarketChart from "@/components/market-chart";
import TradeForm from "@/components/trade-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Market() {
  return (
    <div className="flex h-screen">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <MarketChart />
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>New Trade</CardTitle>
              </CardHeader>
              <CardContent>
                <TradeForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
