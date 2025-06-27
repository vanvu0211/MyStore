function InvoicePrint({ invoice, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Hóa đơn bán hàng</h2>
        <p className="text-gray-700"><strong>ID:</strong> {invoice.id}</p>
        <p className="text-gray-700"><strong>Khách hàng:</strong> {invoice.customerName}</p>
        <p className="text-gray-700"><strong>Ngày bán:</strong> {new Date(invoice.saleDate).toLocaleString()}</p>
        <table className="w-full border-collapse mt-4">
          <thead>
            <tr className="bg-gray-100 text-gray-900">
              <th className="border p-2 text-left">Tên</th>
              <th className="border p-2 text-left">Giá</th>
              <th className="border p-2 text-left">Số lượng</th>
              <th className="border p-2 text-left">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {invoice.products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="border p-2">{product.name}</td>
                <td className="border p-2">{product.price}</td>
                <td className="border p-2">{product.quantity}</td>
                <td className="border p-2">{product.price * product.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-gray-700"><strong>Tổng cộng:</strong> {invoice.total} VND</p>
        <div className="mt-4 flex justify-between">
          <button onClick={handlePrint} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors">
            In hóa đơn
          </button>
          <button onClick={onClose} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoicePrint;