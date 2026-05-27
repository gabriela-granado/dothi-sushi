import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Clock, CheckCircle, Truck } from "lucide-react";

export default function Home() {
  const { data: orders = [], isLoading } = trpc.orders.list.useQuery();

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <Icon className={`h-12 w-12 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to DoThi Sushi Order Management</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Package} label="Total Orders" value={stats.total} color="text-primary" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="text-yellow-600" />
          <StatCard icon={Loader2} label="Preparing" value={stats.preparing} color="text-blue-600" />
          <StatCard icon={CheckCircle} label="Ready" value={stats.ready} color="text-green-600" />
          <StatCard icon={Truck} label="Delivered" value={stats.delivered} color="text-gray-600" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Orders Today</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-semibold">{stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-semibold">{stats.pending + stats.preparing}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
