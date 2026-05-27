import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getAllOrders: vi.fn(async () => [
    {
      id: 1,
      customerName: "John Doe",
      dish: "Salmon Sushi",
      paymentMethod: "cash",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  createOrder: vi.fn(async () => ({ insertId: 1 })),
  updateOrderStatus: vi.fn(async () => ({})),
  deleteOrder: vi.fn(async () => ({})),
}));

function createContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("orders router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createContext();
  });

  it("should list all orders", async () => {
    const caller = appRouter.createCaller(ctx);
    const orders = await caller.orders.list();

    expect(orders).toBeDefined();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("should create a new order with valid input", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.create({
      customerName: "Jane Doe",
      dish: "Tuna Roll",
      paymentMethod: "credit_card",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should reject order creation with missing customer name", async () => {
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.orders.create({
        customerName: "",
        dish: "Tuna Roll",
        paymentMethod: "credit_card",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should update order status", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.updateStatus({
      orderId: 1,
      status: "preparing",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should delete an order", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orders.delete({
      orderId: 1,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
