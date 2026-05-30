import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createOrderWithItems, deleteOrder, getAllOrders, updateOrderStatus, getMenuItems, getKitchenOrders } from "./db";
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

  menu: router({
    list: publicProcedure.query(async () => {
      return await getMenuItems();
    }),
  }),

  kitchen: router({
    getPendingOrders: publicProcedure.query(async () => {
      return await getKitchenOrders();
    }),
  }),

  orders: router({
    list: publicProcedure.query(async () => {
      return await getAllOrders();
    }),
    create: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1, "Nome do cliente é obrigatório"),
          paymentMethod: z.enum(["cash", "credit_card", "debit_card", "pix"]),
          totalPrice: z.string(),
          items: z.array(z.object({
            menuItemId: z.number(),
            quantity: z.number().min(1),
            price: z.string(),
          })).min(1, "Pelo menos um item é obrigatório"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await createOrderWithItems({
            customerName: input.customerName,
            paymentMethod: input.paymentMethod,
            totalPrice: input.totalPrice,
            status: "pending",
          }, input.items);
          return { success: true, orderId: result?.orderId };
        } catch (error) {
          console.error("Failed to create order:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao criar pedido",
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
            message: "Falha ao atualizar status do pedido",
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
            message: "Falha ao deletar pedido",
          });
        }
      }),
    markReady: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await updateOrderStatus(input.orderId, "ready");
          return { success: true };
        } catch (error) {
          console.error("Failed to mark order as ready:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao marcar pedido como pronto",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
