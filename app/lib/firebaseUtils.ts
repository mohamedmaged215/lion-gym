import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  writeBatch,
  getCountFromServer,
  getAggregateFromServer,
  sum,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebaseDb";
import { Customer, Payment, Sale, Expense, InventoryItem, InventoryPurchase } from "./types";
import { addDays, localDate, monthBounds } from "./dates";

export type PageCursor = QueryDocumentSnapshot<DocumentData>;

function mapDocs<T>(snapshot: { docs: Array<{ id: string; data(): DocumentData }> }): T[] {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as T));
}

export async function addCustomerWithPayment(
  customer: Omit<Customer, "id">,
  payment: Omit<Payment, "id" | "customerId">
): Promise<string> {
  const customerRef = doc(collection(db, "customers"));
  const paymentRef = doc(collection(db, "payments"));
  const batch = writeBatch(db);
  batch.set(customerRef, customer);
  batch.set(paymentRef, { ...payment, customerId: customerRef.id });
  await batch.commit();
  return customerRef.id;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  await updateDoc(doc(db, "customers", id), data);
}

export async function deleteCustomer(id: string): Promise<void> {
  const snapshot = await getDocs(query(collection(db, "payments"), where("customerId", "==", id)));
  if (snapshot.size >= 500) {
    throw new Error("Too many payments to delete in one atomic operation");
  }
  const batch = writeBatch(db);
  batch.delete(doc(db, "customers", id));
  snapshot.docs.forEach((payment) => batch.delete(payment.ref));
  await batch.commit();
}

export async function getCustomers(): Promise<Customer[]> {
  const snapshot = await getDocs(collection(db, "customers"));
  return mapDocs<Customer>(snapshot);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const snapshot = await getDoc(doc(db, "customers", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Customer) : null;
}

export async function getCustomersForMonth(month: string): Promise<Customer[]> {
  const { start, end } = monthBounds(month);
  const snapshot = await getDocs(query(
    collection(db, "customers"),
    where("startDate", ">=", start),
    where("startDate", "<", end),
    orderBy("startDate", "desc")
  ));
  return mapDocs<Customer>(snapshot);
}

export async function getCustomersForFilter(filter: string): Promise<Customer[]> {
  if (filter === "new") return getCustomersForMonth(localDate().slice(0, 7));
  const today = localDate();
  const ref = collection(db, "customers");
  let constraints: QueryConstraint[];
  if (filter === "active") {
    constraints = [where("endDate", ">", addDays(today, 3))];
  } else if (filter === "expiring") {
    constraints = [where("endDate", ">=", today), where("endDate", "<=", addDays(today, 3))];
  } else if (filter === "expired") {
    constraints = [where("endDate", ">", ""), where("endDate", "<", today)];
  } else {
    return getCustomers();
  }
  const snapshot = await getDocs(query(ref, ...constraints));
  return mapDocs<Customer>(snapshot);
}

export async function getCustomerPage(
  month: string,
  cursor: PageCursor | null,
  pageSize = 25
): Promise<{ customers: Customer[]; cursor: PageCursor | null; hasMore: boolean }> {
  const constraints: QueryConstraint[] = [];
  if (month) {
    const { start, end } = monthBounds(month);
    constraints.push(where("startDate", ">=", start), where("startDate", "<", end));
  }
  constraints.push(orderBy("startDate", "desc"));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize + 1));
  const snapshot = await getDocs(query(collection(db, "customers"), ...constraints));
  const visible = snapshot.docs.slice(0, pageSize);
  return {
    customers: mapDocs<Customer>({ docs: visible }),
    cursor: visible.at(-1) ?? null,
    hasMore: snapshot.size > pageSize,
  };
}

export async function renewCustomer(
  id: string,
  data: Pick<Customer, "startDate" | "endDate" | "durationDays" | "price" | "status">,
  payment: Omit<Payment, "id">
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "customers", id), data);
  batch.set(doc(collection(db, "payments")), payment);
  await batch.commit();
}

