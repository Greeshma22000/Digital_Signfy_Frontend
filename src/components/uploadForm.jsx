import { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const UploadForm = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/docs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Upload response:', res.data);

      setFile(null);
      setError('');
      toast.success('✅ File uploaded successfully');
      onSuccess(); // trigger document list refresh
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      console.error('❌ Upload error:', msg);
      setError(msg);
      toast.error(`❌ ${msg}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded shadow">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full"
      />
      {error && <p className="text-red-600">{error}</p>}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Upload PDF
      </button>
    </form>
  );
};

export default UploadForm;