import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CategoryManager from './components/CategoryManager';
import ProductManager from './components/ProductManager';
import SaleManager from './components/SaleManager';
import InvoiceSearch from './components/InvoiceSearch';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen w-full bg-gray-50 flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-orange-600 text-white p-4 shadow-md w-full">
          <div className="w-full flex justify-between items-center px-4">
            <h1 className="text-2xl font-bold">Tạp Hóa Văn Bằng</h1>
            <div className="hidden md:flex space-x-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3 py-2 rounded transition-colors ${
                    isActive ? 'bg-orange-800 text-white' : 'hover:bg-orange-700'
                  }`
                }
              >
                Bán hàng
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `px-3 py-2 rounded transition-colors ${
                    isActive ? 'bg-orange-800 text-white' : 'hover:bg-orange-700'
                  }`
                }
              >
                 Hàng hóa
              </NavLink>
              <NavLink
                to="/category"
                className={({ isActive }) =>
                  `px-3 py-2 rounded transition-colors ${
                    isActive ? 'bg-orange-800 text-white' : 'hover:bg-orange-700'
                  }`
                }
              >
                 Loại hàng hóa
              </NavLink>
              <NavLink
                to="/invoice"
                className={({ isActive }) =>
                  `px-3 py-2 rounded transition-colors ${
                    isActive ? 'bg-orange-800 text-white' : 'hover:bg-orange-700'
                  }`
                }
              >
                 Hóa đơn
              </NavLink>
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
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded transition-colors ${
                    isActive ? 'bg-orange-800 text-white' : 'hover:bg-orange-700'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Bán hàng
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded transition-colors ${
                    isActive ? 'bg-orange-800 text-white' : 'hover:bg-orange-700'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                 Hàng hóa
              </NavLink>
              <NavLink
                to="/category"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded transition-colors ${
                    isActive ? 'bg-orange-800 text-white' : 'hover:bg-orange-700'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                 Loại hàng hóa
              </NavLink>
              <NavLink
                to="/invoice"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded transition-colors ${
                    isActive ? 'bg-orange-800 text-white' : 'hover:bg-orange-700'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                 Hóa đơn
              </NavLink>
            </div>
          )}
        </nav>

        {/* Main Content - Full Width */}
        <div className="flex-grow w-full p-4">
          <Routes>
            <Route path="/category" element={<CategoryManager />} />
            <Route path="/products" element={<ProductManager />} />
            <Route path="/invoice" element={<InvoiceSearch />} />
            <Route path="/" element={<SaleManager />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;