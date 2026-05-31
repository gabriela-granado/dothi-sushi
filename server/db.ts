import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertOrder, Order, orders, users, menuItems, orderItems } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get orders: database not available");
    return [];
  }

  try {
    const result = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get orders:", error);
    throw error;
  }
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create order: database not available");
    return null;
  }

  try {
    const result = await db.insert(orders).values(order);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create order:", error);
    throw error;
  }
}

export async function updateOrderStatus(orderId: number, status: Order['status']) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update order: database not available");
    return null;
  }

  try {
    const result = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update order status:", error);
    throw error;
  }
}

export async function deleteOrder(orderId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete order: database not available");
    return null;
  }

  try {
    const result = await db.delete(orders).where(eq(orders.id, orderId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to delete order:", error);
    throw error;
  }
}

// Kitchen panel - get pending and preparing orders with items
export async function getKitchenOrders() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get kitchen orders: database not available");
    return [];
  }

  try {
    const { inArray, asc, eq } = await import('drizzle-orm');
    
    // Get pending and preparing orders
    const pendingOrders = await db.select().from(orders)
      .where(inArray(orders.status, ['pending', 'preparing']))
      .orderBy(asc(orders.createdAt));
    
    // For each order, get its items with menu item names
    const ordersWithItems = await Promise.all(
      pendingOrders.map(async (order) => {
        const items = await db.select({
          id: orderItems.id,
          menuItemId: orderItems.menuItemId,
          menuItemName: menuItems.name,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, order.id));
        
        return {
          ...order,
          items: items || [],
        };
      })
    );
    
    return ordersWithItems;
  } catch (error) {
    console.error("[Database] Failed to get kitchen orders:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.

export async function getMenuItems() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get menu items: database not available");
    return [];
  }

  try {
    const result = await db.select().from(menuItems);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get menu items:", error);
    throw error;
  }
}

export async function createOrderWithItems(order: InsertOrder, items: Array<{ menuItemId: number; quantity: number; price: string }>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create order: database not available");
    return null;
  }

  try {
    const result = await db.insert(orders).values(order);
    const orderId = (result as any)[0]?.insertId || (result as any).insertId;

    if (!orderId) {
      throw new Error("Failed to get order ID after insertion");
    }

    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: orderId as number,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      });
    }

    return { orderId, ...result };
  } catch (error) {
    console.error("[Database] Failed to create order with items:", error);
    throw error;
  }
}

export async function getOrderWithItems(orderId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get order: database not available");
    return null;
  }

  try {
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (order.length === 0) return null;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return { ...order[0], items };
  } catch (error) {
    console.error("[Database] Failed to get order:", error);
    throw error;
  }
}
