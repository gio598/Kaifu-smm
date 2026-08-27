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
      <div className="page">
        <div className="topbar"><div className="mark">A</div><div className="word">Auto Order SMM</div></div>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="topbar"><div className="mark">A</div><div className="word">Auto Order SMM</div></div>
        <p className="muted">Memuat...</p>
      </div>
    );
  }

  const statusLabel = {
    pending: 'Menunggu Pembayaran',
    paid: 'Sudah Dibayar',
    expired: 'Kadaluwarsa',
  }[data.paymentStatus];

  return (
    <div className="page">
      <div className="topbar"><div className="mark">A</div><div className="word">Auto Order SMM</div></div>

      <h1>{data.serviceName}</h1>
      <p className="subtitle">
        <span className="order-id">{data.orderId}</span> &middot; {data.quantity.toLocaleString('id-ID')} pcs
      </p>

      <div style={{ marginBottom: 16 }}>
        <span className={`status-badge status-${data.paymentStatus}`}>{statusLabel}</span>
      </div>

      {data.paymentStatus === 'pending' && data.qrImage && (
        <div className="qr-card">
          <img src={data.qrImage} alt="QRIS" />
          <p className="muted" style={{ marginTop: 14 }}>
            Scan pakai e-wallet atau m-banking apa saja yang support QRIS.<br />Halaman ini otomatis update.
          </p>
        </div>
      )}

      {data.paymentStatus === 'expired' && (
        <div className="card">
          <p className="muted">QRIS sudah kadaluwarsa. Silakan buat order baru dari halaman utama.</p>
        </div>
      )}

      <div className="card">
        <div className="receipt" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <div className="receipt-row">
            <span>Target</span>
            <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.target}</span>
          </div>
          <div className="receipt-row total">
            <span>Total Bayar</span>
            <span>Rp {Number(data.totalPayment).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {data.paymentStatus === 'paid' && (
        <div className="card">
          <div className="step-label">Status order SMM</div>
          {data.smmStatus === 'gagal_kirim' ? (
            <>
              <p style={{ color: 'var(--danger)', fontSize: 14 }}>
                Pembayaran berhasil, tapi order gagal otomatis terkirim ke provider ({data.errorMessage || 'error tidak diketahui'}).
              </p>
              <p className="muted">Simpan Order ID ini dan hubungi admin untuk diproses manual.</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, margin: '4px 0' }}>{data.smmStatusLabel || 'Sedang diproses...'}</p>
              {data.smmOrderId && <p className="muted">ID Order Provider: {data.smmOrderId}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
