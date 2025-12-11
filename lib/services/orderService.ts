// /lib/services/orderService.ts
import { ORDER_CACHE } from "@/lib/orderCache";
import {  TabKey } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";
import type { Order } from "@/types/order";

/* -----------------------------------------
 * ❇ 基本 API 呼叫（封裝 Supabase）
 * ----------------------------------------- */
async function fetchOrdersByStatus(tab: TabKey): Promise<Order[]> {
    let q = supabase.from("orders").select("*");

    if (tab === "全部") {
        q = q.eq("status", "已付定金").limit(10);
    } else {
        q = q.eq("status", tab);
    }

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
        if (cached) return { data: cached, cached: true };

        const data = await fetchOrdersByStatus(tab);
        ORDER_CACHE.setList(tab, data);
        return { data, cached: false };
    },

    /* ---------------------------
  * ⭐【最終最佳版】智慧預取（超快、超安全）
  * --------------------------- */
    async prefetchSmart(currentTab: TabKey) {
        return;
        const popular: TabKey[] = ["已付定金", "已下單", "已寄出"];

        // 過濾掉當前 tab（比如你正在看「全部」）
        const targets = popular.filter(t => t !== currentTab);

        // 每批最多 2 個 → 多的再下一輪
        const batchSize = 2;

        for (let i = 0; i < targets.length; i += batchSize) {
            const batch = targets.slice(i, i + batchSize);

            try {
                // ⭐ 並行抓取（幾乎瞬間完成一批）
                await Promise.all(batch.map(t => this.getList(t)));
            } catch {
                // 靜默錯誤避免阻塞
            }

            // ⭐ 每批之間休息一下避免炸 Supabase（50~80ms 最佳）
            await new Promise(r => setTimeout(r, 80));
        }
    }
    ,

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
     * ⭐ 更新狀態
     * --------------------------- */
    async updateStatus(id: string, newStatus: Order["status"]) {

        // 1️⃣ 先從快取找舊資料
        let old = ORDER_CACHE.getSingle(id);

        // 2️⃣ 真的沒有 → 從 DB 抓
        if (!old) {
            old = await fetchOrderById(id);  // ← 永遠保證不是 null
        }

        // 3️⃣ 更新 DB
        await updateOrder(id, { status: newStatus });

        // 4️⃣ 建立更新後的資料
        const updated = { ...old, status: newStatus } as Order;

        // 5️⃣ 更新單筆快取
        ORDER_CACHE.setSingle(updated);

        // 6️⃣ 更新 Tab 快取分類
        ORDER_CACHE.moveOrderTab(old.status as TabKey, newStatus as TabKey, updated);

        // 7️⃣ 清空所有列表快取（避免過期）
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
