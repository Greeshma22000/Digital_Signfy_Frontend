// src/components/DocumentList.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import PDFPreview from './PDFPreview';

const DocumentList = () => {
  const [docs, setDocs] = useState([]);
  const [previewId, setPreviewId] = useState(null); // Tracks open preview
  const [showModal, setShowModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [signerName, setSignerName] = useState('');

  const fetchDocs = async () => {
    try {
      const res = await api.get('/docs');
      setDocs(res.data);
    } catch (err) {
      console.error('❌ Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);



  const openSendModal = (doc) => {
    setSelectedDoc(doc);
    setRecipientEmail('');
    setSignerName('');
    setShowModal(true);
  };

const sendRequest = async () => {
    try {
      await api.post('/signatures/request', {
        documentId: selectedDoc._id,
        recipientEmail,
        signerName,
      });
      alert('✅ Signature request sent!');
      setShowModal(false);
    } catch (err) {
      alert('❌ Failed to send signature request');
      console.error(err);
    }
  };




  return (
    <div className="space-y-2 mt-6">
      <h2 className="text-xl font-semibold">Uploaded Documents</h2>
      <ul className="space-y-4">
        {docs.length === 0 && (
          <li className="text-gray-500 italic">No documents uploaded yet.</li>
        )}
        {docs.map((doc) => {
          const backendBase = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
const fileUrl = `${backendBase}/uploads/${doc.fileName}`;

          const isPreviewing = previewId === doc._id;

          return (
            <li key={doc._id} className="p-4 bg-white border shadow rounded">
              <div className="flex justify-between items-center">
                <span className="font-medium">{doc.originalName}</span>
                <div className="space-x-2">
                  {/* Open link */}
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Open
                  </a>

                  {/* Preview toggle */}
                  <button
                    onClick={() =>
                      setPreviewId(isPreviewing ? null : doc._id)
                    }
                    className="text-sm text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
                  >
                    {isPreviewing ? 'Hide Preview' : 'Preview'}
                  </button>

                  {/* ✅ Sign button */}
                  <Link
                    to={`/sign/${doc._id}`}
                    className="text-sm text-white bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                  >
                    Sign
                  </Link>
                  <button
                    onClick={() => openSendModal(doc)}
                    className="text-sm text-white bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"
                  >
                    Send for Signature
                  </button>
                </div>
              </div>

              {/* PDF Preview */}
              {isPreviewing && (
                <PDFPreview fileUrl={fileUrl} />
              )}
            </li>
          );
        })}
      </ul>
      {/* Signature Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-lg font-bold mb-4">Send for Signature</h2>
            <label className="block text-sm mb-1">Recipient Email</label>
            <input
              type="email"
              className="border w-full p-2 mb-3"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />

            <label className="block text-sm mb-1">Signer Name</label>
            <input
              type="text"
              className="border w-full p-2 mb-4"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />

            <button
              onClick={sendRequest}
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              Send Request
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="text-gray-600 text-sm mt-2 underline w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;