import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

// Fallback formatCurrency implementation
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '0 đ';
  return `${parseInt(value).toLocaleString('vi-VN')} đ`;
};

function InvoiceSearch() {
  const [searchInvoiceCode, setSearchInvoiceCode] = useState('');
  const [searchedInvoice, setSearchedInvoice] = useState(null);
  const [invoicesByDate, setInvoicesByDate] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [totalInvoicesAmount, setTotalInvoicesAmount] = useState(0); // New state for total amount

  // Fetch invoices by date
  const fetchInvoicesByDate = useCallback(async () => {
    setListLoading(true);
    try {
      const response = await fetch(`${API_URL}/Invoices/by-date/${selectedDate}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy hóa đơn cho ngày này');
        }
        throw new Error('Lỗi khi tải danh sách hóa đơn');
      }
      const data = await response.json();
      setInvoicesByDate(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching invoices by date:', error);
      setError(error.message || 'Không tìm thấy hóa đơn hoặc có lỗi xảy ra');
      setInvoicesByDate([]);
    } finally {
      setListLoading(false);
    }
  }, [selectedDate]);

  // Calculate total amount of invoices whenever invoicesByDate changes
  useEffect(() => {
    const total = invoicesByDate.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    setTotalInvoicesAmount(total);
  }, [invoicesByDate]);

  useEffect(() => {
    fetchInvoicesByDate();
  }, [fetchInvoicesByDate]);

  const fetchInvoiceByCode = async (code) => {
    if (!code) {
      setError('Vui lòng nhập mã hóa đơn để tìm kiếm');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/Invoices/by-code/${code}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy hóa đơn');
        }
        throw new Error('Lỗi khi tìm kiếm hóa đơn');
      }
      const data = await response.json();
      setSearchedInvoice(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError(error.message || 'Không tìm thấy hóa đơn hoặc có lỗi xảy ra');
      setSearchedInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle invoice deletion
  const handleDeleteInvoice = async (invoiceCode) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hóa đơn ${invoiceCode}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/Invoices/by-code/${invoiceCode}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Xóa hóa đơn thất bại');

      // Refresh the invoice list after deletion
      setInvoicesByDate(invoicesByDate.filter((invoice) => invoice.invoiceCode !== invoiceCode));

      // Clear searched invoice if it was the one deleted
      if (searchedInvoice?.invoiceCode === invoiceCode) {
        setSearchedInvoice(null);
        setSearchInvoiceCode('');
      }

      setError(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setError(error.message || 'Xóa hóa đơn thất bại hoặc có lỗi xảy ra');
    }
  };

  // Handle invoice selection from list
  const handleInvoiceSelect = (invoiceCode) => {
    setSearchInvoiceCode(invoiceCode);
    fetchInvoiceByCode(invoiceCode);
  };

  return (
    <div className="flex justify-center min-h-screen px-0 py-6 sm:px-6">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6">
        {/* Left Section: Invoice List by Date */}
        <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-md p-6 sm:p-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center sm:text-xl">
            Danh sách hóa đơn
          </h3>
          <div className="mb-4">
            <label
              htmlFor="date-picker"
              className="block text-lg font-medium text-gray-700 mb-2 sm:text-base"
            >
              Chọn ngày
            </label>
            <input
              type="date"
              id="date-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg w-full text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-base"
              aria-label="Chọn ngày để xem danh sách hóa đơn"
            />
          </div>
          {listLoading ? (
            <div className="flex justify-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            </div>
          ) : invoicesByDate.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-200">
                      <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">
                        Mã hóa đơn
                      </th>
                      <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">
                        Khách hàng
                      </th>
                      <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">
                        Tổng tiền
                      </th>
                      <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesByDate.map((invoice) => (
                      <tr key={invoice.invoiceCode} className="border-b hover:bg-gray-50">
                        <td
                          className="p-3 text-base sm:text-sm cursor-pointer hover:text-blue-600"
                          onClick={() => handleInvoiceSelect(invoice.invoiceCode)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleInvoiceSelect(invoice.invoiceCode);
                            }
                          }}
                        >
                          {invoice.invoiceCode}
                        </td>
                        <td className="p-3 text-base sm:text-sm">{invoice.customerName}</td>
                        <td className="p-3 text-base sm:text-sm">{formatCurrency(invoice.totalAmount)}</td>
                        <td className="p-3 text-base sm:text-sm">
                          <button
                            onClick={() => handleDeleteInvoice(invoice.invoiceCode)}
                            className="bg-red-600 text-white py-1 px-3 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors duration-200"
                            aria-label={`Xóa hóa đơn ${invoice.invoiceCode}`}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Display Total Amount */}
              <div className="mt-4 text-lg font-semibold text-gray-900 sm:text-base">
                Tổng tiền tất cả hóa đơn: {formatCurrency(totalInvoicesAmount)}
              </div>
            </>
          ) : (
            <p className="text-center text-lg text-gray-600 sm:text-base">
              Không có hóa đơn nào cho ngày này
            </p>
          )}
        </div>

        {/* Right Section: Invoice Search */}
        <div className="w-full lg:w-1/2">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center sm:text-xl">
            Tìm kiếm hóa đơn
          </h3>
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
                className="border border-gray-200 p-3 rounded-lg w-full text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-base"
                disabled={loading}
                aria-label="Nhập mã hóa đơn để tìm kiếm"
              />
              <button
                onClick={() => fetchInvoiceByCode(searchInvoiceCode)}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap sm:text-base"
                disabled={loading}
                aria-label="Tìm kiếm hóa đơn"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Đang tìm...
                  </span>
                ) : (
                  'Tìm kiếm'
                )}
              </button>
            </div>
            {searchedInvoice && (
              <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-4">
                <h5 className="text-2xl font-bold text-gray-800 mb-4 sm:text-xl">
                  Thông tin hóa đơn
                </h5>
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
                          <tr className="bg-blue-200">
                            <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">
                              Tên
                            </th>
                            <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">
                              SL
                            </th>
                            <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">
                              Giá bán
                            </th>
                            <th className="p-3 text-base font-semibold text-gray-700 border-b sm:text-sm">
                              Thành tiền
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchedInvoice.items.map((item, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 text-base sm:text-sm">{item.productName}</td>
                              <td className="p-3 text-base sm:text-sm">{item.quantity}</td>
                              <td className="p-3 text-base sm:text-sm">{formatCurrency(item.salePrice)}</td>
                              <td className="p-3 text-base sm:text-sm">
                                {formatCurrency(item.salePrice * item.quantity)}
                              </td>
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
    </div>
  );
}

export default InvoiceSearch;