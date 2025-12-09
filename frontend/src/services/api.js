import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

export const documentService = {
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/documents`);
    return response.data.documents;
  },

  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  download: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/documents/${id}`);
    return response.data;
  }
};

