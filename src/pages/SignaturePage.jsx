import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { postSignature } from '../utils/api';
import '../index.css';
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// If you want to use unpkg CDN worker (works in many setups):
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// If you prefer Vite local worker (recommended), replace above with:
// import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
// pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const fonts = [
  'Pacifico', 'Roboto', 'Dancing Script', 'Indie Flower', 'Lora', 'Playfair Display',
  'Quicksand', 'Orbitron', 'Caveat', 'Zeyada', 'Great Vibes', 'Raleway',
  'Anton', 'Fira Sans', 'Ubuntu', 'Shadows Into Light', 'Kalam', 'Nunito',
  'Comfortaa', 'Signika'
];

export default function SignaturePage() {
  const { id } = useParams();
  const [fileUrl, setFileUrl] = useState('');
  const [pageWidth] = useState(600);
  const [signature, setSignature] = useState(null);
  const [name, setName] = useState('');
  const [font, setFont] = useState(fonts[0]);
  const [showToolbar, setShowToolbar] = useState(false);
  const dragRef = useRef(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [signedFileName, setSignedFileName] = useState('');
  const [isSignaturePlaced, setIsSignaturePlaced] = useState(false);
  const [placedCoords, setPlacedCoords] = useState(null);
  const [pdfDims, setPdfDims] = useState({ width: 842, height: 595 }); // fallback
  const [fontSize, setFontSize] = useState(24);
  const draggingState = useRef({ 
    active: false, 
    startX: 0, 
    startY: 0, 
    elStartLeft: 0, 
    elStartTop: 0 
  });

  const handleDocumentLoadSuccess = (pdf) => {
    console.log('✅ PDF Loaded:', pdf);
    setNumPages(pdf.numPages);

    // Get dimensions of first page
    pdf.getPage(1).then((page) => {
      const [x0, y0, x1, y1] = page.view;
      const width = x1 - x0;
      const height = y1 - y0;
      console.log('📐 PDF actual size:', width, height);
      setPdfDims({ width, height });
    });
  };

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/docs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const cleanPath = data.filePath.replace(/\\/g, '/');
        const backendBase = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
        const fullUrl = `${backendBase}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
        setFileUrl(fullUrl);
      } catch (err) {
        console.error('Failed to fetch PDF:', err);
      }
    };
    fetchDocument();
  }, [id]);

  const handlePlaceSignature = () => {
    if (!name.trim()) return alert('Please enter your full name');
    if (isSignaturePlaced) return alert('Signature already placed');

    const initialsAuto = name.trim().split(' ').map(word => word[0]).join('').toUpperCase();
    const newSig = { name, initials: initialsAuto, font, fontSize };
    setSignature(newSig);
    setIsSignaturePlaced(true);

    // reset placed coords so element appears at top-left of parent initially
    setPlacedCoords({ x: 10, y: 10 });
    // set actual element position via style on render
  };

  // This is your existing coordinate conversion function - we will call it on drag end
  const handleStopDrag = (e) => {
    // Use the page canvas as reference
    const canvas = document.querySelector('.react-pdf__Page canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const renderedWidth = canvasRect.width;
    const renderedHeight = canvasRect.height;

    // page space -> pdf space scales
    const scaleX = pdfDims.width / renderedWidth;
    const scaleY = pdfDims.height / renderedHeight;

    const clientX = (e?.clientX ?? e?.changedTouches?.[0]?.clientX);
    const clientY = (e?.clientY ?? e?.changedTouches?.[0]?.clientY);

    if (typeof clientX !== 'number' || typeof clientY !== 'number') {
      alert("⚠️ Could not get pointer position properly.");
      return;
    }

    const relativeX = (clientX - canvasRect.left) * scaleX;
    const relativeY = (clientY - canvasRect.top) * scaleY;

    const finalX = Math.round(Math.max(0, Math.min(pdfDims.width, relativeX)));
    const finalY = Math.round(Math.max(0, Math.min(pdfDims.height, pdfDims.height - relativeY - fontSize)));

    console.log('📱 Drag Final Coords:', { finalX, finalY });

    setPlacedCoords({ x: finalX, y: finalY });
  };

  // Mouse/touch draggable handlers (manual)
  const onDragStart = (clientX, clientY) => {
    const el = dragRef.current;
    const parent = containerRef.current;
    if (!el || !parent) return;

    draggingState.current.active = true;
    draggingState.current.startX = clientX;
    draggingState.current.startY = clientY;
    draggingState.current.elStartLeft = el.offsetLeft;
    draggingState.current.elStartTop = el.offsetTop;
    // prevent text selection
    document.body.style.userSelect = 'none';
  };

  const onDragMove = (clientX, clientY) => {
    if (!draggingState.current.active) return;
    const el = dragRef.current;
    const parent = containerRef.current;
    if (!el || !parent) return;

    const dx = clientX - draggingState.current.startX;
    const dy = clientY - draggingState.current.startY;

    let newLeft = draggingState.current.elStartLeft + dx;
    let newTop = draggingState.current.elStartTop + dy;

    // keep inside parent bounds
    newLeft = Math.max(0, Math.min(parent.clientWidth - el.offsetWidth, newLeft));
    newTop = Math.max(0, Math.min(parent.clientHeight - el.offsetHeight, newTop));

    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  };

  const onDragEnd = (nativeEvent) => {
    if (!draggingState.current.active) return;
    draggingState.current.active = false;
    document.body.style.userSelect = '';

    // call your existing conversion using the native event (mouse or touch)
    handleStopDrag(nativeEvent);
  };

  // Attach global listeners for mouse/touch move and end while dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      onDragMove(e.clientX, e.clientY);
    };
    const handleMouseUp = (e) => {
      onDragEnd(e);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) onDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleTouchEnd = (e) => {
      onDragEnd(e);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    // add/remove handled when a drag starts to limit listeners. We'll rely on the start code to add listeners.
    // but to be safe in dev hot-reload, we return cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Start drag on pointer down (mouse) or touchstart
  const startPointerDrag = (e) => {
  e.preventDefault();
  const isTouch = !!e.touches;
  const clientX = isTouch ? e.touches[0].clientX : e.clientX;
  const clientY = isTouch ? e.touches[0].clientY : e.clientY;

  const rect = dragRef.current.getBoundingClientRect();
  const containerRect = containerRef.current.getBoundingClientRect();

  // offset from where you clicked inside the signature
  const offsetX = clientX - rect.left;
  const offsetY = clientY - rect.top;

  const onMove = (ev) => {
    const moveX = (ev.touches ? ev.touches[0].clientX : ev.clientX) - containerRect.left - offsetX;
    const moveY = (ev.touches ? ev.touches[0].clientY : ev.clientY) - containerRect.top - offsetY;

    // keep inside container bounds
    const clampedX = Math.max(0, Math.min(containerRect.width - rect.width, moveX));
    const clampedY = Math.max(0, Math.min(containerRect.height - rect.height, moveY));

    dragRef.current.style.left = `${clampedX}px`;
    dragRef.current.style.top = `${clampedY}px`;
  };

  const onEnd = (ev) => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onEnd);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);

    const finalX = parseFloat(dragRef.current.style.left);
    const finalY = parseFloat(dragRef.current.style.top);
    setPlacedCoords({ x: finalX, y: finalY });
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onEnd);
};

  // const startPointerDrag = (e) => {
  //   const isTouch = !!e.touches;
  //   const clientX = isTouch ? e.touches[0].clientX : e.clientX;
  //   const clientY = isTouch ? e.touches[0].clientY : e.clientY;
  //   onDragStart(clientX, clientY);

  //   // attach move/up listeners for this drag operation
  //   const handleMouseMove = (ev) => onDragMove(ev.clientX, ev.clientY);
  //   const handleMouseUp = (ev) => {
  //     onDragEnd(ev);
  //     window.removeEventListener('mousemove', handleMouseMove);
  //     window.removeEventListener('mouseup', handleMouseUp);
  //   };
  //   const handleTouchMove = (ev) => {
  //     if (ev.touches && ev.touches[0]) onDragMove(ev.touches[0].clientX, ev.touches[0].clientY);
  //   };
  //   const handleTouchEnd = (ev) => {
  //     onDragEnd(ev);
  //     window.removeEventListener('touchmove', handleTouchMove);
  //     window.removeEventListener('touchend', handleTouchEnd);
  //   };

  //   window.addEventListener('mousemove', handleMouseMove);
  //   window.addEventListener('mouseup', handleMouseUp);
  //   window.addEventListener('touchmove', handleTouchMove, { passive: false });
  //   window.addEventListener('touchend', handleTouchEnd);
  // };

  const handleConfirmSignature = async () => {
    if (!signature) {
    alert("❌ Please create and place your signature first.");
    return;
    }

    if (!placedCoords || placedCoords.x == null || placedCoords.y == null) {
      alert('❌ Please drag and place your signature before confirming.');
      return;
    }

    try {
      console.log('📤 Sending postSignature payload:', {
        documentId: id,
        x: placedCoords.x,
        y: placedCoords.y,
        page: currentPage,
        name: signature?.name,
        font: signature?.font,
        fontSize: signature?.fontSize,
      });

      await postSignature({
        documentId: id,
        x: placedCoords.x,
        y: placedCoords.y,
        page: currentPage,
        name: signature.name,
        font: signature.font,
        fontSize: signature.fontSize ?? 24,
      });

      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/signatures/apply/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const signedData = await res.json();
      const backendBase = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
      setFileUrl(`${backendBase}${signedData.url}`);

      setSignedFileName(signedData.fileName);
      setShowToolbar(true);
      // setSignature(null);
      // setIsSignaturePlaced(false);
      setTimeout(() => {
      setSignature(null);
      setIsSignaturePlaced(false);
      }, 500);
      
    } catch (err) {
      console.error('❌ Error applying signature:', err);
      alert('Failed to apply signature');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = signedFileName || 'signed-document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (type) => {
    const shareUrl = fileUrl;
    const encoded = encodeURIComponent(shareUrl);
    if (type === 'gmail') {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=&su=Signed Document&body=${encoded}`, '_blank');
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=Here is the signed PDF: ${encoded}`, '_blank');
    } else if (type === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank');
    } else if (type === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encoded}&text=Signed PDF`, '_blank');
    } else if (type === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center p-4 grid grid-cols-1 md:grid-cols-2 gap-6"
      style={{ backgroundImage: "url('/signature-bg.jpg')" }}
    >
      <div className="relative border bg-gray-100 p-2 w-full" ref={containerRef} style={{position: "relative"}}>
        <Document
          file={fileUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={(e) => console.error('PDF load error:', e)}
        >
          <Page pageNumber={currentPage} width={window.innerWidth < 768 ? window.innerWidth - 40 : 600} />
        </Document>

        <div className="mt-4 flex gap-4 items-center justify-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="bg-gray-300 px-4 py-1 rounded disabled:opacity-50"
          >
            ⬅ Prev
          </button>

          <span className="text-sm font-medium">
            Page {currentPage} of {numPages || '?'}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))}
            disabled={currentPage === numPages}
            className="bg-gray-300 px-4 py-1 rounded disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>

        {signature && (
          <div
            ref={dragRef}
            className={`absolute bg-transparent px-0 py-0 cursor-move text-2xl ${signature.font.replace(/ /g, '-').toLowerCase()}`}
            style={{
              position: "absolute",
              top: placedCoords ? `${placedCoords.y}px` : "50px",
              left: placedCoords ? `${placedCoords.x}px` : "50px",
              fontSize: signature.fontSize || 24,
              background: "transparent",
              cursor: "grab",
              userSelect: "none",
              touchAction: "none",
              zIndex: 1000,
              // pointerEvents: 'auto',
              // top: placedCoords ? `${(placedCoords.y / pdfDims.height) * (containerRef.current ? containerRef.current.clientHeight : 0)}px` : '10px',
              // left: placedCoords ? `${(placedCoords.x / pdfDims.width) * (containerRef.current ? containerRef.current.clientWidth : 0)}px` : '10px',
              // fontSize: signature.fontSize || 24,
              // position: 'absolute',
              // userSelect: 'none',
              // touchAction: 'none'
            }}
            onMouseDown={(e) =>{
              e.preventDefault();
              startPointerDrag(e);
              dragRef.current.style.cursor = 'grabbing';
            }}
              
            onTouchStart={(e) => {
              e.preventDefault();
              startPointerDrag(e);
              dragRef.current.style.cursor = 'grabbing'
            }}
            onMouseUp={() => {
              dragRef.current.style.cursor = 'grab'
            }}
            onTouchEnd={() => {
              dragRef.current.style.cursor = 'grab'
            }}
          >
            {signature.name}
          </div>
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-md p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-blue-700">Signature Setup</h2>
        <label className="block mb-2 font-medium">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded mb-4"
          placeholder="Your name"
        />
        <label className="block mb-2 font-medium">Choose Font</label>
        <select value={font} onChange={(e) => setFont(e.target.value)} className="w-full border p-2 rounded mb-4">
          {fonts.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <label className="block mb-2 font-medium">Font Size</label>
        <input
          type="number"
          value={fontSize}
          onChange={(e) => { setFontSize(Number(e.target.value)); if (signature) setSignature({ ...signature, fontSize: Number(e.target.value) }); }}
          className="w-full border p-2 rounded mb-4"
          min={8}
          max={100}
        />

        <div className="mb-4">
          <label className="block mb-1 font-medium">Preview:</label>
          <div className={`text-2xl p-2 border rounded shadow ${font.replace(/ /g, '-').toLowerCase()}`}>{name || 'Your Signature'}</div>
        </div>

        <button
          onClick={handlePlaceSignature}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Place Signature
        </button>

        <div>
          <button onClick={handleConfirmSignature} className=" w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded">Confirm Signature</button>
        </div>

        {showToolbar && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={handleDownload} className=" w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Download Signed PDF
            </button>
            <button onClick={() => handleShare('gmail')} className=" w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Share via Gmail
            </button>
            <button onClick={() => handleShare('whatsapp')} className=" w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Share via WhatsApp
            </button>
            <button onClick={() => handleShare('facebook')} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Facebook
            </button>
            <button onClick={() => handleShare('twitter')} className="w-full bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600">
              Twitter / X
            </button>
            <button onClick={() => handleShare('copy')} className="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// import { useEffect, useState, useRef } from 'react';
// import { useParams } from 'react-router-dom';
// import { Document, Page, pdfjs } from 'react-pdf';
// import Draggable from 'react-draggable';
// import { postSignature } from '../utils/api';
// import '../index.css';
// import "react-pdf/dist/Page/AnnotationLayer.css";
// import "react-pdf/dist/Page/TextLayer.css";

// // pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// pdfjs.GlobalWorkerOptions.workerSrc =
//   `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// const fonts = [
//   'Pacifico', 'Roboto', 'Dancing Script', 'Indie Flower', 'Lora', 'Playfair Display',
//   'Quicksand', 'Orbitron', 'Caveat', 'Zeyada', 'Great Vibes', 'Raleway',
//   'Anton', 'Fira Sans', 'Ubuntu', 'Shadows Into Light', 'Kalam', 'Nunito',
//   'Comfortaa', 'Signika'
// ];

// export default function SignaturePage() {
//   const { id } = useParams();
//   const [fileUrl, setFileUrl] = useState('');
//   const [pageWidth] = useState(600);
//   const [signature, setSignature] = useState(null);
//   const [name, setName] = useState('');
//   const [initials, setInitials] = useState('');
//   const [font, setFont] = useState(fonts[0]);
//   const [showToolbar, setShowToolbar] = useState(false);
//   const dragRef = useRef(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [numPages, setNumPages] = useState(null);
//   const [signedFileName, setSignedFileName] = useState('');
//   const [isSignaturePlaced, setIsSignaturePlaced] = useState(false);
//   const [placedCoords, setPlacedCoords] = useState(null);
//    const [pdfDims, setPdfDims] = useState({ width: 842, height: 595 }); // default fallback
// const [fontSize, setFontSize] = useState(24); // default size
// const [dragging, setDragging] = useState(true); // default is now true ✅

// const handleDocumentLoadSuccess = (pdf) => {
//   console.log('✅ PDF Loaded:', pdf);
//   setNumPages(pdf.numPages);

//   // Get dimensions of first page
//   pdf.getPage(1).then((page) => {
//     const [x0, y0, x1, y1] = page.view;
//     const width = x1 - x0;
//     const height = y1 - y0;
//     console.log('📐 PDF actual size:', width, height);
//     setPdfDims({ width, height });
//   });
// };

// useEffect(() => {
//     const fetchDocument = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/docs/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         const cleanPath = data.filePath.replace(/\\/g, '/');
//         const backendBase = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
//         const fullUrl = `${backendBase}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
//         setFileUrl(fullUrl);

//         setFileUrl(fullUrl);
//       } catch (err) {
//         console.error('Failed to fetch PDF:', err);
//       }
//     };
//     fetchDocument();
// }, [id]);

//   const handlePlaceSignature = () => {
//     if (!name.trim()) return alert('Please enter your full name');
//     if (isSignaturePlaced) return alert('Signature already placed');

//     const initialsAuto = name.trim().split(' ').map(word => word[0]).join('').toUpperCase();
//     const newSig = { name, initials: initialsAuto, font, fontSize };
//    // console.log('🔥 Setting signature to:', newSig);
//     setSignature(newSig);
//     setIsSignaturePlaced(true);
//     //setInitials(initialsAuto);
//     setPlacedCoords({x:10, y:10});
//     //setSignature({ name, initials: initialsAuto, font });
    

//   };

// const handleStopDrag = (e, data) => {
//   const canvas = document.querySelector('.react-pdf__Page canvas');
//   if (!canvas) return;

//   const canvasRect = canvas.getBoundingClientRect();
//   const renderedWidth = canvasRect.width;
//   const renderedHeight = canvasRect.height;

//   const scaleX = pdfDims.width / renderedWidth;
//   const scaleY = pdfDims.height / renderedHeight;

//   const clientX = e?.clientX ?? e?.changedTouches?.[0]?.clientX;
//   const clientY = e?.clientY ?? e?.changedTouches?.[0]?.clientY;

//   if (typeof clientX !== 'number' || typeof clientY !== 'number') {
//     alert("⚠️ Could not get pointer position properly.");
//     return;
//   }

//   const relativeX = (clientX - canvasRect.left) * scaleX;
//   const relativeY = (clientY - canvasRect.top) * scaleY;

//   const finalX = Math.round(Math.max(0, Math.min(pdfDims.width, relativeX)));
//   const finalY = Math.round(Math.max(0, Math.min(pdfDims.height, pdfDims.height - relativeY - fontSize)));

//   console.log('📱 Mobile Drag Final Coords:', { finalX, finalY });

//   setPlacedCoords({ x: finalX, y: finalY });
// };

// const handleConfirmSignature = async () => {
//  if (!placedCoords || placedCoords.x == null || placedCoords.y == null) {
//     alert('❌ Please drag and place your signature before confirming.');
//     return;
//   }
 
//     try {
    

// console.log('📤 Sending postSignature payload:', {
//   documentId: id,
//   x: placedCoords.x,
//   y: placedCoords.y,
//   page: currentPage,
//   name: signature?.name,
//   font: signature?.font,
//   fontSize: signature?.fontSize,
// });



//     await postSignature({
//       documentId: id,
//       x: placedCoords.x,
//       y: placedCoords.y,
//       page: currentPage,
//       name: signature.name,
//       font: signature.font,
//       fontSize:signature.fontSize  ?? 24,
//     });

//     const token = localStorage.getItem('token');
//     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/signatures/apply/${id}`, {
//   headers: { Authorization: `Bearer ${token}` },
// });
// const signedData = await res.json();
// const backendBase = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
// setFileUrl(`${backendBase}${signedData.url}`);

//     setSignedFileName(signedData.fileName);
//     setShowToolbar(true);
//     setSignature(null);
// setIsSignaturePlaced(false);

//   } catch (err) {
//     console.error('❌ Error applying signature:', err);
//     alert('Failed to apply signature');
//   }
// };

//   const handleDownload = () => {
//     const link = document.createElement('a');
//     link.href = fileUrl;
//     link.download = signedFileName || 'signed-document.pdf';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const handleShare = (type) => {
//     const shareUrl = fileUrl;
//     const encoded = encodeURIComponent(shareUrl);
//     if (type === 'gmail') {
//       window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=&su=Signed Document&body=${encoded}`, '_blank');
//     } else if (type === 'whatsapp') {
//       window.open(`https://wa.me/?text=Here is the signed PDF: ${encoded}`, '_blank');
//     } else if (type === 'facebook') {
//       window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank');
//     } else if (type === 'twitter') {
//       window.open(`https://twitter.com/intent/tweet?url=${encoded}&text=Signed PDF`, '_blank');
//     } else if (type === 'copy') {
//       navigator.clipboard.writeText(shareUrl);
//       alert('Link copied to clipboard!');
//     }
//   };

//   return (
    
//   <div
//     className="min-h-screen bg-cover bg-center p-4 grid grid-cols-1 md:grid-cols-2 gap-6"
//     style={{ backgroundImage: "url('/signature-bg.jpg')" }}
//   >

//       <div className="relative border bg-gray-100 p-2 w-full">
//         <Document
//           file={fileUrl}
//           onLoadSuccess={handleDocumentLoadSuccess}
//           onLoadError={(e) => console.error('PDF load error:', e)}
//         >
//           <Page pageNumber={currentPage} width={window.innerWidth < 768 ? window.innerWidth - 40 : 600} />
//         </Document>

//         <div className="mt-4 flex gap-4 items-center justify-center">
//           <button
//             onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
//             disabled={currentPage === 1}
//             className="bg-gray-300 px-4 py-1 rounded disabled:opacity-50"
//           >
//             ⬅ Prev
//           </button>

//           <span className="text-sm font-medium">
//             Page {currentPage} of {numPages || '?'}
//           </span>

//           <button
//             onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))}
//             disabled={currentPage === numPages}
//             className="bg-gray-300 px-4 py-1 rounded disabled:opacity-50"
//           >
//             Next ➡
//           </button>
//         </div>

//         {signature && (
//           <Draggable bounds="parent" onStop={handleStopDrag}>
//   <div
//     className={`absolute bg-transparent px-0 py-0 cursor-move text-2xl ${signature.font.replace(/ /g, '-').toLowerCase()}`}
//     style={{
//       pointerEvents: 'auto',
//       top: 0,
//       left: 0,
//       fontSize: signature.fontSize || 24,
//     }}
//   >
//     {signature.name}
//   </div>
// </Draggable>

//         )}
//       </div>

//       <div className="bg-white/60 backdrop-blur-md p-6 rounded-lg shadow-lg max-w-md w-full">
//         <h2 className="text-xl font-bold mb-4 text-blue-700">Signature Setup</h2>
//         <label className="block mb-2 font-medium">Full Name</label>
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="w-full border p-2 rounded mb-4"
//           placeholder="Your name"
//         />
//         <label className="block mb-2 font-medium">Choose Font</label>
//         <select value={font} onChange={(e) => setFont(e.target.value)} className="w-full border p-2 rounded mb-4">
//           {fonts.map((f) => (
//             <option key={f} value={f}>{f}</option>
//           ))}
//         </select>
// <label className="block mb-2 font-medium">Font Size</label>
// <input
//   type="number"
//   value={fontSize}
//   onChange={(e) => setFontSize(Number(e.target.value))}
//   className="w-full border p-2 rounded mb-4"
//   min={8}
//   max={100}
// />


//         <div className="mb-4">
//           <label className="block mb-1 font-medium">Preview:</label>
//           <div className={`text-2xl p-2 border rounded shadow ${font.replace(/ /g, '-').toLowerCase()}`}>{name || 'Your Signature'}</div>
//         </div>
//         <button
//           onClick={handlePlaceSignature}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
//         >
//           Place Signature
//         </button>
//            <div>
      
     
//         <button onClick={handleConfirmSignature} className=" w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded">Confirm Signature</button>
      
//     </div>


//         {showToolbar && (
//           <div className="mt-6 flex flex-wrap gap-3">
//             <button onClick={handleDownload} className=" w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
//               Download Signed PDF
//             </button>
//             <button onClick={() => handleShare('gmail')} className=" w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
//               Share via Gmail
//             </button>
//             <button onClick={() => handleShare('whatsapp')} className=" w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
//               Share via WhatsApp
//             </button>
//             <button onClick={() => handleShare('facebook')} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
//               Facebook
//             </button>
//             <button onClick={() => handleShare('twitter')} className="w-full bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600">
//               Twitter / X
//             </button>
//             <button onClick={() => handleShare('copy')} className="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
//               Copy Link
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }