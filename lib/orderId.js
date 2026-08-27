export function generateOrderId(prefix = 'SMM') {
  const waktu = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${waktu}${rand}`;
}
