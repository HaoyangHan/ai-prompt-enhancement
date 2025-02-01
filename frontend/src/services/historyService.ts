import axios from 'axios';
import { AnalysisHistoryItem, ComparisonHistoryItem } from '../types/history';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

class HistoryService {
  async checkBackendHealth(): Promise<boolean> {
    try {
      console.log('Checking backend health...');
      const response = await axios.get(`${API_BASE_URL}/prompts/health`);
      console.log('Backend health response:', response.data);
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Backend health check failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('Config:', {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        });
      }
      return false;
    }
  }

  private async fetchWithRetry<T>(url: string, params?: Record<string, any>, retries = 0): Promise<T> {
    try {
      const response = await axios.get(url, { params });
      console.log(`API Response from ${url}:`, response.data);
      return response.data;
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`Retrying request to ${url} (attempt ${retries + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.fetchWithRetry<T>(url, params, retries + 1);
      }
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error
      const errorMessage = error.response.data?.detail || error.response.data?.message || 'Unknown server error';
      console.error('Server Error:', errorMessage);
      return new Error(`Server error: ${errorMessage}`);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response received');
      return new Error('No response from server. Please check your connection.');
    }
    // Something else went wrong
    console.error('Request Error:', error.message);
    return new Error('Failed to fetch history data.');
  }

  async getAnalysisHistory(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<AnalysisHistoryItem>> {
    try {
      const result = await this.fetchWithRetry<PaginatedResponse<AnalysisHistoryItem>>(
        `${API_BASE_URL}/prompts/history/analysis`,
        { page, page_size: pageSize }
      );

      // Validate response structure
      if (!result || !Array.isArray(result.items)) {
        console.error('Invalid analysis history response:', result);
        throw new Error('Invalid response format from server');
      }

      return {
        items: result.items,
        total: result.total || result.items.length,
        page: result.page || page,
        pageSize: result.pageSize || pageSize
      };
    } catch (error) {
      console.error('Failed to fetch analysis history:', error);
      return {
        items: [],
        total: 0,
        page: page,
        pageSize: pageSize
      };
    }
  }

  async getComparisonHistory(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<ComparisonHistoryItem>> {
    try {
      const result = await this.fetchWithRetry<PaginatedResponse<ComparisonHistoryItem>>(
        `${API_BASE_URL}/prompts/history/comparison`,
        { page, page_size: pageSize }
      );

      // Validate response structure
      if (!result || !Array.isArray(result.items)) {
        console.error('Invalid comparison history response:', result);
        throw new Error('Invalid response format from server');
      }

      return {
        items: result.items,
        total: result.total || result.items.length,
        page: result.page || page,
        pageSize: result.pageSize || pageSize
      };
    } catch (error) {
      console.error('Failed to fetch comparison history:', error);
      return {
        items: [],
        total: 0,
        page: page,
        pageSize: pageSize
      };
    }
  }

  async getHistoryItemDetails(type: 'analysis' | 'comparison', id: string): Promise<AnalysisHistoryItem | ComparisonHistoryItem | null> {
    try {
      const result = await this.fetchWithRetry<AnalysisHistoryItem | ComparisonHistoryItem>(
        `${API_BASE_URL}/prompts/history/${type}/${id}`
      );

      if (!result || !result.id) {
        console.error('Invalid history item details response:', result);
        throw new Error('Invalid response format from server');
      }

      return result;
    } catch (error) {
      console.error(`Failed to fetch ${type} history item details:`, error);
      return null;
    }
  }
}

export const historyService = new HistoryService(); 