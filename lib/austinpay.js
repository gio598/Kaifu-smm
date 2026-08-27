import axios from 'axios';
import crypto from 'crypto';
import { austinpay as cfg } from './config';

// ===================================================
// 💳 AUSTINPAY PAYMENT GATEWAY (austinstore.id)
// Diadaptasi dari services/austinpayService.js yang sudah terbukti jalan
// di bot Telegram Kaifuku_bot.order -- endpoint & format request DIPERTAHANKAN
// PERSIS SAMA, cuma dirapikan buat dipakai di Next.js (tanpa polling timer,
// karena di web polling dilakukan dari browser lewat /api/order-status).
// ===================================================

function apiPrefix() {
  return cfg.VERSION === 'v2' ? '/api/v2' : '/api/v1';
}

function signRequest(method, path, bodyString) {
  if (!cfg.API_SECRET) return null; // HMAC opsional, sama seperti versi bot
  const timestamp = Date.now().toString();
  const payload = `${method.toUpperCase()}\n${path}\n${bodyString}\n${timestamp}`;
  const signature = crypto.createHmac('sha256', cfg.API_SECRET).update(payload).digest('hex');
  return { timestamp, signature };
}

async function request(method, path, { body, query } = {}) {
  const bodyString = body ? JSON.stringify(body) : '';
  const headers = { 'X-API-Key': cfg.API_KEY };
  if (body) headers['Content-Type'] = 'application/json';

  const signed = signRequest(method, path, bodyString);
  if (signed) {
    headers['X-Timestamp'] = signed.timestamp;
    headers['X-Signature'] = signed.signature;
  }

  try {
    const response = await axios({
      method,
      url: `${cfg.BASE_URL}${path}`,
      headers,
      params: query,
      data: body || undefined,
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    const detail = (error.response && error.response.data && error.response.data.message) || error.message;
    console.error(`[AustinPay] ${method.toUpperCase()} ${path} gagal:`, detail);
    return { success: false, message: detail || 'Gagal terhubung ke server AustinPay.' };
  }
}

// Petakan status mentah AustinPay ('pending' | 'paid' | 'expired') ke status internal kita.
function mapStatus(rawStatus) {
  if (rawStatus === 'paid') return 'paid';
  if (rawStatus === 'expired') return 'expired';
  return 'pending';
}

// Bikin deposit QRIS baru (POST /api/v1|v2/deposit/create).
// `amount` = harga jual produk (SEBELUM fee) -- AustinPay balikin nominal
// FINAL (total_payment) yang wajib dibayar PAS oleh pembeli.
export async function createPayment(amount) {
  const path = `${apiPrefix()}/deposit/create`;
  const json = await request('post', path, { body: { amount } });

  if (!json || json.success === false || !json.deposit) {
    return { success: false, message: (json && json.message) || 'Gagal membuat pembayaran di AustinPay.' };
  }

  const d = json.deposit;

  // DEBUG: kalau nanti QR gak muncul di web, cek log Vercel ini dulu --
  // kemungkinan besar nama field di response beda dari yang diasumsikan.
  console.log('[AustinPay] createPayment raw deposit:', JSON.stringify(d));

  const qrImageRaw = d.qr_image || d.qris_image || d.image_url || d.qr_url || d.image || null;
  const qrStringRaw = d.qr_string || d.qris_string || d.qr_content || d.string || null;

  return {
    success: true,
    data: {
      orderId: d.transaction_id,
      amount, // harga jual (sebelum fee)
      totalPayment: d.amount, // nominal FINAL yang wajib dibayar pembeli
      qrImageRaw,
      qrString: qrStringRaw,
      expiredAt: d.expired_at || null,
      rawDeposit: d, // disimpan buat debug, gak ditampilkan ke customer
    },
  };
}

// Cek status pembayaran (GET /api/v1|v2/deposit/check/:transactionId)
export async function detailPayment(orderId) {
  const path = `${apiPrefix()}/deposit/check/${encodeURIComponent(orderId)}`;
  const json = await request('get', path);

  if (!json || json.success === false) {
    return { success: false, message: (json && json.message) || 'Gagal mengambil status pembayaran AustinPay.' };
  }

  return {
    success: true,
    status: mapStatus(json.status), // 'pending' | 'paid' | 'expired'
    rawStatus: json.status,
  };
}

// Ubah qr_image mentah (bisa URL, data URL, atau base64 polos) jadi string
// yang LANGSUNG bisa dipasang di <img src="...">. Beda dari versi bot yang
// harus diubah ke Buffer buat Telegram, di web <img> bisa langsung baca
// data URL apa adanya -- jadi jauh lebih simpel.
export function resolveQrImageSrc(raw) {
  if (!raw) return null;
  if (typeof raw === 'string' && /^data:image/i.test(raw)) return raw;
  if (typeof raw === 'string' && /^https?:\/\//i.test(raw)) return raw;
  if (typeof raw === 'string' && raw.length > 100) return `data:image/png;base64,${raw}`;
  return null;
}
