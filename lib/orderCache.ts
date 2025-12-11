import type { Order } from "@/types/order";
import type { TabKey } from "@/lib/constants";
import { STATUSES } from "@/lib/constants";

export const ALL_TABS: TabKey[] = [
  "全部",
  ...STATUSES,
];

/* ----------------------------------------
 * 🔥 FINAL — 永遠不是 null 的快取
 * ---------------------------------------- */
export const ORDER_CACHE = {

  /* ✔ tab 列表快取 */
  list: {
    全部: [] as Order[],
    未付定金: [] as Order[],
    已付定金: [] as Order[],
    已下單: [] as Order[],
    已寄出: [] as Order[],
    已完成未下單: [] as Order[],
  } as Record<TabKey, Order[]>,

  /* ✔ 單筆快取 */
  single: {} as Record<string, Order>,

  /* ---------------------- */
  getList(tab: TabKey) {
    return this.list[tab] ?? null;
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
    return this.single[id] || null;
  },

  setSingle(order: Order) {
    this.single[order.id] = order;
  },

  removeSingle(id: string) {
    delete this.single[id];
  },

  /* ---------------------- */
  moveOrderTab(oldStatus: TabKey, newStatus: TabKey, order: Order) {
    if (oldStatus !== "全部") {
      this.list[oldStatus] = this.list[oldStatus].filter((o) => o.id !== order.id);
    }

    if (newStatus !== "全部") {
      this.list[newStatus] = [order, ...this.list[newStatus]];
    }

    this.single[order.id] = order;

    this.list["全部"] = this.list["全部"].map((o) =>
      o.id === order.id ? order : o
    );
  },

  /* ---------------------- */
  clearAll() {
    this.single = {};
    ALL_TABS.forEach((t) => (this.list[t] = []));
  },
};
