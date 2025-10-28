const PDFPreview = ({ fileUrl }) => (
  <div className="mt-3 border p-2 bg-white shadow rounded">
    <iframe
      src={fileUrl}
      title="PDF Preview"
      width="100%"
      height="600px"
      className="rounded border"
      
    />
  </div>
);

export default PDFPreview;