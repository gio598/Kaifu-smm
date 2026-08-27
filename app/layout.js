import './globals.css';

export const metadata = {
  title: 'Auto Order SMM',
  description: 'Order layanan SMM otomatis, bayar QRIS langsung diproses.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
