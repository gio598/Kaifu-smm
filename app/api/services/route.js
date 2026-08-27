import { NextResponse } from 'next/server';
import { searchServicesByKeyword, getAllServices, hitungHarga } from '../../../lib/buzzerpanel';
import { smm as smmCfg } from '../../../lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = (searchParams.get('q') || '').trim();

    const services = keyword ? await searchServicesByKeyword(keyword) : await getAllServices();

    const result = services.slice(0, 200).map((s) => ({
      id: s.service,
      name: s.name,
      category: s.category,
      min: Number(s.min) || 1,
      max: Number(s.max) || 0,
      pricePer1000: hitungHarga(Number(s.rate) || 0, 1000),
      rate: Number(s.rate) || 0, // dipakai untuk estimasi harga langsung di browser
    }));

    return NextResponse.json({ success: true, services: result, marginProfit: smmCfg.MARGIN_PROFIT });
  } catch (err) {
    console.error('[api/services] error:', err);
    return NextResponse.json({ success: false, message: 'Gagal mengambil daftar layanan dari BuzzerPanel.' }, { status: 500 });
  }
}
