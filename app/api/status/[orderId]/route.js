import { NextResponse } from 'next/server';
import { detailPayment } from '../../../../lib/austinpay';
import { createOrder, checkStatus, mapStatusLabel } from '../../../../lib/buzzerpanel';
import { getOrderById, updatePaymentStatus, markOrderSubmitted, markSubmitFailed, updateSmmStatus } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const order = await getOrderById(params.orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order tidak ditemukan.' }, { status: 404 });
    }

    // 1) Masih nunggu bayar -> cek ke AustinPay.
    if (order.payment_status === 'pending') {
      const check = await detailPayment(order.austinpay_order_id);

      if (check.success && check.status === 'expired') {
        await updatePaymentStatus(order.id, 'expired');
        order.payment_status = 'expired';
      }

      if (check.success && check.status === 'paid') {
        // Lunas! Langsung kirim order ke BuzzerPanel -- ini inti dari
        // "bayar selesai, bukan pakai saldo".
        const submit = await createOrder(order.service_id, order.target, order.quantity);
        if (submit.success) {
          await markOrderSubmitted(order.id, submit.smmOrderId, 'pending');
          order.payment_status = 'paid';
          order.smm_order_id = submit.smmOrderId;
          order.smm_status = 'pending';
        } else {
          // Uang customer sudah masuk tapi order gagal terkirim ke provider
          // (misal saldo BuzzerPanel habis) -- JANGAN hilang begitu saja,
          // tandai supaya admin bisa kirim ulang manual lewat dashboard
          // BuzzerPanel pakai data target & quantity yang sudah tersimpan.
          await markSubmitFailed(order.id, submit.message);
          order.payment_status = 'paid';
          order.smm_status = 'gagal_kirim';
          order.error_message = submit.message;
        }
      }
    }

    // 2) Sudah lunas & sudah terkirim ke BuzzerPanel -> refresh progress order.
    if (order.payment_status === 'paid' && order.smm_order_id && order.smm_status !== 'gagal_kirim') {
      const smm = await checkStatus(order.smm_order_id);
      if (smm.success && smm.status && smm.status !== order.smm_status) {
        await updateSmmStatus(order.id, smm.status);
        order.smm_status = smm.status;
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      serviceName: order.service_name,
      quantity: order.quantity,
      target: order.target,
      price: order.price,
      totalPayment: order.total_payment,
      qrImage: order.qr_image,
      qrString: order.qr_string,
      expiredAt: order.expired_at,
      paymentStatus: order.payment_status, // pending | paid | expired
      smmOrderId: order.smm_order_id || null,
      smmStatus: order.smm_status || null,
      smmStatusLabel: order.smm_status ? mapStatusLabel(order.smm_status) : null,
      errorMessage: order.error_message || null,
    });
  } catch (err) {
    console.error('[api/status] error:', err);
    return NextResponse.json({ success: false, message: 'Gagal mengecek status order.' }, { status: 500 });
  }
}
