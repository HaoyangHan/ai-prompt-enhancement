import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAnalysisHistory = async () => {
  try {
    const response = await api.get('/api/v1/synthetic-data/history');
    return response.data;
  } catch (error: unknown) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    throw error;
  }
};

export const getComparisonHistory = async () => {
  try {
    const response = await api.get('/api/v1/synthetic-data/history');
    return response.data;
  } catch (error: unknown) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    throw error;
  }
};

export default api; 