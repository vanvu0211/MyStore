import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { formatCurrency } from '../utils/utils';
import InvoicePrint from './InvoicePrint';

function SaleManager() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await fetch(`${API_URL}/Product`);
    const data = await response.json();
    setProducts(data);
  };

  const addProduct = (product) => {
    const quantity = quantities[product.id] || 1;
    setSelectedProducts([...selectedProducts, { ...product, quantity }]);
    setQuantities({ ...quantities, [product.id]: 1 });
  };

  const updateQuantity = (productId, quantity) => {
    setQuantities({ ...quantities, [productId]: parseInt(quantity) || 1 });
  };

  const applyQuantity = (productId) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, quantity: quantities[productId] || 1 } : p
      )
    );
  };

  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const handleCreateInvoice = async () => {
    const invoice = {
      customerName,
      products: selectedProducts.map(({ id, name, price, quantity }) => ({
        id,
        name,
        price,
        quantity,
      })),
    };
    const response = await fetch(`${API_URL}/Invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    const data = await response.json();
    setInvoiceData({
      ...data,
      total: selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0),
    });
    setShowInvoice(true);
    setSelectedProducts([]);
    setCustomerName('');
    setQuantities({});
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Bán hàng</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Danh sách hàng hóa</h3>
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border p-4 rounded shadow bg-white">
                <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover mb-2 rounded" />
                <h4 className="font-bold text-gray-900">{product.name}</h4>
                <p className="text-gray-600">Giá: {formatCurrency(product.price)}</p>
                <div className="flex items-center mt-2">
                  <input
                    type="number"
                    min="1"
                    value={quantities[product.id] || 1}
                    onChange={(e) => updateQuantity(product.id, e.target.value)}
                    placeholder="Số lượng (thùng)"
                    className="border p-2 rounded w-24 mr-2"
                  />
                  <button
                    onClick={() => {
                      applyQuantity(product.id);
                      addProduct(product);
                    }}
                    className="bg-blue-500 text-white p-2 rounded flex-1 hover:bg-blue-600 transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Giỏ hàng</h3>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Tên khách hàng"
            className="border p-2 rounded mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="border p-3 text-left">Tên</th>
                <th className="border p-3 text-left">Giá</th>
                <th className="border p-3 text-left">Số lượng</th>
                <th className="border p-3 text-left">Thành tiền</th>
                <th className="border p-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border p-3">{product.name}</td>
                  <td className="border p-3">{formatCurrency(product.price)}</td>
                  <td className="border p-3">{product.quantity}</td>
                  <td className="border p-3">{formatCurrency(product.price * product.quantity)}</td>
                  <td className="border p-3">
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="bg-red-500 text-white p-1 px-3 rounded hover:bg-red-600 transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-semibold">
            Tổng cộng: {formatCurrency(selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0))}
          </p>
          <button
            onClick={handleCreateInvoice}
            className="bg-green-500 text-white p-2 rounded mt-4 w-full hover:bg-green-600 transition-colors disabled:bg-gray-400"
            disabled={!customerName || selectedProducts.length === 0}
          >
            Xuất hóa đơn
          </button>
        </div>
      </div>
      {showInvoice && invoiceData && (
        <InvoicePrint invoice={invoiceData} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
}

export default SaleManager;