import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from '../utils/api';
import { Document, Page, pdfjs } from 'react-pdf';
import Draggable from 'react-draggable';

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const fonts = [
  'Pacifico', 'Anton', 'Caveat', 'Comfortaa', 'Dancing Script',
  'Fira Sans', 'Great Vibes', 'Indie Flower', 'Kalam', 'Lora',
  'Nunito', 'Orbitron', 'Playfair Display', 'Quicksand', 'Raleway',
  'Roboto', 'Shadows Into Light', 'Signika', 'Ubuntu', 'Zeyada',
];

const SignFromToken = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [docInfo, setDocInfo] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pdfDims, setPdfDims] = useState({ width: 600, height: 800 });
  const [signature, setSignature] = useState({ name: '', font: 'Pacifico', fontSize: 24 });
  const [placedCoords, setPlacedCoords] = useState(null);
  const [dragging, setDragging] = useState(false);

  const canvasRef = useRef(null);

  // Load PDF + signer name
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/signatures/pending/${token}`);
        console.log('✅ /pending API response:', res.data);
        setDocInfo(res.data);
      } catch (err) {
        alert('Invalid or expired link.');
        console.error('❌ Error fetching document by token:', err);
        navigate('/');
      }
    };
    load();
  }, [token]);

  const handlePDFLoaded = (pdf) => {
    setNumPages(pdf.numPages);
  };

  const handlePageRenderSuccess = (page) => {
    const canvas = document.querySelector('.react-pdf__Page canvas');
    if (canvas) {
      setPdfDims({
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        realWidth: page.originalWidth,
        realHeight: page.originalHeight,
      });
      canvasRef.current = canvas;
    }
  };

  const handleStopDrag = (e, data) => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scaleX = pdfDims.realWidth / canvasRect.width;
    const scaleY = pdfDims.realHeight / canvasRect.height;

    const relativeX = (e.clientX - canvasRect.left) * scaleX;
    const relativeY = (e.clientY - canvasRect.top) * scaleY;

    const finalX = Math.max(0, Math.min(pdfDims.realWidth - 50, relativeX));
    const finalY = Math.max(0, Math.min(pdfDims.realHeight - 36, pdfDims.realHeight - relativeY));

    setPlacedCoords({ x: finalX, y: finalY });
    setDragging(false);
  };

  const handleConfirm = async () => {
    if (!placedCoords || !signature.name) {
      alert('Please place your signature and enter your name.');
      return;
    }

    await axios.post(`/signatures/complete/${token}`, {
      x: placedCoords.x,
      y: placedCoords.y,
      page: 1,
      name: signature.name,
      font: signature.font,
      fontSize: signature.fontSize,
    });

    alert('✅ Document signed successfully!');
    navigate('/');
  };
  


  if (!docInfo) return <p className="p-4">Loading document...</p>;


  console.log('📄 filePath in docInfo:', docInfo.filePath);

  console.log('📄 Final PDF URL:', `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${docInfo.filePath.replace(/\\/g, '/')}`);
  return (
    <div className="flex min-h-screen">
      {/* PDF LEFT */}
      <div className="w-3/5 p-4 flex flex-col items-center">
        <Document
          file={
             `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${docInfo.filePath.replace(/\\/g, '/')}`}

          onLoadSuccess={handlePDFLoaded}
          
        onLoadError={(err) => console.error('❌ PDF load error:', err)}

        >
          <Page
            pageNumber={1}
            width={600}
            onRenderSuccess={handlePageRenderSuccess}
          />
        </Document>

        {/* Drag Signature */}
        {signature.name && (
          <Draggable
        
            onStop={handleStopDrag}
            disabled={!dragging}
            bounds="parent"
          >
            <div
            ref={canvasRef}
              className="absolute z-50 cursor-move"
              style={{
                fontFamily: signature.font,
                fontSize: signature.fontSize,
                color: '#000',
                background: 'transparent',
                left: 100,
      top: 200,
              }}
            >
              {signature.name}
            </div>
          </Draggable>
        )}
      </div>

      {/* SIGNATURE PANEL RIGHT */}
      <div className="w-2/5 p-6 space-y-4 border-l">
        <h2 className="text-2xl font-bold">Sign Document</h2>

        <div>
          <label className="block font-medium">Full Name</label>
          <input
            type="text"
            className="border p-2 w-full"
            value={signature.name}
            onChange={(e) => setSignature({ ...signature, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium">Font</label>
          <select
            className="border p-2 w-full"
            value={signature.font}
            onChange={(e) => setSignature({ ...signature, font: e.target.value })}
          >
            {fonts.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Font Size</label>
          <input
            type="number"
            min={10}
            max={100}
            className="border p-2 w-full"
            value={signature.fontSize}
            onChange={(e) => setSignature({ ...signature, fontSize: parseInt(e.target.value) })}
          />
        </div>

        <button
          onClick={() => setDragging(!dragging)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {dragging ? 'Dragging Enabled' : 'Enable Drag to Place Signature'}
        </button>

        <button
          onClick={handleConfirm}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Confirm Signature
        </button>
      </div>
    </div>
  );
};

export default SignFromToken;