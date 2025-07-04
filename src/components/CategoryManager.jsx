import { useState, useEffect } from 'react';
import { API_URL } from '../config';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/Category`);
      if (!response.ok) throw new Error('Không thể tải danh sách danh mục');
      const data = await response.json();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await fetch(`${API_URL}/Category/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, name }),
        });
        setEditId(null);
      } else {
        await fetch(`${API_URL}/Category`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      }
      setName('');
      await fetchCategories();
      setError(null);
    } catch (err) {
      setError('Lỗi khi lưu danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setName(category.name);
  };

  const handleDelete = async (id, categoryName) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/Category/${id}`, {
        method: 'DELETE',
      });
      await fetchCategories();
      setError(null);
    } catch (err) {
      setError('Lỗi khi xóa danh mục');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 dark:text-gray-100">Quản lý loại hàng hóa</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mb-6 flex space-x-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên loại hàng hóa"
              className="border p-2 rounded flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : editId ? 'Cập nhật' : 'Thêm'}
            </button>
          </form>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Tên</th>
                <th className="border p-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="border p-3">{category.id}</td>
                  <td className="border p-3">{category.name}</td>
                  <td className="border p-3">
                    <button
                      onClick={() => handleEdit(category)}
                      className="bg-yellow-500 text-white p-1 px-3 rounded hover:bg-yellow-600 mr-2 transition-colors disabled:bg-gray-400"
                      disabled={loading}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
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

export default CategoryManager;