import { useState } from 'react';
import { API_URL } from '../config';

// Fallback formatCurrency implementation
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '0 đ';
  return `${parseInt(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

function InvoiceSearch() {
  const [searchInvoiceCode, setSearchInvoiceCode] = useState('');
  const [searchedInvoice, setSearchedInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex justify-center  min-h-screen px-0 py-6 sm:px-6">
      <div className="w-full max-w-3xl">
        <h3 className="text-4xl font-bold text-gray-900 mb-8 text-center sm:text-3xl">Tìm kiếm hóa đơn</h3>
        {error && (
          <p className="text-red-600 bg-red-50 p-4 rounded-md mb-6 text-lg font-medium text-center sm:text-base">
            {error}
          </p>
        )}
        <div className="w-full bg-white rounded-xl shadow-md p-6 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={searchInvoiceCode}
              onChange={(e) => setSearchInvoiceCode(e.target.value)}
              placeholder="Nhập mã hóa đơn"
              className="border border-gray-200 p-3 rounded-lg w-full text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 sm:text-base"
              disabled={loading}
              aria-label="Mã hóa đơn"
            />
            <button
              onClick={fetchInvoiceByCode}
              className="bg-orange-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap sm:text-base"
              disabled={loading}
            >
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>
          {searchedInvoice && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-4">
              <h5 className="text-2xl font-bold text-gray-800 mb-4 sm:text-xl">Thông tin hóa đơn</h5>
              <div className="grid grid-cols-1 gap-3 text-gray-700 text-lg sm:text-base">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">Mã hóa đơn:</span>
                  <span>{searchedInvoice.invoiceCode}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">Khách hàng:</span>
                  <span>{searchedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">Ngày bán:</span>
                  <span>{new Date(searchedInvoice.saleDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="py-2">
                  <span className="font-medium block mb-2">Sản phẩm:</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-orange-200">
                          <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">Tên</th>
                          <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">SL</th>
                          <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">Giá bán</th>
                          <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchedInvoice.items.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-base sm:text-sm">{item.productName}</td>
                            <td className="p-3 text-base sm:text-sm">{item.quantity}</td>
                            <td className="p-3 text-base sm:text-sm">{formatCurrency(item.salePrice)}</td>
                            <td className="p-3 text-base sm:text-sm">{formatCurrency(item.salePrice * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="font-medium">Số tiền nợ:</span>
                  <span>{formatCurrency(searchedInvoice.debtAmount || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100">
                  <span className="font-medium">Tổng hóa đơn:</span>
                  <span>{formatCurrency(searchedInvoice.totalInvoice)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-100 font-semibold text-gray-900">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(searchedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvoiceSearch;