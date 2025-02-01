import axios from 'axios';
import { 
  SyntheticDataRequest, 
  GenerateSimilarRequest, 
  GenerationResponse, 
  GenerationHistoryResponse 
} from '../types/synthetic-data';

const API_BASE_URL = 'http://localhost:8000/synthetic-data';

export const syntheticDataService = {
  generateData: async (request: SyntheticDataRequest): Promise<GenerationResponse> => {
    const response = await axios.post(`${API_BASE_URL}/generate`, request);
    return response.data;
  },

  generateSimilarData: async (request: GenerateSimilarRequest): Promise<GenerationResponse> => {
    const response = await axios.post(`${API_BASE_URL}/generate-similar`, request);
    return response.data;
  },

  getHistory: async (): Promise<GenerationHistoryResponse> => {
    const response = await axios.get(`${API_BASE_URL}/history`);
    return response.data;
  },

  deleteRecord: async (recordId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/history/${recordId}`);
  },

  clearHistory: async (): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/history`);
  }
}; 