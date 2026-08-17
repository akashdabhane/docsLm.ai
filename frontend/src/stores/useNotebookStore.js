import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export const useNotebookStore = create((set, get) => ({
  notebooks: [],
  currentNotebook: null,
  documents: [],
  conversations: [],
  activeConversationId: null,
  messages: [],
  studioOutputs: [],
  
  // Document Viewer & Citation highlight state
  activeDocumentView: null,
  activeCitation: null,
  
  loadingNotebooks: false,
  loadingDocuments: false,
  loadingMessages: false,

  fetchNotebooks: async () => {
    set({ loadingNotebooks: true });
    try {
      const data = await apiFetch('/api/notebooks');
      set({ notebooks: data, loadingNotebooks: false });
    } catch (err) {
      set({ loadingNotebooks: false });
    }
  },

  createNotebook: async (title, description) => {
    const newNb = await apiFetch('/api/notebooks', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
    set((state) => ({ notebooks: [newNb, ...state.notebooks] }));
    return newNb;
  },

  resetNotebookState: () => {
    set({
      currentNotebook: null,
      documents: [],
      conversations: [],
      activeConversationId: null,
      messages: [],
      studioOutputs: [],
      activeDocumentView: null,
      activeCitation: null,
    });
  },

  fetchNotebookDetails: async (id) => {
    get().resetNotebookState();
    try {
      const nb = await apiFetch(`/api/notebooks/${id}`);
      set({ currentNotebook: nb });
      get().fetchDocuments(id);
      get().fetchConversations(id);
      get().fetchStudioOutputs(id);
    } catch (err) {
      console.error('Error fetching notebook:', err);
    }
  },

  deleteNotebook: async (id) => {
    await apiFetch(`/api/notebooks/${id}`, { method: 'DELETE' });
    set((state) => ({
      notebooks: state.notebooks.filter((n) => n.id !== id),
      currentNotebook: state.currentNotebook?.id === id ? null : state.currentNotebook,
    }));
  },

  fetchDocuments: async (notebookId) => {
    set({ loadingDocuments: true });
    try {
      const docs = await apiFetch(`/api/notebooks/${notebookId}/documents`);
      set({ documents: docs, loadingDocuments: false });
    } catch (err) {
      set({ loadingDocuments: false });
    }
  },

  uploadDocument: async (notebookId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const doc = await apiFetch(`/api/notebooks/${notebookId}/documents`, {
      method: 'POST',
      body: formData,
    });

    set((state) => ({ documents: [doc, ...state.documents] }));
    
    // Poll document status until PROCESSED or FAILED
    get().pollDocumentStatus(doc.id, notebookId);
    return doc;
  },

  pollDocumentStatus: (docId, notebookId) => {
    const interval = setInterval(async () => {
      try {
        const updated = await apiFetch(`/api/documents/${docId}`);
        set((state) => ({
          documents: state.documents.map((d) => (d.id === docId ? updated : d)),
        }));
        if (updated.status === 'PROCESSED' || updated.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 2500);
  },

  deleteDocument: async (docId) => {
    await apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== docId),
      activeDocumentView: state.activeDocumentView?.id === docId ? null : state.activeDocumentView,
    }));
  },

  fetchConversations: async (notebookId) => {
    try {
      const convs = await apiFetch(`/api/notebooks/${notebookId}/conversations`);
      set({ conversations: convs });
      if (convs.length > 0) {
        const firstId = convs[0].id;
        set({ activeConversationId: firstId });
        get().fetchMessages(firstId);
      } else {
        set({ activeConversationId: null, messages: [] });
      }
    } catch (err) {
      console.error(err);
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true, activeConversationId: conversationId });
    try {
      const msgs = await apiFetch(`/api/conversations/${conversationId}/messages`);
      set({ messages: msgs, loadingMessages: false });
    } catch (err) {
      set({ loadingMessages: false });
    }
  },

  fetchStudioOutputs: async (notebookId) => {
    try {
      const outputs = await apiFetch(`/api/notebooks/${notebookId}/studio/outputs`);
      set({ studioOutputs: outputs });
    } catch (err) {
      console.error(err);
    }
  },

  generateMindMap: async (notebookId, customPrompt) => {
    const output = await apiFetch(`/api/notebooks/${notebookId}/studio/mindmap`, {
      method: 'POST',
      body: JSON.stringify({ custom_prompt: customPrompt }),
    });
    set((state) => ({ studioOutputs: [output, ...state.studioOutputs] }));
    return output;
  },

  generateSlides: async (notebookId) => {
    const output = await apiFetch(`/api/notebooks/${notebookId}/studio/slides`, {
      method: 'POST',
    });
    set((state) => ({ studioOutputs: [output, ...state.studioOutputs] }));
    return output;
  },

  generateQuiz: async (notebookId) => {
    const output = await apiFetch(`/api/notebooks/${notebookId}/studio/quiz`, {
      method: 'POST',
    });
    set((state) => ({ studioOutputs: [output, ...state.studioOutputs] }));
    return output;
  },

  generateFlashcards: async (notebookId) => {
    const output = await apiFetch(`/api/notebooks/${notebookId}/studio/flashcards`, {
      method: 'POST',
    });
    set((state) => ({ studioOutputs: [output, ...state.studioOutputs] }));
    return output;
  },

  generatePodcast: async (notebookId, host1, host2) => {
    const output = await apiFetch(`/api/notebooks/${notebookId}/studio/podcast`, {
      method: 'POST',
      body: JSON.stringify({ host1_name: host1, host2_name: host2 }),
    });
    set((state) => ({ studioOutputs: [output, ...state.studioOutputs] }));
    
    // Poll podcast audio status
    get().pollStudioOutputStatus(output.id);
    return output;
  },

  pollStudioOutputStatus: (studioId) => {
    const interval = setInterval(async () => {
      try {
        const updated = await apiFetch(`/api/studio/outputs/${studioId}`);
        set((state) => ({
          studioOutputs: state.studioOutputs.map((s) => (s.id === studioId ? updated : s)),
        }));
        if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 3000);
  },

  openCitation: (citation) => {
    const docs = get().documents;
    const matchedDoc = docs.find((d) => d.id === citation.document_id || d.filename === citation.filename);
    set({
      activeCitation: { ...citation, timestamp: Date.now() },
      activeDocumentView: matchedDoc || {
        filename: citation.filename,
        id: citation.document_id,
        storage_url: citation.storage_url,
        file_type: citation.filename?.endsWith('.pdf') ? 'pdf' : 'pdf',
      },
    });
  },

  setActiveDocumentView: (doc) => set({ activeDocumentView: doc, activeCitation: null }),
  closeDocumentView: () => set({ activeDocumentView: null, activeCitation: null }),
}));
