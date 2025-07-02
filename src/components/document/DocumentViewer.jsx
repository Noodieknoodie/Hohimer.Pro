import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import useStore from '../../store';
import { usePaymentFiles } from '../../hooks/useFileData';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentViewer = () => {
  const { 
    documentViewerOpen, 
    setDocumentViewerOpen, 
    selectedDocumentUrl 
  } = useStore();
  
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [scale, setScale] = useState(1.0);
  
  // Extract payment ID from the URL
  const paymentIdMatch = selectedDocumentUrl?.match(/\/payment\/(\d+)/);
  const paymentId = paymentIdMatch ? parseInt(paymentIdMatch[1]) : null;
  
  // Fetch files for the selected payment
  const { 
    data: files = [], 
    isLoading,
    isError
  } = usePaymentFiles(paymentId, { 
    enabled: !!paymentId && documentViewerOpen 
  });
  
  // When files are loaded, select the first file by default
  useEffect(() => {
    if (files.length > 0 && !selectedFileId) {
      setSelectedFileId(files[0].file_id);
      // Reset PDF state when a new file is selected
      setNumPages(null);
      setPageNumber(1);
      setPdfError(false);
    }
  }, [files, selectedFileId]);
  
  // Reset state when document viewer is closed
  useEffect(() => {
    if (!documentViewerOpen) {
      setSelectedFileId(null);
      setNumPages(null);
      setPageNumber(1);
      setPdfError(false);
    }
  }, [documentViewerOpen]);
  
  if (!documentViewerOpen) {
    return null;
  }
  
  const selectedFile = files.find(file => file.file_id === selectedFileId);
  
  // Function to handle PDF document loading
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(false);
  };
  
  // Function to handle PDF document loading errors
  const onDocumentLoadError = (error) => {
    console.error('Error while loading PDF:', error);
    setPdfError(true);
  };
  
  // Navigation functions for multi-page PDFs
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };
  
  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };
  
  // Zoom functions
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };
  
  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
  };
  
  const resetZoom = () => {
    setScale(1.0);
  };
  
  return (
    <div className="w-2/5 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">Document Preview</h2>
        <div className="flex items-center space-x-2">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
            title="Close"
            onClick={() => setDocumentViewerOpen(false)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center p-4 bg-red-50 text-red-700">
            Error loading document. Please try again.
          </div>
        ) : files.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 text-gray-500">
            No documents available for this payment.
          </div>
        ) : (
          <>
            {/* File selector */}
            {files.length > 1 && (
              <div className="flex p-2 border-b border-gray-200 overflow-x-auto">
                {files.map(file => (
                  <button
                    key={file.file_id}
                    className={`px-3 py-1.5 text-sm rounded-md mr-2 whitespace-nowrap ${
                      selectedFileId === file.file_id 
                        ? 'bg-primary-100 text-primary-700 border border-primary-300' 
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedFileId(file.file_id);
                      setPageNumber(1);
                      setNumPages(null);
                      setPdfError(false);
                      setScale(1.0);
                    }}
                  >
                    {file.file_name}
                  </button>
                ))}
              </div>
            )}
            
            {/* Document display area */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              {selectedFile ? (
                <div className="h-full flex flex-col">
                  <div className="bg-gray-50 p-2 rounded-md mb-2 text-sm text-gray-700">
                    <div className="font-medium">{selectedFile.file_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Path: {selectedFile.full_path || selectedFile.onedrive_path}
                    </div>
                  </div>
                  
                  {/* PDF Viewer */}
                  <div className="flex-1 flex flex-col items-center bg-gray-100 rounded-md overflow-hidden">
                    {pdfError ? (
                      <div className="h-full flex items-center justify-center text-center p-4">
                        <div>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="64" 
                            height="64" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="mx-auto mb-4 text-red-400"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <p className="text-red-600 font-medium mb-2">Error loading PDF</p>
                          <p className="text-sm text-gray-500 mb-4">
                            Unable to load the PDF file. Please make sure the file exists and is accessible.
                          </p>
                          <p className="text-xs text-gray-400">
                            File path: {selectedFile.full_path || selectedFile.onedrive_path}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Zoom controls */}
                        <div className="w-full flex justify-center p-2 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={zoomOut}
                              disabled={scale <= 0.6}
                              className={`p-1 rounded ${scale <= 0.6 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-200'}`}
                              title="Zoom out"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                              </svg>
                            </button>
                            <button
                              onClick={resetZoom}
                              className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                              title="Reset zoom"
                            >
                              {Math.round(scale * 100)}%
                            </button>
                            <button
                              onClick={zoomIn}
                              disabled={scale >= 2.5}
                              className={`p-1 rounded ${scale >= 2.5 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-200'}`}
                              title="Zoom in"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1 w-full overflow-auto flex justify-center p-4">
                          <Document
                            file={selectedFile.full_path}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                              <div className="flex items-center justify-center h-full">
                                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                              </div>
                            }
                          >
                            <Page 
                              pageNumber={pageNumber} 
                              scale={scale}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                            />
                          </Document>
                        </div>
                        
                        {/* Page navigation for multi-page PDFs */}
                        {numPages > 1 && (
                          <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between">
                            <button
                              onClick={goToPrevPage}
                              disabled={pageNumber <= 1}
                              className={`p-2 rounded-md ${
                                pageNumber <= 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="20" 
                                height="20" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <polyline points="15 18 9 12 15 6"></polyline>
                              </svg>
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {pageNumber} of {numPages}
                            </span>
                            <button
                              onClick={goToNextPage}
                              disabled={pageNumber >= numPages}
                              className={`p-2 rounded-md ${
                                pageNumber >= numPages
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="20" 
                                height="20" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 rounded-md">
                  <div className="text-center text-gray-500">
                    No file selected
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;