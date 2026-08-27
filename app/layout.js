import './globals.css';
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['500', '700'] });
const body = Inter({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600'] });
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500', '600'] });

export const metadata = {
  title: 'Auto Order SMM',
  description: 'Order layanan SMM otomatis, bayar QRIS langsung diproses.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
