import { neon } from '@neondatabase/serverless';
import { db as cfg } from './config';

// Pakai driver HTTP dari Neon (bukan koneksi TCP biasa) -- ini yang bikin
// gampang dipakai di Vercel serverless function tanpa pusing soal
// "connection pool habis". Setiap query = 1x HTTP request ke Neon.
const sql = cfg.URL ? neon(cfg.URL) : null;

function requireDb() {
  if (!sql) {
    throw new Error(
      'DATABASE_URL belum diisi. Buat database gratis di https://neon.tech lalu isi DATABASE_URL di .env.local (lokal) atau Vercel > Settings > Environment Variables (production).'
    );
  }
  return sql;
}

let tableReady = false;

// Dipanggil otomatis di awal setiap operasi DB. Idempotent (aman dipanggil
// berkali-kali) dan cuma benar-benar nembak query CREATE TABLE sekali per
// cold start (tableReady di-cache di memori).
async function ensureTable() {
  if (tableReady) return;
  const db = requireDb();
  await db`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      austinpay_order_id TEXT,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      target TEXT NOT NULL,
      price INTEGER NOT NULL,
      total_payment INTEGER,
      qr_image TEXT,
      qr_string TEXT,
      expired_at TIMESTAMPTZ,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      smm_order_id TEXT,
      smm_status TEXT,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

export async function createOrderRow(order) {
  const db = requireDb();
  await ensureTable();
  await db`
    INSERT INTO orders (
      id, austinpay_order_id, service_id, service_name, quantity, target, price,
      total_payment, qr_image, qr_string, expired_at, payment_status
    ) VALUES (
      ${order.id}, ${order.austinpayOrderId}, ${order.serviceId}, ${order.serviceName}, ${order.quantity}, ${order.target}, ${order.price},
      ${order.totalPayment}, ${order.qrImage}, ${order.qrString}, ${order.expiredAt}, 'pending'
    )
  `;
}

export async function getOrderById(id) {
  const db = requireDb();
  await ensureTable();
  const rows = await db`SELECT * FROM orders WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function updatePaymentStatus(id, paymentStatus) {
  const db = requireDb();
  await ensureTable();
  await db`UPDATE orders SET payment_status = ${paymentStatus} WHERE id = ${id}`;
}

export async function markOrderSubmitted(id, smmOrderId, smmStatus) {
  const db = requireDb();
  await ensureTable();
  await db`
    UPDATE orders
    SET payment_status = 'paid', smm_order_id = ${smmOrderId}, smm_status = ${smmStatus}, error_message = NULL
    WHERE id = ${id}
  `;
}

export async function markSubmitFailed(id, errorMessage) {
  const db = requireDb();
  await ensureTable();
  await db`
    UPDATE orders
    SET payment_status = 'paid', smm_status = 'gagal_kirim', error_message = ${errorMessage}
    WHERE id = ${id}
  `;
}

export async function updateSmmStatus(id, smmStatus) {
  const db = requireDb();
  await ensureTable();
  await db`UPDATE orders SET smm_status = ${smmStatus} WHERE id = ${id}`;
}
