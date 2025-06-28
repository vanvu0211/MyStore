import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const InvoicePrint = ({ invoice, onClose }) => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // Sample invoice data structure (replace with actual data from props if needed)
  const {
    customerName = 'Phó cáo, Yên Minh, Hà Giang',
    invoiceNumber = '0987154154',
    date = '29/06/2022 (17:26)',
    items = [
      { id: 1, name: 'Chan h ngày - Sinh tố dâu', quantity: 1, unitPrice: 20000, total: 20000 },
      { id: 2, name: 'NHSUA - Sinh tố dâu xáhn', quantity: 2, unitPrice: 35000, total: 70000 },
      { id: 3, name: 'Sinh tố bưởi', quantity: 1, unitPrice: 35000, total: 35000 },
      { id: 4, name: 'UADUA - Sinh tố dâu sữa', quantity: 1, unitPrice: 35000, total: 35000 },
    ],
    subTotal = 160000,
    serviceFee = 8000,
    vat = 15346,
    grandTotal = 168000,
    note = 'Trân trọng cảm ơn!',
    companyInfo = {
      name: 'mancook',
      address: 'Phố cáo, Yên Minh, Hà Giang',
      taxCode: '0987154154',
      phone: '0226000230',
      issuer: 'Nguyễn Quỳnh Trang',
    },
  } = invoice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <div ref={componentRef} className="printable-area">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">{companyInfo.name}</h2>
            <p className="text-sm text-gray-600">{companyInfo.address}</p>
            <p className="text-sm text-gray-600">Số: {invoiceNumber}</p>
            <p className="text-sm text-gray-600">Ngày: {date}</p>
          </div>
          <h1 className="text-2xl font-bold text-center mb-4">HÓA ĐỌN THANH TOÁN</h1>
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="border p-2 text-left">#</th>
                <th className="border p-2 text-left">Tên món</th>
                <th className="border p-2 text-center">SL</th>
                <th className="border p-2 text-right">ĐG</th>
                <th className="border p-2 text-right">TT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{item.id}</td>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-right">{new Intl.NumberFormat('vi-VN').format(item.unitPrice)}đ</td>
                  <td className="border p-2 text-right">{new Intl.NumberFormat('vi-VN').format(item.total)}đ</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right space-y-2 mb-4">
            <p>Tiền hàng: {new Intl.NumberFormat('vi-VN').format(subTotal)}đ</p>
            <p>Phí dịch vụ (5%): {new Intl.NumberFormat('vi-VN').format(serviceFee)}đ</p>
            <p>Thuế GTGT (10%): {new Intl.NumberFormat('vi-VN').format(vat)}đ</p>
            <p className="font-bold">Tổng thanh toán: {new Intl.NumberFormat('vi-VN').format(grandTotal)}đ</p>
            <p>Tiền mặt: {new Intl.NumberFormat('vi-VN').format(grandTotal)}đ</p>
            <p>Trả lại khách: 0đ</p>
          </div>
          <div className="text-center mt-4">
            <p className="font-bold">Trân trọng cảm ơn!</p>
          </div>
          <div className="text-left mt-4 text-sm text-gray-600">
            <p>CUCKU - Mọi sản phẩm đều được xuất hóa đơn</p>
            <p>Ký hiệu: 1K22TAB</p>
            <p>Số HD: 0010028</p>
            <p>Ngày: 01/08/2024Số: ABXU456HU0902</p>
            <p>Mã số thuế: BGUJCXQ267</p>
            <p>Tra cứu tại website: https://www.meinvoice.vn/tra_cuu/</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={handlePrint}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
          >
            In hóa đơn
          </button>
          <button
            onClose={onClose}
            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;