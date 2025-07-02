import React from 'react';
import useStore from '../../store';

const DocumentViewer = () => {
  const { 
    documentViewerOpen, 
    setDocumentViewerOpen
  } = useStore();
  
  if (!documentViewerOpen) {
    return null;
  }
  
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
      
      <div className="flex-grow flex flex-col overflow-hidden relative">
        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 bg-white bg-opacity-95 z-10 flex items-center justify-center">
          <div className="text-center p-8">
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
              className="mx-auto mb-4 text-primary-400"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Document Viewer Coming Soon</h3>
            <p className="text-gray-600 mb-4">We're working on integrating document viewing functionality.</p>
            <p className="text-sm text-gray-500">This feature will allow you to view payment documentation directly within the application.</p>
          </div>
        </div>
        
        {/* UI Shell (visible but not functional) */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col opacity-50">
          <div className="h-full flex flex-col">
            <div className="bg-gray-50 p-2 rounded-md mb-2 text-sm text-gray-700">
              <div className="font-medium">Sample Document.pdf</div>
              <div className="text-xs text-gray-500 mt-1">
                Path: /documents/payments/sample.pdf
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center bg-gray-100 rounded-md overflow-hidden">
              <div className="w-full flex justify-center p-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <button className="p-1 rounded text-gray-300" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                  </button>
                  <button className="px-2 py-1 text-xs bg-gray-200 rounded text-gray-700" disabled>
                    100%
                  </button>
                  <button className="p-1 rounded text-gray-300" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="11" y1="8" x2="11" y2="14"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 w-full flex items-center justify-center p-4">
                <div className="w-96 h-96 bg-white shadow-lg rounded-md border border-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;