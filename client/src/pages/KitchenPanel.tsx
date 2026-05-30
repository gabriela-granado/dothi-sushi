import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Flame } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: number;
  customerName: string;
  paymentMethod: string;
  status: string;
  totalPrice: string;
  createdAt: Date;
  updatedAt?: Date;
}

export default function KitchenPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const { data: kitchenOrders, refetch } = trpc.kitchen.getPendingOrders.useQuery(
    undefined,
    {
      refetchInterval: isAutoRefreshing ? 10000 : false,
      refetchOnWindowFocus: false,
    }
  );

  const markReadyMutation = trpc.orders.markReady.useMutation({
    onSuccess: () => {
      toast.success("Pedido marcado como pronto!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao marcar pedido como pronto");
    },
  });

  useEffect(() => {
    if (kitchenOrders && kitchenOrders.length > 0) {
      const mappedOrders = kitchenOrders.map((o: any) => ({
        ...o,
        total_price: o.totalPrice,
      })) as Order[];
      setOrders(mappedOrders);

      // Play sound and show notification for new orders
      if (kitchenOrders.length > lastOrderCount) {
        playNotificationSound();
        toast.info(`Novo pedido recebido! Total: ${kitchenOrders.length} pedidos`);
      }
      setLastOrderCount(kitchenOrders.length);
    }
  }, [kitchenOrders, lastOrderCount]);

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "preparing":
        return <Flame className="w-5 h-5 text-orange-500" />;
      case "ready":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Recebido";
      case "preparing":
        return "Preparando";
      case "ready":
        return "Pronto";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-900 text-yellow-100";
      case "preparing":
        return "bg-orange-900 text-orange-100";
      case "ready":
        return "bg-green-900 text-green-100";
      default:
        return "bg-gray-700 text-gray-100";
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const handleMarkReady = (orderId: number, nextStatus: "preparing" | "ready") => {
    if (nextStatus === "preparing") {
      trpc.orders.updateStatus.useMutation({
        onSuccess: () => {
          toast.success("Iniciando preparo...");
          refetch();
        },
        onError: () => {
          toast.error("Erro ao iniciar preparo");
        },
      }).mutate({ orderId, status: "preparing" });
    } else {
      markReadyMutation.mutate({ orderId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Painel da Cozinha</h1>
              <p className="text-gray-400">Gerenciamento de pedidos em tempo real</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isAutoRefreshing ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                <span className="text-gray-300 text-sm">
                  {isAutoRefreshing ? "Auto-atualização ativa" : "Auto-atualização desativada"}
                </span>
              </div>
              <Button
                onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
                variant={isAutoRefreshing ? "default" : "outline"}
                size="sm"
              >
                {isAutoRefreshing ? "Pausar" : "Retomar"}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="text-gray-400 text-sm mb-1">Total de Pedidos</div>
              <div className="text-3xl font-bold text-white">{orders.length}</div>
            </Card>
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="text-gray-400 text-sm mb-1">Recebidos</div>
              <div className="text-3xl font-bold text-yellow-500">
                {orders.filter((o) => o.status === "pending").length}
              </div>
            </Card>
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="text-gray-400 text-sm mb-1">Preparando</div>
              <div className="text-3xl font-bold text-orange-500">
                {orders.filter((o) => o.status === "preparing").length}
              </div>
            </Card>
          </div>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-300 mb-2">Nenhum pedido pendente</h2>
            <p className="text-gray-500">Aguardando novos pedidos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card
                key={order.id}
                className={`border-2 p-6 transition-all ${
                  order.status === "pending"
                    ? "bg-yellow-950 border-yellow-600 shadow-lg shadow-yellow-600/20"
                    : order.status === "preparing"
                      ? "bg-orange-950 border-orange-600 shadow-lg shadow-orange-600/20"
                      : "bg-gray-800 border-gray-700"
                }`}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-1">Pedido #{order.id}</div>
                    <h3 className="text-xl font-bold text-white">{order.customerName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>

                {/* Order Time */}
                <div className="mb-4 pb-4 border-b border-gray-700">
                  <div className="text-sm text-gray-400">Recebido às</div>
                  <div className="text-lg font-semibold text-white">{formatTime(order.createdAt)}</div>
                </div>

                {/* Order Details */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Valor Total:</span>
                    <span className="font-bold text-white">R$ {parseFloat(order.totalPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pagamento:</span>
                    <span className="text-white capitalize">
                      {order.paymentMethod === "cash"
                        ? "Dinheiro"
                        : order.paymentMethod === "credit_card"
                          ? "Cartão de Crédito"
                          : order.paymentMethod === "debit_card"
                            ? "Cartão de Débito"
                            : "Pix"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <Button
                      onClick={() => handleMarkReady(order.id, "preparing")}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={markReadyMutation.isPending}
                    >
                      <Flame className="w-4 h-4 mr-2" />
                      Iniciar Preparo
                    </Button>
                  )}
                  {order.status === "preparing" && (
                    <Button
                      onClick={() => handleMarkReady(order.id, "ready")}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={markReadyMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar Pronto
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
