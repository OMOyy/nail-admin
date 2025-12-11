// orderCache.ts
import type { Order } from "@/types/order";
import type { TabKey } from "@/lib/constants";
import { STATUSES } from "@/lib/constants";

/* ✔ Tab 列表（只有三個狀態） */
export const ALL_TABS: TabKey[] = [...STATUSES];

/* ----------------------------------------
 * 🔥 FINAL — 永遠不是 null 的快取
 * ---------------------------------------- */
export const ORDER_CACHE = {

  /* ✔ tab → 訂單列表快取 */
  list: {
    已付定金: [] as Order[],
    已下單: [] as Order[],
    已寄出: [] as Order[],
  } as Record<TabKey, Order[]>,

  /* ✔ 單筆訂單快取（id → order） */
  single: {} as Record<string, Order>,

  /* ---------------------- */
  getList(tab: TabKey) {
    return this.list[tab] ?? [];
  },

  setList(tab: TabKey, orders: Order[]) {
    this.list[tab] = orders;
  },

  clearList(tab: TabKey) {
    this.list[tab] = [];
  },

  clearAllLists() {
    ALL_TABS.forEach((t) => (this.list[t] = []));
  },

  /* ---------------------- */
  getSingle(id: string) {
    return this.single[id] ?? null;
  },

  setSingle(order: Order) {
    this.single[order.id] = order;
  },

  removeSingle(id: string) {
    delete this.single[id];
  },

  /* ----------------------
   * 🔥 訂單更換狀態：從舊狀態移除 → 加入新狀態
   * ---------------------- */
  moveOrderTab(oldStatus: TabKey, newStatus: TabKey, order: Order) {
    // 1. 從舊的狀態列表移除
    this.list[oldStatus] = this.list[oldStatus].filter((o) => o.id !== order.id);

    // 2. 加入新的狀態列表最前面
    this.list[newStatus] = [order, ...this.list[newStatus]];

    // 3. 更新單筆快取
    this.single[order.id] = order;
  },

  /* ---------------------- */
  clearAll() {
    this.single = {};
    ALL_TABS.forEach((t) => (this.list[t] = []));
  },
};
