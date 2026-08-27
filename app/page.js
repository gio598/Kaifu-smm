'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Users, Zap, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [target, setTarget] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  // Simulasi fetch data layanan (Alur tetap sama)
  useEffect(() => {
    // Di real app: fetch('/api/services').then(...)
    setCategories(['Instagram Followers', 'Instagram Likes', 'TikTok Views']);
    setServices([
      { id: 1, category: 'Instagram Followers', name: 'IG Followers [Max 10K] - Fast', rate: 15000, min: 100, max: 10000 },
      { id: 2, category: 'Instagram Likes', name: 'IG Likes [Max 50K] - Real', rate: 5000, min: 50, max: 50000 },
      { id: 3, category: 'TikTok Views', name: 'TikTok Views - Instant', rate: 1000, min: 100, max: 1000000 },
    ]);
  }, []);

  const handleServiceChange = (e) => {
    const sId = e.target.value;
    setSelectedService(sId);
    calculatePrice(sId, quantity);
  };

  const handleQuantityChange = (e) => {
    const qty = e.target.value;
    setQuantity(qty);
    calculatePrice(selectedService, qty);
  };

  const calculatePrice = (sId, qty) => {
    const service = services.find(s => s.id == sId);
    if (service && qty) {
      setPrice((service.rate / 1000) * qty);
    } else {
      setPrice(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Logika order aslinya diletakkan di sini (fetch ke /api/checkout)
    setTimeout(() => {
      alert('Pesanan berhasil dibuat! (Simulasi)');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient pt-16 pb-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            SMM Panel Indonesia <span className="text-primary-600">Termurah & Terbaik</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Solusi terbaik untuk Media Sosial Anda! Menyediakan berbagai layanan Social Media Terlengkap dan Berkualitas dengan harga paling terjangkau.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 shadow-sm transition">
              Mulai Pesan
            </button>
            <button className="bg-white text-primary-600 border border-primary-100 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition">
              Daftar Layanan
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-primary-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">65.003+</p>
              <p className="text-sm text-gray-500">Pengguna Aktif</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">6.5M+</p>
              <p className="text-sm text-gray-500">Pesanan Dikerjakan</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">2.265+</p>
              <p className="text-sm text-gray-500">Layanan Tersedia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Order Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-100 flex items-center space-x-3">
            <ShoppingCart className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-800">Buat Pesanan Baru</h2>
          </div>
          
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Layanan</label>
                <select 
                  className="w-full border-gray-200 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-3"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Layanan</label>
                <select 
                  className="w-full border-gray-200 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-3"
                  value={selectedService}
                  onChange={handleServiceChange}
                  disabled={!selectedCategory}
                  required
                >
                  <option value="">-- Pilih Layanan --</option>
                  {services.filter(s => s.category === selectedCategory).map((srv) => (
                    <option key={srv.id} value={srv.id}>{srv.name} - Rp {srv.rate}/1000</option>
                  ))}
                </select>
              </div>

              {/* Target & Quantity row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target (Link/Username)</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan target..."
                    className="w-full border-gray-200 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-3"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
                  <input 
                    type="number" 
                    placeholder="Min: 100"
                    className="w-full border-gray-200 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-3"
                    value={quantity}
                    onChange={handleQuantityChange}
                    required
                  />
                </div>
              </div>

              {/* Price & Submit */}
              <div className="bg-primary-50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between border border-primary-100 mt-8">
                <div>
                  <p className="text-sm text-primary-600 font-medium mb-1">Total Harga</p>
                  <p className="text-3xl font-bold text-primary-700">
                    Rp {price.toLocaleString('id-ID')}
                  </p>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="mt-4 md:mt-0 w-full md:w-auto bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-sm"
                >
                  {loading ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      <span>Buat Pesanan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