export async function addSale(sale: Omit<Sale, "id">): Promise<void> {
  await addDoc(collection(db, "sales"), sale);
}

export async function getSales(): Promise<Sale[]> {
  const snapshot = await getDocs(collection(db, "sales"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Sale));
}

export async function deleteSale(id: string): Promise<void> {
  await deleteDoc(doc(db, "sales", id));
}

export async function addExpense(expense: Omit<Expense, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "expenses"), expense);
  return ref.id;
}

export async function getExpensePage(
  cursor: PageCursor | null,
  pageSize = 25
): Promise<{ expenses: Expense[]; cursor: PageCursor | null; hasMore: boolean }> {
  const constraints: QueryConstraint[] = [orderBy("date", "desc")];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize + 1));
  const snapshot = await getDocs(query(collection(db, "expenses"), ...constraints));
  const visible = snapshot.docs.slice(0, pageSize);
  return {
    expenses: mapDocs<Expense>({ docs: visible }),
    cursor: visible.at(-1) ?? null,
    hasMore: snapshot.size > pageSize,
  };
}

export async function getExpenseTotal(): Promise<number> {
  const snapshot = await getAggregateFromServer(collection(db, "expenses"), { total: sum("price") });
  return Number(snapshot.data().total ?? 0);
}

async function sumForMonth(collectionName: string, fieldName: string, month: string): Promise<number> {
  const { start, end } = monthBounds(month);
  const ref = collection(db, collectionName);
  const stringQuery = query(ref, where("date", ">=", start), where("date", "<", end));
  const timestampQuery = query(
    ref,
    where("date", ">=", Timestamp.fromDate(new Date(`${start}T00:00:00Z`))),
    where("date", "<", Timestamp.fromDate(new Date(`${end}T00:00:00Z`)))
  );
  const [strings, timestamps] = await Promise.all([
    getAggregateFromServer(stringQuery, { total: sum(fieldName) }),
    getAggregateFromServer(timestampQuery, { total: sum(fieldName) }),
  ]);
  return Number(strings.data().total ?? 0) + Number(timestamps.data().total ?? 0);
}

export async function getDashboardStats(month: string): Promise<{
  activeMembers: number;
  expiringSoon: number;
  expiredMembers: number;
  subscriptionRevenue: number;
  totalExpenses: number;
  netProfit: number;
}> {
  const today = localDate();
  const expiringEnd = addDays(today, 3);
  const customers = collection(db, "customers");
  const [subscriptionRevenue, totalExpenses, active, expiring, expired] = await Promise.all([
    sumForMonth("payments", "amount", month),
    sumForMonth("expenses", "price", month),
    getCountFromServer(query(customers, where("endDate", ">", expiringEnd))),
    getCountFromServer(query(customers, where("endDate", ">=", today), where("endDate", "<=", expiringEnd))),
    getCountFromServer(query(customers, where("endDate", ">", ""), where("endDate", "<", today))),
  ]);
  return {
    activeMembers: active.data().count,
    expiringSoon: expiring.data().count,
    expiredMembers: expired.data().count,
    subscriptionRevenue,
    totalExpenses,
    netProfit: subscriptionRevenue - totalExpenses,
  };
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", id));
}

export async function addInventoryItem(item: Omit<InventoryItem, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "inventory"), item);
  return ref.id;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const snapshot = await getDocs(collection(db, "inventory"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem));
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
  await updateDoc(doc(db, "inventory", id), data);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "inventory", id));
}

export async function addInventoryPurchase(purchase: Omit<InventoryPurchase, "id">): Promise<void> {
  await addDoc(collection(db, "inventoryPurchases"), purchase);
}

export async function getInventoryPurchases(): Promise<InventoryPurchase[]> {
  const snapshot = await getDocs(collection(db, "inventoryPurchases"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryPurchase));
}
