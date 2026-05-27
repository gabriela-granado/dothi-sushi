import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createOrder, deleteOrder, getAllOrders, updateOrderStatus } from "./db";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  orders: router({
    list: publicProcedure.query(async () => {
      return await getAllOrders();
    }),
    create: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1, "Customer name is required"),
          dish: z.string().min(1, "Dish is required"),
          paymentMethod: z.enum(["cash", "credit_card", "debit_card", "pix"]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await createOrder({
            customerName: input.customerName,
            dish: input.dish,
            paymentMethod: input.paymentMethod,
            status: "pending",
          });
          return { success: true };
        } catch (error) {
          console.error("Failed to create order:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create order",
          });
        }
      }),
    updateStatus: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending", "preparing", "ready", "delivered"]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await updateOrderStatus(input.orderId, input.status);
          return { success: true };
        } catch (error) {
          console.error("Failed to update order status:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update order status",
          });
        }
      }),
    delete: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteOrder(input.orderId);
          return { success: true };
        } catch (error) {
          console.error("Failed to delete order:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete order",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
