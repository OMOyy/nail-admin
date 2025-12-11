// /lib/services/orderService.ts
import { ORDER_CACHE } from "@/lib/orderCache";
import type { TabKey } from "@/lib/constants";
import { STATUSES } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";
import type { Order } from "@/types/order";

/* -----------------------------------------
 * ❇ 基本 API 呼叫（封裝 Supabase）
 * ----------------------------------------- */
async function fetchOrdersByStatus(tab: TabKey): Promise<Order[]> {
  // tab 一定是：已付定金 / 已下單 / 已寄出
  let q = supabase.from("orders").select("*");

  // 依狀態過濾
  q = q.eq("status", tab);

  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return data || [];
}

async function fetchOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("找不到訂單");
  return data;
}

async function createOrder(payload: Partial<Order>) {
  return supabase.from("orders").insert(payload);
}

async function updateOrder(id: string, payload: Partial<Order>) {
  return supabase.from("orders").update(payload).eq("id", id);
}

async function deleteOrder(id: string) {
  return supabase.from("orders").delete().eq("id", id);
}

/* -----------------------------------------
 * ❇ orderService（全站共用）
 * ----------------------------------------- */
export const orderService = {

  /* ---------------------------
   * ⭐ 列表（含快取）
   * --------------------------- */
  async getList(tab: TabKey) {
    const cached = ORDER_CACHE.getList(tab);
    if (cached.length > 0) return { data: cached, cached: true };

    const data = await fetchOrdersByStatus(tab);
    ORDER_CACHE.setList(tab, data);
    return { data, cached: false };
  },

  /* ---------------------------
   * ⭐ 智慧預取（改成三個狀態）
   * --------------------------- */
  async prefetchSmart(currentTab: TabKey) {
    const all: TabKey[] = [...STATUSES];
    const targets = all.filter((t) => t !== currentTab);

    const batchSize = 2;

    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);

      try {
        await Promise.all(batch.map((t) => this.getList(t)));
      } catch {
        // 不阻塞流程
      }

      await new Promise((r) => setTimeout(r, 80));
    }
  },

  /* ---------------------------
   * ⭐ 單筆（含快取）
   * --------------------------- */
  async getSingle(id: string) {
    const cached = ORDER_CACHE.getSingle(id);
    if (cached) return { data: cached, cached: true };

    const data = await fetchOrderById(id);
    ORDER_CACHE.setSingle(data);
    return { data, cached: false };
  },

  /* ---------------------------
   * ⭐ 新增
   * --------------------------- */
  async create(payload: Partial<Order>) {
    const res = await createOrder(payload);
    if (res.error) throw new Error(res.error.message);

    ORDER_CACHE.clearAllLists();
  },

  /* ---------------------------
   * ⭐ 修改
   * --------------------------- */
  async update(id: string, payload: Partial<Order>) {
    await updateOrder(id, payload);

    ORDER_CACHE.setSingle({
      ...(ORDER_CACHE.getSingle(id) || {}),
      ...payload,
      id,
    } as Order);

    ORDER_CACHE.clearAllLists();
  },

  /* ---------------------------
   * ⭐ 更新狀態（關鍵！）
   * --------------------------- */
  async updateStatus(id: string, newStatus: Order["status"]) {

    // 1️⃣ 從快取拿舊資料
    let old = ORDER_CACHE.getSingle(id);

    // 2️⃣ 若無 → 從 DB 抓
    if (!old) {
      old = await fetchOrderById(id);
    }
    
    // 3️⃣ 更新 DB
    await updateOrder(id, { status: newStatus });

    // 4️⃣ 更新後
    const updated = { ...old, status: newStatus } as Order;

    // 5️⃣ 單筆快取更新
    ORDER_CACHE.setSingle(updated);

    // 6️⃣ Tab 快取移動
    ORDER_CACHE.moveOrderTab(old.status as TabKey, newStatus as TabKey, updated);

    // 7️⃣ 清除所有列表快取（強一致性）
    ORDER_CACHE.clearAllLists();
  },

  /* ---------------------------
   * ⭐ 刪除
   * --------------------------- */
  async remove(id: string) {
    await deleteOrder(id);

    ORDER_CACHE.removeSingle(id);
    ORDER_CACHE.clearAllLists();
  },
};
