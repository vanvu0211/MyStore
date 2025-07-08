import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { API_URL } from '../config';
import qrBankImage from '../assets/qr_bank.png';

// Fallback formatCurrency implementation (remove if already defined in ../utils/utils)
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '0 đ';
  return `${parseInt(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

function SaleManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [customPrices, setCustomPrices] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInvoiceCode, setSearchInvoiceCode] = useState('');
  const [searchedInvoice, setSearchedInvoice] = useState(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDate, setDebtDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const componentRef = useRef();
  const cartRef = useRef();
  const categoryRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchCategories();
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/Categories`);
      if (!response.ok) throw new Error('Không thể tải danh sách danh mục');
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Danh sách danh mục trống');
      }
      setCategories(data);
      const defaultCategory = data.find(category => category.name.toLowerCase() === 'mì tôm') || data[0];
      if (defaultCategory) {
        setSelectedCategoryId(defaultCategory.id);
        await fetchProducts(defaultCategory.id);
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Không thể tải danh sách danh mục');
    }
  };

  const fetchProducts = async (categoryId) => {
    if (!categoryId) {
      setError('Không có danh mục được chọn');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/Products/category/${categoryId}`);
      if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm');
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Dữ liệu sản phẩm không hợp lệ');
      }
      setProducts(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Không thể tải danh sách sản phẩm');
      setProducts([]);
    }
  };

  const generateInvoiceCode = async () => {
    try {
      const response = await fetch(`${API_URL}/Invoices/count`);
      if (!response.ok) throw new Error('Không thể lấy số lượng hóa đơn');
      const count = await response.json();
      return `HD${count + 1}`;
    } catch (error) {
      console.error('Error fetching invoice count:', error);
      setError('Không thể tạo mã hóa đơn');
      return `HD${Date.now()}`; // Fallback in case of error
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${customerName}_${new Date().toISOString()}`,
    onAfterPrint: () => {
      setInvoiceData(null);
      setSelectedProducts([]);
      setCustomerName('');
      setQuantities({});
      setCustomPrices({});
      setDebtAmount('');
      setDebtDate('');
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

  const updateCustomPrice = (productId, value) => {
    let formattedValue = value.replace(/[^0-9]/g, '');
    if (formattedValue === '') {
      setCustomPrices({ ...customPrices, [productId]: '' });
      return;
    }
    formattedValue = parseInt(formattedValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setCustomPrices({ ...customPrices, [productId]: formattedValue });
  };

  const updateDebtAmount = (value) => {
    let formattedValue = value.replace(/[^0-9]/g, '');
    if (formattedValue === '') {
      setDebtAmount('');
      return;
    }
    formattedValue = parseInt(formattedValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setDebtAmount(formattedValue);
  };

  const getRawPrice = (formattedPrice) => {
    return parseFloat(formattedPrice.replace(/\./g, '')) || 0;
  };

  const addProduct = (productToAdd) => {
    if (!productToAdd) return;
    const inputQuantity = quantities[productToAdd.id];
    const quantity = inputQuantity === '' || inputQuantity === '0' || !inputQuantity
      ? 1
      : parseInt(inputQuantity);

    const inputPrice = customPrices[productToAdd.id];
    const price = inputPrice && getRawPrice(inputPrice) > 0
      ? getRawPrice(inputPrice)
      : productToAdd.price;

    const existingProductIndex = selectedProducts.findIndex((p) => p.id === productToAdd.id);
    let updatedProducts;

    if (existingProductIndex >= 0) {
      updatedProducts = selectedProducts.map((p, index) =>
        index === existingProductIndex
          ? { ...p, quantity: p.quantity + quantity, price }
          : p
      );
    } else {
      updatedProducts = [...selectedProducts, { ...productToAdd, quantity, price }];
    }

    setSelectedProducts(updatedProducts);
    setQuantities({ ...quantities, [productToAdd.id]: '' });
    setCustomPrices({ ...customPrices, [productToAdd.id]: '' });
  };

  useEffect(() => {
    if (cartRef.current && selectedProducts.length > 0) {
      const productElements = cartRef.current.querySelectorAll('.cart-item');
      const targetIndex = selectedProducts.length - 1;
      const targetElement = productElements[targetIndex];
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedProducts]);

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
      const invoiceCode = await generateInvoiceCode();
      const rawDebtAmount = debtAmount ? getRawPrice(debtAmount) : 0;
      const invoicePayload = {
        customerName,
        invoiceCode,
        saleDate: new Date().toISOString(),
        debtAmount: rawDebtAmount,
        debtDate: debtDate || null,
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
        throw new Error(errorData.message || 'Không thể tạo hóa đơn');
      }

      const savedInvoice = await response.json();
      const invoiceToPrint = {
        customerName: savedInvoice.customerName,
        invoiceCode: savedInvoice.invoiceCode,
        saleDate: savedInvoice.saleDate,
        debtAmount: savedInvoice.debtAmount,
        debtDate: savedInvoice.debtDate,
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

  const updateProductPrice = async (productId, newPriceValue) => {
    setLoading(true);
    try {
      const rawPrice = getRawPrice(newPriceValue);
      if (rawPrice <= 0) {
        throw new Error('Giá phải lớn hơn 0');
      }

      const response = await fetch(`${API_URL}/Products/${productId}/price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: rawPrice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật giá sản phẩm');
      }

      if (selectedCategoryId) {
        await fetchProducts(selectedCategoryId);
      }
      setError(null);
      setIsPriceModalOpen(false);
      setNewPrice('');
      setSelectedProductId(null);
    } catch (error) {
      console.error('Error updating product price:', error);
      setError(error.message || 'Không thể cập nhật giá sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalWithDebt = () => {
    const productsTotal = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const rawDebtAmount = debtAmount ? getRawPrice(debtAmount) : 0;
    return productsTotal + rawDebtAmount;
  };

  const scrollToCategory = async (categoryId) => {
    if (!categoryId) return;
    setLoading(true);
    setSelectedCategoryId(categoryId);
    try {
      await fetchProducts(categoryId);
      if (categoryRef.current) {
        categoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching products for category:', error);
      setError('Không thể tải sản phẩm cho danh mục này');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 max-w-full bg-gray-50 min-h-screen">
      {error && <p className="text-red-500 mb-6 px-2 text-base leading-relaxed">{error}</p>}
      <div className="flex gap-4">
        {/* Product List Section */}
        <div className="flex-1 pr-2">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="sticky top-0 bg-gray-50 z-10 pt-2">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 leading-relaxed">Danh sách hàng hóa</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={`py-2 px-4 rounded-md text-base font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                        selectedCategoryId === category.id ? 'bg-blue-900 text-white' : 'bg-blue-400 text-white hover:bg-blue-600'
                      }`}
                      disabled={loading}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              {categories.length === 0 ? (
                <p className="text-gray-600 text-base leading-relaxed">Không có danh mục nào để hiển thị</p>
              ) : !selectedCategoryId ? (
                <p className="text-gray-600 text-base leading-relaxed">Vui lòng chọn một danh mục</p>
              ) : (
                <div ref={categoryRef} className="mb-6">
                  {products.length === 0 ? (
                    <p className="text-gray-600 text-base leading-relaxed">Không có sản phẩm nào trong danh mục này</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                      {products.map((product) => (
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
                            <div className="flex items-center gap-2">
                              <p className="text-blue-600 font-bold text-base">
                                {formatCurrency(product.price)}
                              </p>
                              <button
                                onClick={() => {
                                  setSelectedProductId(product.id);
                                  setNewPrice(formatCurrency(product.price).replace(' đ', ''));
                                  setIsPriceModalOpen(true);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                                disabled={loading}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v.01M12 12v.01M12 18v.01"></path>
                                </svg>
                              </button>
                            </div>
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
                                aria-label={`Số lượng cho ${product.name}`}
                              />
                              <div className="relative">
                                <input
                                  type="text"
                                  value={customPrices[product.id] || ''}
                                  onChange={(e) => updateCustomPrice(product.id, e.target.value)}
                                  placeholder="Giá tùy chỉnh"
                                  className="border border-gray-300 p-2 rounded-md w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  disabled={loading}
                                  onFocus={(e) => e.target.select()}
                                  aria-label={`Giá tùy chỉnh cho ${product.name}`}
                                />
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">đ</span>
                              </div>
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
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Cart Section - Always visible, not affected by loading */}
        <div className="w-96 bg-white rounded-lg shadow-lg p-4 h-fit sticky top-4">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center leading-relaxed">Giỏ hàng</h3>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Tên khách hàng"
            className="border border-gray-300 p-3 rounded-md mb-6 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            aria-label="Tên khách hàng"
          />
          <div className="max-h-96 overflow-y-auto mb-6" ref={cartRef}>
            {selectedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-base leading-relaxed">
                <p>Giỏ hàng trống</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md cart-item">
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
            <div className="mb-4 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={debtAmount}
                  onChange={(e) => updateDebtAmount(e.target.value)}
                  placeholder="Số tiền nợ"
                  className="border border-gray-300 p-2 rounded-md w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  onFocus={(e) => e.target.select()}
                  aria-label="Số tiền nợ"
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">đ</span>
              </div>
              <input
                type="text"
                value={debtDate}
                onChange={(e) => setDebtDate(e.target.value)}
                placeholder="Ngày nợ"
                className="border border-gray-300 p-2 rounded-md w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                aria-label="Ngày nợ"
              />
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-medium">Tổng hóa đơn:</span>
              <span className="text-base font-semibold text-blue-600">
                {formatCurrency(selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-medium">Số tiền nợ:</span>
              <span className="text-base font-semibold text-blue-600">
                {debtAmount ? formatCurrency(getRawPrice(debtAmount)) : formatCurrency(0)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-semibold">Tổng cộng:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(calculateTotalWithDebt())}
              </span>
            </div>
            <button
              onClick={prepareAndPrint}
              className="bg-blue-500 text-white py-3 rounded-md w-full text-base font-medium hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!customerName || selectedProducts.length === 0 || loading}
            >
              {loading ? 'Đang xử lý...' : 'Xuất hóa đơn'}
            </button>
          </div>
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
                aria-label="Mã hóa đơn"
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
                <p><strong>Số tiền nợ:</strong> {formatCurrency(searchedInvoice.debtAmount || 0)}</p>
                {searchedInvoice.debtDate && (
                  <p><strong>Ngày nợ:</strong> {new Date(searchedInvoice.debtDate).toLocaleDateString('vi-VN')}</p>
                )}
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

      {isPriceModalOpen && (
        <div className="fixed inset-0 bg-gray-300/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Cập nhật giá sản phẩm</h3>
            <p className="text-gray-600 mb-4">
              Sản phẩm: {products.find((p) => p.id === selectedProductId)?.name || 'Không xác định'}
            </p>
            <div className="relative mb-4">
              <input
                type="text"
                value={newPrice}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') {
                    setNewPrice('');
                    return;
                  }
                  value = parseInt(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                  setNewPrice(value);
                }}
                placeholder="Nhập giá mới"
                className="border border-gray-300 p-2 rounded-md w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                onFocus={(e) => e.target.select()}
                aria-label="Giá mới"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">đ</span>
            </div>
            {error && <p className="text-red-500 mb-4 text-base">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsPriceModalOpen(false);
                  setNewPrice('');
                  setSelectedProductId(null);
                  setError(null);
                }}
                className="bg-gray-300 text-gray-900 py-2 px-4 rounded-md text-base font-medium hover:bg-gray-400 transition-colors duration-200"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={() => updateProductPrice(selectedProductId, newPrice)}
                className="bg-blue-500 text-white py-2 px-4 rounded-md text-base font-medium hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading || !newPrice}
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceData && (
        <div className="hidden print:block">
          <div
            ref={componentRef}
            className="w-80 p-2 text-sm font-sans bg-white text-black"
            style={{ width: '80mm', padding: '2mm', fontSize: '13pt' }}
          >
            <div className="text-center mb-2.5">
              <div className="font-bold text-lg">Tạp hóa Văn Bằng</div>
              <div className="text-13 leading-tight">
                0966900544 - Thôn 5, Quảng Tín, Đắk R Lấp
              </div>
            </div>
            <div className="text-center my-2.5">
              <div className="font-bold text-16">HÓA ĐƠN TẠM TÍNH</div>
              <div className="text-13">Mã hóa đơn: {invoiceData.invoiceCode}</div>
              <div className="text-13">
                {new Date(invoiceData.saleDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="mb-2 text-lg">
              <strong>Khách:</strong> {invoiceData.customerName}
            </div>
            <table className="w-full border-collapse text-lg mb-2">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-0.5 w-4/10 ">Sản phẩm</th>
                  <th className="text-center py-0.5 w-1/4 ">Đơn giá</th>
                  <th className="text-center py-0.5 w-1/10 ">SL</th>
                  <th className="text-center py-0.5 w-1/4">T.tiền</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-0.5 border-b  border-r border-dashed border-gray-400">{item.name}</td>
                    <td className="text-center py-0.5 border-b border-r border-dashed border-gray-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="text-center py-0.5 border-b border-r border-dashed border-gray-400">
                      {item.quantity}
                    </td>
                    <td className="text-center ml-0.5 py-0.5 border-b border-r border-dashed border-gray-400">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-black pt-1.5 mb-2.5 text-left text-14">
              <div>
                Tổng: <span className="font-semibold">
                  {invoiceData.items.reduce((sum, p) => sum + p.quantity, 0)} sản phẩm
                </span>
              </div>
              <div className="text-lg font-semibold mt-0.5">
                <div>
                  <span className="font-normal">Tổng hóa đơn:</span>{' '}
                  {formatCurrency(invoiceData.items.reduce((sum, p) => sum + p.price * p.quantity, 0))}
                </div>
                {debtAmount !== '' && (
                  <div>
                    <span className="font-normal">Tiền nợ:</span>{' '}
                    {formatCurrency(getRawPrice(debtAmount))} - <span className="italic">{debtDate}</span>
                  </div>
                )}
              </div>
              <div className="text-lg font-semibold mt-0.5">
                <div>Tiền thanh toán: {formatCurrency(calculateTotalWithDebt())}</div>
              </div>
            </div>
            <div className="my-2.5 text-13">
              <div className="border-t border-black mb-2"></div>
              <div className="flex items-center justify-between">
                <img
                  src={qrBankImage}
                  alt="QR Code Ngân hàng"
                  className="w-25mm h-25mm"
                  style={{ width: '25mm', height: '25mm' }}
                />
                <div
                  className="text-base leading-tight text-right font-semibold mr-5mm"
                  style={{ marginRight: '5mm' }}
                >
                  <div>LB Bank</div>
                  <div>THAI THI LIEU</div>
                  <div>3377226666</div>
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