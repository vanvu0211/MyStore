import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { formatCurrency } from '../utils/utils';
import imageCompression from 'browser-image-compression';

function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/Categories`);
      if (!response.ok) throw new Error('Không thể tải danh sách danh mục');
      const data = await response.json();
      setCategories(data);
      if (data.length > 0 && !categoryId) {
        setCategoryId(data[0].id.toString());
      }
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách danh mục');
    }
  };

  // Handle image change with compression
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      setImageBase64('');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG)!');
      e.target.value = '';
      setImageFile(null);
      setImagePreview('');
      setImageBase64('');
      return;
    }

    const maxSizeBeforeCompression = 10 * 1024; // 300KB
    if (file.size > maxSizeBeforeCompression) {
      try {
        const options = {
          maxSizeMB: 0.01,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          initialQuality: 0.8,
        };
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageBase64(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        setError('Lỗi khi nén ảnh: ' + error.message);
        e.target.value = '';
        setImageFile(null);
        setImagePreview('');
        setImageBase64('');
      }
    } else {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle price input with currency formatting
  const handlePriceChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    if (value === '') {
      setPrice('');
      return;
    }
    // Format as 100.000
    value = parseInt(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setPrice(value);
  };

  // Convert formatted price to number for submission
  const getRawPrice = (formattedPrice) => {
    return parseFloat(formattedPrice.replace(/\./g, '')) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || isNaN(parseInt(categoryId))) {
      setError('Vui lòng chọn một danh mục hợp lệ');
      return;
    }
    setError(null);
    setLoading(true);
    const product = {
      name,
      categoryId: parseInt(categoryId),
      price: getRawPrice(price),
      image: imageBase64 || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    };
    try {
      if (editId) {
        await fetch(`${API_URL}/Products/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...product }),
        });
        setEditId(null);
      } else {
        await fetch(`${API_URL}/Products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
      }
      setName('');
      setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
      setPrice('');
      setImageFile(null);
      setImagePreview('');
      setImageBase64('');
      await fetchProducts();
    } catch (err) {
      setError('Lỗi khi lưu sản phẩm. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditId(product.id);
    setName(product.name);
    setCategoryId(product.categoryId?.toString() || '');
    setPrice(product.price ? product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
    setImagePreview(product.image || '');
    setImageBase64(product.image || '');
    setImageFile(null);
    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, productName) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}"?`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/Products/${id}`, {
        method: 'DELETE',
      });
      await fetchProducts();
      setError(null);
    } catch (err) {
      setError('Lỗi khi xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Group products by category
  const groupedProducts = categories.reduce((acc, category) => {
    acc[category.id] = products.filter((product) => product.categoryId === category.id);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Quản lý hàng hóa</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên hàng hóa"
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="">Chọn loại hàng hóa</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                type="text"
                value={price}
                onChange={handlePriceChange}
                placeholder="Giá (VD: 100.000)"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                required
                disabled={loading}
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">đ</span>
            </div>
            <div className="flex flex-col">
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                className="border p-2 rounded"
                disabled={loading}
              />
              <p className="text-gray-600 text-sm mt-1">
                Ảnh lớn hơn 300KB sẽ được nén xuống ~300KB. Định dạng: JPEG, PNG.
              </p>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 col-span-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : editId ? 'Cập nhật' : 'Thêm'}
            </button>
          </form>
          <p className="text-yellow-600 mb-4">Lưu ý: Ảnh được lưu dưới dạng chuỗi base64.</p>
          {categories.length === 0 && products.length === 0 ? (
            <p className="text-gray-600 text-base leading-relaxed">Không có sản phẩm hoặc danh mục nào để hiển thị</p>
          ) : (
            categories.map((category) => (
              groupedProducts[category.id]?.length > 0 && (
                <div key={category.id} className="mb-6">
                  <h4 className="text-xl font-bold text-blue-700 bg-blue-200 mb-4 border-b pb-2 leading-relaxed">{category.name}</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-900">
                        <th className="border p-3 text-left">ID</th>
                        <th className="border p-3 text-left">Tên</th>
                        <th className="border p-3 text-left">Giá</th>
                        <th className="border p-3 text-left">Hình ảnh</th>
                        <th className="border p-3 text-left">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedProducts[category.id].map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="border p-3">{product.id}</td>
                          <td className="border p-3">{product.name}</td>
                          <td className="border p-3">{formatCurrency(product.price)}</td>
                          <td className="border p-3">
                            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                          </td>
                          <td className="border p-3">
                            <button
                              onClick={() => handleEdit(product)}
                              className="bg-yellow-500 text-white p-1 px-3 rounded hover:bg-yellow-600 mr-2 transition-colors disabled:bg-gray-400"
                              disabled={loading}
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              className="bg-red-500 text-white p-1 px-3 rounded hover:bg-red-600 transition-colors disabled:bg-gray-400"
                              disabled={loading}
                            >
                              {loading ? 'Đang xóa...' : 'Xóa'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ))
          )}
        </>
      )}
    </div>
  );
}

export default ProductManager;