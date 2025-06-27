import { Routes, Route, Link } from 'react-router-dom';
import CategoryManager from './components/CategoryManager';
import ProductManager from './components/ProductManager';
import SaleManager from './components/SaleManager';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-blue-500 p-4 text-white shadow-md">
        <div className="flex justify-between items-center w-full px-4">
          <h1 className="text-2xl font-bold text-white">Quản lý cửa hàng</h1>
          <div className="space-x-6">
            <Link to="/sales" className="hover:text-blue-100 transition-colors">Bán hàng</Link>
            <Link to="/products" className="hover:text-blue-100 transition-colors">Hàng hóa</Link>
            <Link to="/categories" className="hover:text-blue-100 transition-colors">Loại hàng hóa</Link>
          </div>
        </div>
      </nav>
      <div className="p-6 bg-white">
        <Routes>
          <Route path="/" element={<SaleManager />} />
          <Route path="/sales" element={<SaleManager />} />
          <Route path="/products" element={<ProductManager />} />
          <Route path="/categories" element={<CategoryManager />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;