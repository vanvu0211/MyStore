import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { API_URL } from '../config';
import { formatCurrency } from '../utils/utils';
import qrBankImage from '../assets/qr_bank.png'; // Import hình ảnh QR từ thư mục assets

function SaleManager() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [quantities, setQuantities] = useState({});

  const componentRef = useRef();

  // Fetch sản phẩm khi component được mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/Product`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Cấu hình react-to-print
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${customerName}_${new Date().toISOString()}`,
    onAfterPrint: () => {
      // Reset trạng thái sau khi in xong
      setInvoiceData(null);
      setSelectedProducts([]);
      setCustomerName('');
      setQuantities({});
    },
  });

  // Hook useEffect để trigger việc in sau khi invoiceData đã được cập nhật
  useEffect(() => {
    if (invoiceData) {
      handlePrint();
    }
  }, [invoiceData, handlePrint]);

  // Cập nhật số lượng tạm thời trong input
  const updateQuantity = (productId, quantity) => {
    setQuantities({ ...quantities, [productId]: parseInt(quantity) || 1 });
  };

  // Thêm sản phẩm vào giỏ hàng
  const addProduct = (productToAdd) => {
    const quantity = quantities[productToAdd.id] || 1;
    const existingProduct = selectedProducts.find((p) => p.id === productToAdd.id);

    if (existingProduct) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === productToAdd.id ? { ...p, quantity: p.quantity + quantity } : p
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, { ...productToAdd, quantity }]);
    }
    setQuantities({ ...quantities, [productToAdd.id]: 1 });
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  // Chuẩn bị dữ liệu và trigger việc in
  const prepareAndPrint = () => {
    if (!customerName || selectedProducts.length === 0) return;

    const invoiceToPrint = {
      customerName,
      products: selectedProducts,
      total: selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0),
    };

    setInvoiceData(invoiceToPrint);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Bán hàng</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Danh sách hàng hóa</h3>
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border p-4 rounded shadow bg-white">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover mb-2 rounded"
                />
                <h4 className="font-bold text-gray-900">{product.name}</h4>
                <p className="text-gray-600">Giá: {formatCurrency(product.price)}</p>
                <div className="flex items-center mt-2">
                  <input
                    type="number"
                    min="1"
                    value={quantities[product.id] || 1}
                    onChange={(e) => updateQuantity(product.id, e.target.value)}
                    placeholder="Số lượng (thùng)"
                    className="border p-2 rounded w-24 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addProduct(product)}
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
            onClick={prepareAndPrint}
            className="bg-green-500 text-white p-2 rounded mt-4 w-full hover:bg-green-600 transition-colors disabled:bg-gray-400"
            disabled={!customerName || selectedProducts.length === 0}
          >
            Xuất hóa đơn
          </button>
        </div>
      </div>

      {/* Printable Invoice Section */}
      {invoiceData && (
        <div className="hidden print:block">
          <div
            ref={componentRef}
            className="w-72 p-5 text-xs font-sans bg-white text-black"
            style={{ width: '72mm', padding: '5mm' }}
          >
            {/* Header */}
            <div className="text-center mb-2.5">
              <div className="font-bold text-sm">Tạp hóa Văn Bằng</div>
              <div className="text-10 leading-tight">
                0966900544 - Thôn 5, Quảng Tín, Đắk R Lấp
              </div>
            </div>

            {/* Invoice Title */}
            <div className="text-center my-2.5">
              <div className="font-bold text-13">HÓA ĐƠN TẠM TÍNH</div>
              <div className="text-10">
                {new Date().toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Customer */}
            <div className="mb-2 text-10">
              <strong>Khách:</strong> {invoiceData.customerName}
            </div>

            {/* Products Table */}
            <table className="w-full border-collapse text-10 mb-2">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-0.5 w-1/4">Sản phẩm</th>
                  <th className="text-center py-0.5 w-1/4">Đơn giá</th>
                  <th className="text-center py-0.5 w-2/10">SL</th>
                  <th className="text-center py-0.5 w-3/10">T.tiền</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.products.map((product, index) => (
                  <tr key={index}>
                    <td className="py-0.5 border-b border-dotted border-gray-300">{product.name}</td>
                    <td className="text-center py-0.5 border-b border-dotted border-gray-300">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="text-center py-0.5 border-b border-dotted border-gray-300">
                      {product.quantity}
                    </td>
                    <td className="text-center py-0.5 border-b border-dotted border-gray-300">
                      {formatCurrency(product.price * product.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="border-t border-black pt-1.5 mb-2.5 text-left  text-11">
              <div>Tổng {invoiceData.products.length} sản phẩm</div>
              <div className="text-sm font-semibold mt-0.5">
                Tiền thanh toán: {formatCurrency(invoiceData.total)}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="my-2.5 text-10">
              {/* Horizontal line above QR */}
              <div className="border-t border-black mb-2"></div>
              
              {/* QR Code and Bank Info Container */}
              <div className="flex items-center justify-between">
                <img
                  src={qrBankImage}
                  alt="QR Code Ngân hàng"
                  className="w-25mm h-25mm"
                  style={{ width: '25mm', height: '25mm' }}
                />
                <div className="text-xs leading-tight text-right font-semibold mr-5mm" style={{ marginRight: '5mm' }}>
                  <div>OCB PHƯƠNG ĐÔNG</div>
                  <div>NGUYEN VAN VU</div>
                  <div>12345678910</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SaleManager;