import { create } from 'zustand';
/**
 * Central application state store using Zustand
 */
const useStore = create((set) => ({
  selectedClientId: null,
  setSelectedClientId: (clientId) => set({ selectedClientId: clientId }),
  documentViewerOpen: false,
  setDocumentViewerOpen: (isOpen) => set({ documentViewerOpen: isOpen }),
  selectedDocumentUrl: null,
  setSelectedDocumentUrl: (url) => set({ selectedDocumentUrl: url }),
  isMobileMenuOpen: false,
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  modalOpen: false,
  modalContent: null,
  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),
}));
export default useStore;
