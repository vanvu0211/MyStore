import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CategoryManager from './components/CategoryManager';
import ProductManager from './components/ProductManager';
import SaleManager from './components/SaleManager';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen w-full bg-gray-50 flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-blue-600 text-white p-4 shadow-md w-full">
          <div className="w-full flex justify-between items-center px-4">
            <h1 className="text-2xl font-bold">Tạp Hóa Văn Bằng</h1>
            <div className="hidden md:flex space-x-4">
              <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded transition-colors">
                Bán hàng
              </Link>
              <Link to="/products" className="hover:bg-blue-700 px-3 py-2 rounded transition-colors">
                Quản lý hàng hóa
              </Link>
              <Link to="/category" className="hover:bg-blue-700 px-3 py-2 rounded transition-colors">
                Quản lý loại hàng hóa
              </Link>
            </div>
            <button
              className="md:hidden focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
                />
              </svg>
            </button>
          </div>
          {isMenuOpen && (
            <div className="md:hidden mt-2 px-4">
              <Link
                to="/"
                className="block hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Bán hàng
              </Link>
              <Link
                to="/products"
                className="block hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Quản lý hàng hóa
              </Link>
              <Link
                to="/category"
                className="block hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Quản lý loại hàng hóa
              </Link>
            </div>
          )}
        </nav>

        {/* Main Content - Full Width */}
        <div className="flex-grow w-full p-4">
          <Routes>
            <Route path="/category" element={<CategoryManager />} />
            <Route path="/products" element={<ProductManager />} />
            <Route path="/" element={<SaleManager />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;