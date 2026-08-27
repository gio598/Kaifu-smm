import axios from 'axios';
import { smm as cfg } from './config';

// ===================================================
// 🚀 BUZZERPANEL API (SMM)
// Diadaptasi dari services/buzzerpanelService.js di bot Telegram kamu --
// endpoint & format request DIPERTAHANKAN PERSIS SAMA.
// ===================================================

async function callApi(action, extraParams = {}) {
  try {
    const response = await axios.post(
      cfg.API_URL,
      {
        api_key: cfg.API_KEY,
        secret_key: cfg.SECRET_KEY,
        action,
        ...extraParams,
      },
      { timeout: 15000 }
    );
    return response.data; // { status: true/false, data: ..., msg: ... }
  } catch (error) {
    const detail = error.code === 'ECONNABORTED' ? 'Timeout, server SMM tidak merespon dalam 15 detik.' : error.message;
    console.error(`[BuzzerPanel] action=${action} gagal:`, detail);
    return { status: false, msg: 'Gagal terhubung ke server SMM.' };
  }
}

// Cache sederhana in-memory (per warm serverless instance). Kalau instance
// baru/cold-start, cache kosong dan diambil ulang -- tidak masalah karena
// request ke BuzzerPanel cepat.
let serviceCache = { data: null, timestamp: 0 };

export async function getAllServices(forceRefresh = false) {
  const now = Date.now();
  const masihValid = serviceCache.data && (now - serviceCache.timestamp < cfg.CACHE_TTL_MS);
  if (!forceRefresh && masihValid) return serviceCache.data;

  const result = await callApi('services');
  if (result.status && Array.isArray(result.data)) {
    serviceCache = { data: result.data, timestamp: now };
    return result.data;
  }
  return serviceCache.data || [];
}

// Cari layanan berdasarkan kategori (bukan nama) -- sama seperti versi bot,
// biar hasil pencarian gak nyasar ke kategori yang gak nyambung.
export async function searchServicesByKeyword(keyword) {
  const services = await getAllServices();
  const kw = keyword.toLowerCase();
  return services.filter((s) => s.category && s.category.toLowerCase().includes(kw));
}

export async function getServiceById(serviceId) {
  const services = await getAllServices();
  return services.find((s) => String(s.service) === String(serviceId)) || null;
}

// Harga jual = harga modal proporsional + margin FLAT (lihat config.smm.MARGIN_PROFIT).
// Formula PERSIS SAMA dengan yang dipakai di bot Telegram (hitungHarga).
export function hitungHarga(modalPer1000, jumlah) {
  const modal = (jumlah / 1000) * modalPer1000;
  return Math.ceil(modal + cfg.MARGIN_PROFIT);
}

export function formatRupiah(angka) {
  return `Rp ${Math.round(Number(angka) || 0).toLocaleString('id-ID')}`;
}

export function mapStatusLabel(rawStatus) {
  if (!rawStatus) return 'Tidak diketahui';
  const s = rawStatus.toString().toLowerCase();
  if (s.includes('complete') || s.includes('success')) return 'Selesai';
  if (s.includes('partial')) return 'Sebagian (Partial)';
  if (s.includes('progress') || s.includes('process')) return 'Sedang Diproses';
  if (s.includes('pending')) return 'Pending';
  if (s.includes('cancel') || s.includes('error') || s.includes('refund')) return 'Dibatalkan/Refund';
  return rawStatus;
}

// Kirim order ke BuzzerPanel. PENTING: action='order' & field='data' (bukan
// 'add'/'link') -- ini format PERSIS yang sudah terbukti jalan di bot
// Telegram kamu (services/buzzerpanelService.js: createOrderRaw). Jangan
// diubah ke konvensi SMM panel "umum" karena BuzzerPanel pakai nama field
// sendiri.
export async function createOrder(serviceId, targetLink, quantity) {
  const result = await callApi('order', { service: serviceId, data: targetLink, quantity });
  if (!result || result.status === false) {
    return { success: false, message: (result && result.msg) || 'Gagal mengirim order ke BuzzerPanel.' };
  }
  const smmOrderId = result.data?.id || result.data?.order || result.data;
  return { success: true, smmOrderId: String(smmOrderId) };
}

export async function checkStatus(smmOrderId) {
  const result = await callApi('status', { id: smmOrderId });
  if (!result || result.status === false) {
    return { success: false, message: (result && result.msg) || 'Gagal mengecek status order SMM.' };
  }
  const d = result.data || {};
  return {
    success: true,
    status: d.status || null,
    startCount: d.start_count ?? null,
    remains: d.remains ?? null,
  };
}
