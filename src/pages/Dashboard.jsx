// src/pages/Dashboard.jsx
import { useState } from 'react';
import UploadForm from '../components/uploadForm';
import DocumentList from '../components/DocumentList';

const Dashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div
      className="min-h-screen bg-cover bg-center p-4"
      style={{ backgroundImage: `url('https://plus.unsplash.com/premium_photo-1719943510748-4b4354fbcf56?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170')` }}
    >
    <div className="bg-white/70 backdrop-blur-sm p-4 rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">📂 Document Dashboard</h1>
      
      {/* Upload form will trigger list refresh */}
      <UploadForm onSuccess={() => setRefreshKey(prev => prev + 1)} />

      {/* Passing refreshKey as key will reload the list on change */}
      <DocumentList key={refreshKey} />
    </div>
    </div>
  );
};

export default Dashboard;