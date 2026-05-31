"use client";

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
}

export default function KitchenPanel() {
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const { data: kitchenOrders = [], refetch, isLoading } = trpc.kitchen.getPendingOrders.useQuery(
    undefined,
    {
      refetchInterval: isAutoRefreshing ? 10000 : false,
      refetchOnWindowFocus: false,
    }
  );

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      setTimeout(() => refetch(), 500);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status");
      console.error(error);
    },
  });

  useEffect(() => {
    if (kitchenOrders && kitchenOrders.length > 0) {
      // Play sound and show notification for new orders
      if (kitchenOrders.length > lastOrderCount) {
        playNotificationSound();
        toast.info(`Novo pedido recebido! Total: ${kitchenOrders.length} pedidos`);
      }
      setLastOrderCount(kitchenOrders.length);
    }
  }, [kitchenOrders?.length]);

  const playNotificationSound = () => {
    try {
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
    } catch (error) {
      console.error("Error playing sound:", error);
    }
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

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : new Date(date);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const handleStatusChange = (orderId: number, newStatus: "preparing" | "ready") => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const pendingCount = kitchenOrders?.filter(o => o.status === "pending").length || 0;
  const preparingCount = kitchenOrders?.filter(o => o.status === "preparing").length || 0;

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
                <span className="text-sm text-gray-300">
                  {isAutoRefreshing ? "Atualizando" : "Pausado"}
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

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="text-sm text-gray-400 mb-1">Total de Pedidos</div>
              <div className="text-3xl font-bold text-white">{kitchenOrders?.length || 0}</div>
            </Card>
            <Card className="bg-yellow-900 border-yellow-700 p-4">
              <div className="text-sm text-yellow-200 mb-1">Recebidos</div>
              <div className="text-3xl font-bold text-yellow-100">{pendingCount}</div>
            </Card>
            <Card className="bg-orange-900 border-orange-700 p-4">
              <div className="text-sm text-orange-200 mb-1">Preparando</div>
              <div className="text-3xl font-bold text-orange-100">{preparingCount}</div>
            </Card>
          </div>
        </div>

        {/* Orders Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Todos os Pedidos</h2>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Carregando pedidos...</p>
            </div>
          ) : kitchenOrders && kitchenOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kitchenOrders.map((order: any) => (
                <Card
                  key={order.id}
                  className={`border-2 p-6 ${
                    order.status === "pending"
                      ? "border-yellow-500 bg-gray-800"
                      : order.status === "preparing"
                        ? "border-orange-500 bg-gray-800"
                        : "border-green-500 bg-gray-800"
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-400">Pedido #{order.id}</div>
                      <div className="text-xl font-bold text-white">{order.customerName}</div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Horário:</span>
                      <span className="text-white">{formatTime(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Valor:</span>
                      <span className="text-white font-semibold">
                        R$ {parseFloat(order.totalPrice).toFixed(2)}
                      </span>
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
                        onClick={() => handleStatusChange(order.id, "preparing")}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                        disabled={updateStatusMutation.isPending}
                      >
                        <Flame className="w-4 h-4 mr-2" />
                        Iniciar Preparo
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        onClick={() => handleStatusChange(order.id, "ready")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Marcar Pronto
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700 p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl text-gray-300">Nenhum pedido pendente!</p>
              <p className="text-sm text-gray-400 mt-2">Todos os pedidos foram completados</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
