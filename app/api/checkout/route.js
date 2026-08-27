import { NextResponse } from 'next/server';
import { getServiceById, hitungHarga } from '../../../lib/buzzerpanel';
import { createPayment, resolveQrImageSrc } from '../../../lib/austinpay';
import { createOrderRow } from '../../../lib/db';
import { generateOrderId } from '../../../lib/orderId';

export async function POST(request) {
  try {
    const body = await request.json();
    const serviceId = body.serviceId;
    const quantity = parseInt(body.quantity, 10);
    const target = (body.target || '').trim();

    if (!serviceId || !quantity || !target) {
      return NextResponse.json({ success: false, message: 'Layanan, jumlah, dan link/target wajib diisi.' }, { status: 400 });
    }

    // Harga SELALU dihitung ulang di server (jangan pernah percaya harga dari
    // browser) -- ambil data layanan asli dari BuzzerPanel dulu.
    const service = await getServiceById(serviceId);
    if (!service) {
      return NextResponse.json({ success: false, message: 'Layanan tidak ditemukan (mungkin sudah dihapus provider).' }, { status: 404 });
    }

    const min = Number(service.min) || 1;
    const max = Number(service.max) || Infinity;
    if (quantity < min || quantity > max) {
      return NextResponse.json({ success: false, message: `Jumlah harus antara ${min} - ${max}.` }, { status: 400 });
    }

    const price = hitungHarga(Number(service.rate) || 0, quantity);
    if (!price || price <= 0) {
      return NextResponse.json({ success: false, message: 'Gagal menghitung harga layanan ini.' }, { status: 500 });
    }

    const payment = await createPayment(price);
    if (!payment.success) {
      return NextResponse.json({ success: false, message: payment.message || 'Gagal membuat pembayaran QRIS.' }, { status: 502 });
    }

    const orderId = generateOrderId();
    const qrImage = resolveQrImageSrc(payment.data.qrImageRaw);

    await createOrderRow({
      id: orderId,
      austinpayOrderId: payment.data.orderId,
      serviceId: String(service.service),
      serviceName: service.name,
      quantity,
      target,
      price,
      totalPayment: payment.data.totalPayment || price,
      qrImage,
      qrString: payment.data.qrString || null,
      expiredAt: payment.data.expiredAt || null,
    });

    return NextResponse.json({
      success: true,
      orderId,
      austinpayOrderId: payment.data.orderId,
      qrImage,
      qrString: payment.data.qrString,
      totalPayment: payment.data.totalPayment || price,
      expiredAt: payment.data.expiredAt,
      serviceName: service.name,
      quantity,
    });
  } catch (err) {
    console.error('[api/checkout] error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
