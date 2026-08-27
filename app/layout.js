import './globals.css'

export const metadata = {
  title: 'SMM Nusantara Style - Panel Termurah & Terbaik',
  description: 'Platform SMM Panel Indonesia Termurah dan Terbaik',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-800 antialiased font-sans">
        {/* Navbar */}
        <nav className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold text-primary-600 tracking-tight">SMM<span className="text-gray-800">Panel</span></span>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-gray-600 hover:text-gray-900 font-medium text-sm">Masuk</button>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">Register</button>
              </div>
            </div>
          </div>
        </nav>
        
        <main>{children}</main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SMM Panel. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}
