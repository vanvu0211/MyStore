import { useState, useEffect } from 'react';
import { API_URL } from '../config';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const response = await fetch(`${API_URL}/Category`);
    const data = await response.json();
    setCategories(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    fetchCategories();
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setName(category.name);
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/Category/${id}`, {
      method: 'DELETE',
    });
    fetchCategories();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4 dark:text-gray-100">Quản lý loại hàng hóa</h2>
      <form onSubmit={handleSubmit} className="mb-6 flex space-x-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên loại hàng hóa"
          className="border p-2 rounded flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors">
          {editId ? 'Cập nhật' : 'Thêm'}
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
                  className="bg-yellow-500 text-white p-1 px-3 rounded hover:bg-yellow-600 mr-2 transition-colors"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="bg-red-500 text-white p-1 px-3 rounded hover:bg-red-600 transition-colors"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CategoryManager;