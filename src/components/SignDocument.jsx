// src/pages/SignDocument.jsx
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { postSignature } from '../utils/api';

export default function SignDocument() {
  const { id } = useParams(); // documentId
  const [coords, setCoords] = useState([]);
  
  const handleClick = async (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Save to backend
    const res = await postSignature({ documentId: id, x, y, page: 1 });
    setCoords(prev => [...prev, { x, y }]);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Click on PDF to place signature</h2>
      <div className="relative" onClick={handleClick}>
        <Document file={`/uploads/${id}.pdf`}
        onLoadError={(error) => console.error('📛 PDF load error:', error.message)}
        onSourceError={(error) => console.error('📛 PDF source error:', error.message)}>
          <Page pageNumber={1} width={600} />
        </Document>

        {/* Signature Overlays */}
        {coords.map((pos, index) => (
          <div
            key={index}
            className="absolute text-xs bg-yellow-300 text-black px-1 rounded shadow"
            style={{
              top: pos.y,
              left: pos.x,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none'
            }}
          >
            Sign Here
          </div>
        ))}
      </div>
    </div>
  );
}