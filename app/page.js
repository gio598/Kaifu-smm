'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [services, setServices] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [target, setTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [marginProfit, setMarginProfit] = useState(0);

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setSelected(null);
    setSearching(true);
    try {
      const res = await fetch(`/api/services?q=${encodeURIComponent(keyword)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setServices(json.services);
      setMarginProfit(json.marginProfit || 0);
      if (json.services.length === 0) setError('Tidak ada layanan ditemukan untuk kata kunci itu.');
    } catch (err) {
      setError(err.message || 'Gagal mencari layanan.');
    } finally {
      setSearching(false);
    }
  }

  const estimatedPrice = useMemo(() => {
    if (!selected || !quantity) return null;
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return null;
    // Rumus PERSIS sama dengan server (lib/buzzerpanel.js hitungHarga) --
    // harga final & valid tetap dihitung ulang di server saat checkout.
    return Math.ceil((qty / 1000) * selected.rate + marginProfit);
  }, [selected, quantity, marginProfit]);

  async function handleCheckout(e) {
    e.preventDefault();
    if (!selected) return setError('Pilih layanan dulu.');
    const qty = parseInt(quantity, 10);
    if (!qty) return setError('Isi jumlah yang valid.');
    if (qty < selected.min || (selected.max && qty > selected.max)) {
      return setError(`Jumlah harus antara ${selected.min} - ${selected.max}.`);
    }
    if (!target.trim()) return setError('Isi link/target dulu.');

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selected.id, quantity: qty, target: target.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      router.push(`/order/${json.orderId}`);
    } catch (err) {
      setError(err.message || 'Gagal membuat order.');
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="mark">A</div>
        <div className="word">Auto Order SMM</div>
      </div>

      <h1>Order tanpa saldo</h1>
      <p className="subtitle">Pilih layanan, bayar QRIS, order langsung diproses otomatis begitu lunas.</p>

      {error && <div className="error-box">{error}</div>}

      <div className="step active">
        <div className="step-num">1</div>
        <div className="step-body">
          <div className="step-label">Cari layanan</div>
          <div className="card">
            <form onSubmit={handleSearch}>
              <label style={{ marginTop: 0 }}>Kata kunci</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="mis. instagram followers, tiktok views"
              />
              <button type="submit" disabled={searching}>{searching ? 'Mencari...' : 'Cari Layanan'}</button>
            </form>
          </div>
        </div>
      </div>

      {services.length > 0 && (
        <div className="step active">
          <div className="step-num">2</div>
          <div className="step-body">
            <div className="step-label">Pilih layanan</div>
            <div className="card">
              {services.map((s) => (
                <div
                  key={s.id}
                  className={`service-item${selected?.id === s.id ? ' selected' : ''}`}
                  onClick={() => setSelected(s)}
                >
                  <span className="service-name">{s.name}</span>
                  <span className="service-price">Rp{s.pricePer1000.toLocaleString('id-ID')}/1K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="step active">
          <div className="step-num">3</div>
          <div className="step-body">
            <div className="step-label">Detail &amp; bayar</div>
            <div className="card">
              <form onSubmit={handleCheckout}>
                <div className="muted">{selected.name}</div>

                <label>Jumlah (min {selected.min}, max {selected.max})</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={`${selected.min} - ${selected.max}`}
                />

                <label>Link / Target</label>
                <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="https://instagram.com/username" />

                {estimatedPrice && (
                  <div className="receipt">
                    <div className="receipt-row">
                      <span>Jumlah</span>
                      <span>{parseInt(quantity, 10).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="receipt-row total">
                      <span>Total</span>
                      <span>Rp {estimatedPrice.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={submitting}>{submitting ? 'Memproses...' : 'Bayar dengan QRIS'}</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
