// Semua kredensial diambil dari Environment Variables (Vercel Settings),
// BUKAN ditulis langsung di kode -- ini wajib biar API key kamu gak
// ketahuan orang lain kalau kode ini di-share/upload ke GitHub publik.

export const austinpay = {
  API_KEY: process.env.AUSTINPAY_API_KEY || '',
  API_SECRET: process.env.AUSTINPAY_API_SECRET || '',
  VERSION: process.env.AUSTINPAY_VERSION || 'v1',
  BASE_URL: process.env.AUSTINPAY_BASE_URL || 'https://austinstore.id',
};

export const smm = {
  API_URL: process.env.BUZZERPANEL_API_URL || 'https://buzzerpanel.id/api/json.php',
  API_KEY: process.env.BUZZERPANEL_API_KEY || '',
  SECRET_KEY: process.env.BUZZERPANEL_SECRET_KEY || '',
  MARGIN_PROFIT: Number(process.env.SMM_MARGIN_PROFIT || 3500),
  CACHE_TTL_MS: 10 * 60 * 1000, // 10 menit
};

export const db = {
  URL: process.env.DATABASE_URL || '',
};
