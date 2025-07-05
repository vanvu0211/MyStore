import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { API_URL } from '../config';
import { formatCurrency } from '../utils/utils';
import qrBankImage from '../assets/qr_bank.png';

function SaleManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInvoiceCode, setSearchInvoiceCode] = useState('');
  const [searchedInvoice, setSearchedInvoice] = useState(null);

  const componentRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProducts(), fetchCategories()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/Products`);
      if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm');
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Không thể tải danh sách sản phẩm');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/Categories`);
      if (!response.ok) throw new Error('Không thể tải danh sách danh mục');
      const data = await response.json();
      setCategories(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Không thể tải danh sách danh mục');
    }
  };

  const generateInvoiceCode = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `INV-${timestamp}-${randomStr}`.toUpperCase();
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${customerName}_${new Date().toISOString()}`,
    onAfterPrint: () => {
      setInvoiceData(null);
      setSelectedProducts([]);
      setCustomerName('');
      setQuantities({});
    },
  });

  useEffect(() => {
    if (invoiceData) {
      handlePrint();
    }
  }, [invoiceData, handlePrint]);

  const updateQuantity = (productId, value) => {
    if (value === '' || (!isNaN(value) && parseInt(value) >= 0)) {
      setQuantities({ ...quantities, [productId]: value });
    }
  };

  const addProduct = (productToAdd) => {
    const inputQuantity = quantities[productToAdd.id];
    const quantity = inputQuantity === '' || inputQuantity === '0' || !inputQuantity
      ? 1
      : parseInt(inputQuantity);

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

    setQuantities({ ...quantities, [productToAdd.id]: '' });
  };

  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const fetchInvoiceByCode = async () => {
    if (!searchInvoiceCode) {
      setError('Vui lòng nhập mã hóa đơn để tìm kiếm');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/Invoices/by-code/${searchInvoiceCode}`);
      if (!response.ok) throw new Error('Không tìm thấy hóa đơn');
      const data = await response.json();
      setSearchedInvoice(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Không tìm thấy hóa đơn hoặc có lỗi xảy ra');
      setSearchedInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const prepareAndPrint = async () => {
    if (!customerName || selectedProducts.length === 0) {
      setError('Vui lòng nhập tên khách hàng và chọn ít nhất một sản phẩm');
      return;
    }

    setLoading(true);
    try {
      const invoiceCode = generateInvoiceCode();
      const invoicePayload = {
        customerName,
        invoiceCode,
        saleDate: new Date().toISOString(),
        items: selectedProducts.map((p) => ({
          productName: p.name,
          salePrice: p.price,
          quantity: p.quantity,
        })),
      };

      const response = await fetch(`${API_URL}/Invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoicePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData || 'Không thể tạo hóa đơn');
      }

      const savedInvoice = await response.json();
      const invoiceToPrint = {
        customerName: savedInvoice.customerName,
        invoiceCode: savedInvoice.invoiceCode,
        saleDate: savedInvoice.saleDate,
        items: savedInvoice.items.map((item) => ({
          id: item.id,
          name: item.productName,
          price: item.salePrice,
          quantity: item.quantity,
        })),
        total: savedInvoice.totalAmount,
      };

      setInvoiceData(invoiceToPrint);
      setError(null);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError(error.message || 'Không thể tạo hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const groupedProducts = categories.reduce((acc, category) => {
    acc[category.id] = products.filter((product) => product.categoryId === category.id);
    return acc;
  }, {});

  return (
    <div className="p-2 max-w-full bg-gray-50 min-h-screen">
      {error && <p className="text-red-500 mb-6 px-2 text-base leading-relaxed">{error}</p>}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="flex-1 pr-2">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 leading-relaxed">Danh sách hàng hóa</h3>
            {categories.length === 0 && products.length === 0 ? (
              <p className="text-gray-600 text-base leading-relaxed">Không có sản phẩm hoặc danh mục nào để hiển thị</p>
            ) : (
              categories.map((category) => (
                groupedProducts[category.id]?.length > 0 && (
                  <div key={category.id} className="mb-6">
                    <h4 className="text-2xl font-bold text-blue-700 bg-blue-200 mb-4 border-b pb-2 leading-relaxed">{category.name}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                      {groupedProducts[category.id].map((product) => (
                        <div key={product.id} className="border rounded-lg shadow-sm bg-white hover:shadow-md transition-all duration-200 hover:scale-105 p-3">
                          <div className="relative">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-32 object-cover mb-3 rounded-md"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 text-base line-clamp-2 min-h-[2.5rem]">
                              {product.name}
                            </h4>
                            <p className="text-blue-600 font-bold text-base">
                              {formatCurrency(product.price)}
                            </p>
                            <div className="flex flex-col gap-2">
                              <input
                                type="number"
                                min="1"
                                value={quantities[product.id] || ''}
                                onChange={(e) => updateQuantity(product.id, e.target.value)}
                                placeholder="Số lượng"
                                className="border border-gray-300 p-2 rounded-md w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                                onFocus={(e) => e.target.select()}
                              />
                              <button
                                onClick={() => addProduct(product)}
                                className="bg-blue-500 text-white py-2 px-3 rounded-md text-base font-medium hover:bg-blue-600 transition-colors duration-200 active:transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={loading}
                              >
                                {loading ? 'Đang xử lý...' : 'Thêm vào giỏ'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))
            )}
          </div>

          <div className="w-96 bg-white rounded-lg shadow-lg p-4 h-fit sticky top-4">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center leading-relaxed">Giỏ hàng</h3>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tên khách hàng"
              className="border border-gray-300 p-3 rounded-md mb-6 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <div className="max-h-96 overflow-y-auto mb-6">
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-base leading-relaxed">
                  <p>Giỏ hàng trống</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base text-gray-900 font-medium">{index + 1}. {product.name}</span>
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                            {product.quantity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(product.price)} x {product.quantity}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 text-right">
                        <div className="font-semibold text-lg text-blue-600">{formatCurrency(product.price * product.quantity)}</div>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="mt-1 text-red-500 hover:text-red-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={loading}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0))}
                </span>
              </div>
              <button
                onClick={prepareAndPrint}
                className="bg-green-500 text-white py-3 rounded-md w-full text-base font-medium hover:bg-green-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!customerName || selectedProducts.length === 0 || loading}
              >
                {loading ? 'Đang xử lý...' : 'Xuất hóa đơn'}
              </button>
            </div>
            {/* Invoice Search Section */}
            <div className="mt-6 border-t pt-4">
              <h4 className="text-lg font-semibold mb-4">Tìm kiếm hóa đơn</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInvoiceCode}
                  onChange={(e) => setSearchInvoiceCode(e.target.value)}
                  placeholder="Nhập mã hóa đơn"
                  className="border border-gray-300 p-2 rounded-md w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={fetchInvoiceByCode}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md text-base font-medium hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Tìm
                </button>
              </div>
              {searchedInvoice && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h5 className="font-semibold">Thông tin hóa đơn</h5>
                  <p><strong>Mã hóa đơn:</strong> {searchedInvoice.invoiceCode}</p>
                  <p><strong>Khách hàng:</strong> {searchedInvoice.customerName}</p>
                  <p><strong>Ngày bán:</strong> {new Date(searchedInvoice.saleDate).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Sản phẩm:</strong></p>
                  <ul className="list-disc pl-5">
                    {searchedInvoice.items.map((item, index) => (
                      <li key={index}>
                        {item.productName} - {formatCurrency(item.salePrice)} x {item.quantity}
                      </li>
                    ))}
                  </ul>
                  <p><strong>Tổng cộng:</strong> {formatCurrency(searchedInvoice.totalAmount)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Section */}
      {invoiceData && (
        <div className="hidden print:block">
          <div
            ref={componentRef}
            className="w-80 p-2 text-sm font-sans bg-white text-black"
            style={{ width: '80mm', padding: '2mm' }}
          >
            {/* Header */}
            <div className="text-center mb-2.5">
              <div className="font-bold text-base">Tạp hóa Văn Bằng</div>
              <div className="text-11 leading-tight">
                0966900544 - Thôn 5, Quảng Tín, Đắk R Lấp
              </div>
            </div>

            {/* Invoice Title */}
            <div className="text-center my-2.5">
              <div className="font-bold text-14">HÓA ĐƠN TẠM TÍNH</div>
              <div className="text-11">Mã hóa đơn: {invoiceData.invoiceCode}</div>
              <div className="text-11">
                {new Date(invoiceData.saleDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Customer */}
            <div className="mb-2 text-11">
              <strong>Khách:</strong> {invoiceData.customerName}
            </div>

            {/* Products Table */}
            <table className="w-full border-collapse text-11 mb-2">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-0.5 w-1/4">Sản phẩm</th>
                  <th className="text-center py-0.5 w-1/4">Đơn giá</th>
                  <th className="text-center py-0.5 w-2/10">SL</th>
                  <th className="text-center py-0.5 w-3/10">T.tiền</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-0.5 border-b border-dashed border-gray-400">{item.name}</td>
                    <td className="text-center py-0.5 border-b border-dashed border-gray-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="text-center py-0.5 border-b border-dashed border-gray-400">
                      {item.quantity}
                    </td>
                    <td className="text-center py-0.5 border-b border-dashed border-gray-400">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="border-t border-black pt-1.5 mb-2.5 text-left text-12">
              <div>Tổng {invoiceData.items.reduce((sum, p) => sum + p.quantity, 0)} sản phẩm</div>
              <div className="text-base font-semibold mt-0.5">
                Tiền thanh toán: {formatCurrency(invoiceData.total)}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="my-2.5 text-11">
              <div className="border-t border-black mb-2"></div>
              <div className="flex items-center justify-between">
                <img
                  src={qrBankImage}
                  alt="QR Code Ngân hàng"
                  className="w-25mm h-25mm"
                  style={{ width: '25mm', height: '25mm' }}
                />
                <div
                  className="text-sm leading-tight text-right font-semibold mr-5mm"
                  style={{ marginRight: '5mm' }}
                >
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