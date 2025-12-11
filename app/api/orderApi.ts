// /lib/api/orderApi.ts
import { supabase } from "@/lib/supabaseClient";
import type { Order, OrderStatus } from "@/types/order";

export async function fetchOrdersByStatus(
  tab: "全部" | OrderStatus
): Promise<Order[]> {
  let query = supabase.from("orders").select("*");

  if (tab === "全部") {
    query = query.eq("status", "已付定金").limit(10);
  } else {
    query = query.eq("status", tab);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateOrder(id: string, payload: Partial<Order>) {
  const { error } = await supabase.from("orders").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createOrder(payload: Partial<Order>) {
  const { error } = await supabase.from("orders").insert(payload);
  if (error) throw new Error(error.message);
}
