import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type PaymentMethod = "cash" | "credit_card" | "debit_card" | "pix";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  pix: "Pix",
};

const dishes = [
  "California Roll",
  "Salmon Sushi",
  "Tuna Roll",
  "Shrimp Tempura",
  "Dragon Roll",
  "Philadelphia Roll",
  "Spicy Tuna Roll",
  "Vegetable Roll",
  "Mixed Sushi Platter",
  "Sashimi Combo",
];

export default function CustomerOrder() {
  const createOrderMutation = trpc.orders.create.useMutation();
  const [orderCreated, setOrderCreated] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    dish: "",
    paymentMethod: "cash" as PaymentMethod,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.customerAddress.trim() || !formData.dish.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createOrderMutation.mutateAsync(formData);
      toast.success("Order placed successfully!");
      setOrderCreated(true);
      setTimeout(() => {
        setFormData({
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          dish: "",
          paymentMethod: "cash",
        });
        setOrderCreated(false);
      }, 3000);
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">DoThi Sushi</h1>
          <p className="text-slate-300 text-lg">Place Your Order</p>
        </div>

        {/* Success Dialog */}
        <Dialog open={orderCreated} onOpenChange={setOrderCreated}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Order Placed Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Your order has been received. We will prepare your delicious sushi and contact you soon at {formData.customerPhone}.
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                <p className="text-sm"><strong>Name:</strong> {formData.customerName}</p>
                <p className="text-sm"><strong>Dish:</strong> {formData.dish}</p>
                <p className="text-sm"><strong>Payment:</strong> {paymentMethodLabels[formData.paymentMethod]}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Form */}
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Order Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Your Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-200">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-200">Delivery Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your delivery address"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-24"
                  />
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-sm font-semibold text-slate-200">Order Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="dish" className="text-slate-200">Select Dish</Label>
                  <Select value={formData.dish} onValueChange={(value) => setFormData({ ...formData, dish: value })}>
                    <SelectTrigger id="dish" className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Choose a dish" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {dishes.map((dish) => (
                        <SelectItem key={dish} value={dish} className="text-white">
                          {dish}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment" className="text-slate-200">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as PaymentMethod })}>
                    <SelectTrigger id="payment" className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="cash" className="text-white">Cash</SelectItem>
                      <SelectItem value="credit_card" className="text-white">Credit Card</SelectItem>
                      <SelectItem value="debit_card" className="text-white">Debit Card</SelectItem>
                      <SelectItem value="pix" className="text-white">Pix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-lg"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-300">
                <strong className="text-white">Fast Delivery</strong><br />
                We deliver your order within 30-45 minutes
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-300">
                <strong className="text-white">Fresh Ingredients</strong><br />
                All our sushi is made with premium ingredients
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-300">
                <strong className="text-white">Best Price</strong><br />
                Competitive prices for the best quality
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
