import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Plus, Trash2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type OrderStatus = "pending" | "preparing" | "ready" | "delivered";
type PaymentMethod = "cash" | "credit_card" | "debit_card" | "pix";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-900 text-yellow-100",
  preparing: "bg-blue-900 text-blue-100",
  ready: "bg-green-900 text-green-100",
  delivered: "bg-gray-700 text-gray-100",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendente",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  pix: "Pix",
};

interface CartItem {
  menuItemId: number;
  name: string;
  quantity: number;
  price: number;
}

export default function Orders() {
  const { data: orders = [], isLoading, error, refetch } = trpc.orders.list.useQuery();
  const { data: menuItems = [] } = trpc.menu.list.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();
  const deleteOrderMutation = trpc.orders.delete.useMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");

  const addToCart = () => {
    if (!selectedMenuItem) {
      toast.error("Selecione um prato");
      return;
    }

    const menuItem = menuItems.find(m => m.id === parseInt(selectedMenuItem));
    if (!menuItem) return;

    const quantity = parseInt(selectedQuantity);
    const existingItem = cartItems.find(item => item.menuItemId === menuItem.id);

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity,
        price: parseFloat(menuItem.price),
      }]);
    }

    setSelectedMenuItem("");
    setSelectedQuantity("1");
    toast.success("Item adicionado ao carrinho");
  };

  const removeFromCart = (menuItemId: number) => {
    setCartItems(cartItems.filter(item => item.menuItemId !== menuItemId));
  };

  const updateCartItemQuantity = (menuItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(menuItemId);
    } else {
      setCartItems(cartItems.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCreateOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Por favor, preencha o nome do cliente");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }

    try {
      const totalPrice = calculateTotal();
      await createOrderMutation.mutateAsync({
        customerName,
        paymentMethod,
        totalPrice,
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price.toString(),
        })),
      });
      toast.success("Pedido criado com sucesso");
      setCustomerName("");
      setPaymentMethod("cash");
      setCartItems([]);
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Falha ao criar pedido");
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, status: newStatus });
      toast.success("Status do pedido atualizado");
      refetch();
    } catch (error) {
      toast.error("Falha ao atualizar status do pedido");
    }
  };

  const handleDeleteOrder = async () => {
    if (selectedOrderId === null) return;

    try {
      await deleteOrderMutation.mutateAsync({ orderId: selectedOrderId });
      toast.success("Pedido deletado com sucesso");
      setDeleteConfirmOpen(false);
      setSelectedOrderId(null);
      refetch();
    } catch (error) {
      toast.error("Falha ao deletar pedido");
    }
  };

  const confirmDelete = (orderId: number) => {
    setSelectedOrderId(orderId);
    setDeleteConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gerenciar e rastrear pedidos de clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Pedido</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nome do Cliente</Label>
                <Input
                  id="customer-name"
                  placeholder="Digite o nome do cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Adicionar Itens</h3>
                <div className="space-y-2">
                  <Label htmlFor="menu-select">Selecione um Prato</Label>
                  <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                    <SelectTrigger id="menu-select">
                      <SelectValue placeholder="Escolha um prato" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} - R$ {parseFloat(item.price).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                  />
                </div>

                <Button onClick={addToCart} className="w-full" variant="outline">
                  Adicionar ao Carrinho
                </Button>
              </div>

              {cartItems.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Carrinho</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.menuItemId} className="flex items-center justify-between bg-accent/50 p-3 rounded">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {item.price.toFixed(2)} x {item.quantity} = R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItemQuantity(item.menuItemId, parseInt(e.target.value))}
                            className="w-16"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.menuItemId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total:</span>
                      <span className="text-lg">R$ {calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="payment">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <SelectTrigger id="payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateOrder} className="w-full" disabled={createOrderMutation.isPending || cartItems.length === 0}>
                {createOrderMutation.isPending ? "Criando..." : "Criar Pedido"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground">Falha ao carregar pedidos. Por favor, tente novamente.</p>
              <Button onClick={() => refetch()} className="mt-4" variant="outline">
                Tentar Novamente
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum pedido ainda. Crie seu primeiro pedido para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{paymentMethodLabels[order.paymentMethod]}</TableCell>
                      <TableCell>R$ {parseFloat(order.totalPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[order.status as OrderStatus]}>
                            {statusLabels[order.status as OrderStatus]}
                          </Badge>
                          <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="preparing">Preparando</SelectItem>
                              <SelectItem value="ready">Pronto</SelectItem>
                              <SelectItem value="delivered">Entregue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")} {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(order.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
