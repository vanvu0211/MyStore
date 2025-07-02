import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { formatCurrency } from '../utils/utils';

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
  const [loading, setLoading] = useState(false); // Add loading state

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
      const response = await fetch(`${API_URL}/Product`);
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
      const response = await fetch(`${API_URL}/Category`);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview('');
      setImageBase64('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || isNaN(parseInt(categoryId))) {
      setError('Vui lòng chọn một danh mục hợp lệ');
      return;
    }
    setError(null);
    setLoading(true); // Set loading true during submission
    const product = {
      name,
      categoryId: parseInt(categoryId),
      price: parseFloat(price),
      imageUrl: imageBase64 || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    };
    try {
      if (editId) {
        await fetch(`${API_URL}/Product/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...product }),
        });
        setEditId(null);
      } else {
        await fetch(`${API_URL}/Product`, {
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
    setPrice(product.price?.toString() || '');
    setImagePreview(product.imageUrl || '');
    setImageBase64(product.imageUrl || '');
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    setLoading(true); // Set loading true during deletion
    try {
      await fetch(`${API_URL}/Product/${id}`, {
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
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Giá"
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            <div className="flex flex-col">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="border p-2 rounded"
                disabled={loading}
              />
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
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Tên</th>
                <th className="border p-3 text-left">Loại</th>
                <th className="border p-3 text-left">Giá</th>
                <th className="border p-3 text-left">Hình ảnh</th>
                <th className="border p-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border p-3">{product.id}</td>
                 <td className="border p-3">{product.name}</td>
                  <td className="border p-3">{product.category?.name || 'N/A'}</td>
                  <td className="border p-3">{formatCurrency(product.price)}</td>
                  <td className="border p-3">
                    <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded" />
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
                      onClick={() => handleDelete(product.id)}
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
        </>
      )}
    </div>
  );
}

export default ProductManager;