'use client';

import { useEffect, useState, useCallback } from 'react';

export default function OrderStatusPage({ params }) {
  const { orderId } = params;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/status/${orderId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setData(json);
      setError('');
    } catch (err) {
      setError(err.message || 'Gagal mengambil status.');
    }
  }, [orderId]);

  useEffect(() => {
    fetchStatus();
    // AustinPay minimal cek tiap 5 detik (lihat catatan di lib/austinpay.js).
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (error) {
    return (
      <div className="container">
        <div className="error-box">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <p className="muted">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Order {data.orderId}</h1>
      <p className="subtitle">{data.serviceName} — {data.quantity} pcs</p>

      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <span className={`status-badge status-${data.paymentStatus}`}>
            {data.paymentStatus === 'pending' && 'Menunggu Pembayaran'}
            {data.paymentStatus === 'paid' && 'Sudah Dibayar'}
            {data.paymentStatus === 'expired' && 'Kadaluwarsa'}
          </span>
        </div>

        {data.paymentStatus === 'pending' && data.qrImage && (
          <div className="qr-wrap">
            <img src={data.qrImage} alt="QRIS" />
            <p className="muted" style={{ marginTop: 12 }}>
              Scan pakai aplikasi e-wallet / m-banking apapun yang support QRIS.
              Halaman ini otomatis update tiap 5 detik.
            </p>
          </div>
        )}

        {data.paymentStatus === 'expired' && (
          <p className="muted">QRIS sudah kadaluwarsa. Silakan buat order baru dari halaman utama.</p>
        )}

        <div className="price-box">
          <span>Total Bayar</span>
          <span>Rp {Number(data.totalPayment).toLocaleString('id-ID')}</span>
        </div>
      </div>

      {data.paymentStatus === 'paid' && (
        <div className="card">
          <label style={{ marginTop: 0 }}>Status Order SMM</label>
          {data.smmStatus === 'gagal_kirim' ? (
            <>
              <p style={{ color: '#ff8fa3' }}>
                Pembayaran berhasil, tapi order gagal otomatis terkirim ke provider ({data.errorMessage || 'error tidak diketahui'}).
              </p>
              <p className="muted">Simpan Order ID ini dan hubungi admin untuk diproses manual.</p>
            </>
          ) : (
            <>
              <p>{data.smmStatusLabel || 'Sedang diproses...'}</p>
              {data.smmOrderId && <p className="muted">ID Order Provider: {data.smmOrderId}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
