import axios from 'axios';

export enum ModelType {
  DEEPSEEK_CHAT = "deepseek-chat",
  DEEPSEEK_REASONER = "deepseek-reasoner",
  OPENAI_GPT4 = "gpt-4o-mini",
  OPENAI_GPT35 = "gpt-3.5-turbo"
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',  // Changed to localhost for local development
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Request:', {
    url: request.url,
    method: request.method,
    data: request.data,
    headers: request.headers
  });
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', response.data);
    return response;
  },
  error => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
);

export interface PromptPreferences {
  style: string;
  tone: string;
  model: ModelType;
}

export const analyzePrompt = async (
  prompt: string,
  model: ModelType = ModelType.DEEPSEEK_CHAT,
  context?: string
) => {
  try {
    // Clean and format the prompt string
    const cleanPrompt = prompt
      .trim()
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/[\n\r]/g, ' '); // Replace newlines with spaces

    // Send the request with proper JSON structure
    const response = await api.post('/api/v1/prompts/analyze', {
      prompt_text: cleanPrompt,
      preferences: {
        model: model,
        style: "professional",
        tone: "neutral"
      },
      context: context
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    throw error;
  }
};

export const comparePrompts = async (analysisResult: any) => {
  try {
    // Structure the request according to the backend's expectations
    const requestData = {
      original_prompt: analysisResult.original_prompt || "",
      enhanced_prompt: analysisResult.enhanced_prompt || "",
      context: {
        model: ModelType.DEEPSEEK_CHAT,
        style: "professional",
        tone: "neutral"
      }
    };
    
    // Log the formatted request data
    console.log('Formatted request data:', JSON.stringify(requestData, null, 2));
    
    const response = await api.post('/api/v1/prompts/refinement/compare', requestData);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    throw error;
  }
};

interface SyntheticDataResult {
  content: string;
  score: number;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'synthetic' | 'comparison' | 'similar';
  model: string;
  template?: string;
  instructions?: string | null;
  batch_size?: number;
  results: SyntheticDataResult[];
  generation_time: number;
  is_cached?: boolean;
  cached_at?: string | null;
  statistics: {
    average_score: number;
    min_score: number;
    max_score: number;
  };
  reference_content?: string | null;
  prompts?: string[];
  raw_responses?: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

interface ApiError {
  type: string;
  loc: string[];
  msg: string;
  input: any;
  url?: string;
}

function isHistoryItem(item: any): item is HistoryItem {
  return item && 
    typeof item.id === 'string' && 
    typeof item.timestamp === 'string' && 
    typeof item.type === 'string' &&
    Array.isArray(item.results);
}

function isHistoryItemArray(data: unknown): data is HistoryItem[] {
  return Array.isArray(data) && data.length >= 0 && (data.length === 0 || isHistoryItem(data[0]));
}

function isPaginatedResponse(data: unknown): data is PaginatedResponse<HistoryItem> {
  return Boolean(
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as any).data) &&
    ((data as any).data.length === 0 || isHistoryItem((data as any).data[0]))
  );
}

interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const getAnalysisHistory = async (page: number = 1, pageSize: number = 10): Promise<HistoryResponse> => {
  try {
    const response = await api.get<PaginatedResponse<HistoryItem> | HistoryItem[]>('/api/v1/prompts/analysis/history', {
      params: {
        page,
        page_size: pageSize
      }
    });
    
    const responseData = response.data;
    
    // If we have a proper paginated response
    if ('data' in responseData && Array.isArray(responseData.data)) {
      const items = responseData.data;
      return {
        items,
        total: responseData.total,
        page: responseData.page,
        pageSize: responseData.page_size
      };
    }
    
    // Fallback: if response is an array directly
    if (Array.isArray(responseData)) {
      return {
        items: responseData,
        total: responseData.length,
        page: 1,
        pageSize: responseData.length
      };
    }
    
    // Return empty result if no valid data
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: pageSize
    };
  } catch (error) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      const apiError = error.response.data as ApiError;
      console.error('API Error Details:', {
        type: apiError.type,
        message: apiError.msg,
        location: apiError.loc
      });
    }
    // Return empty result on error
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: pageSize
    };
  }
};

export const getComparisonHistory = async (page: number = 1, pageSize: number = 10): Promise<HistoryResponse> => {
  try {
    const response = await api.get<PaginatedResponse<HistoryItem> | HistoryItem[]>('/api/v1/prompts/comparison/history', {
      params: {
        page,
        page_size: pageSize
      }
    });
    
    const responseData = response.data;
    
    // If we have a proper paginated response
    if ('data' in responseData && Array.isArray(responseData.data)) {
      const items = responseData.data;
      return {
        items,
        total: responseData.total,
        page: responseData.page,
        pageSize: responseData.page_size
      };
    }
    
    // Fallback: if response is an array directly
    if (Array.isArray(responseData)) {
      return {
        items: responseData,
        total: responseData.length,
        page: 1,
        pageSize: responseData.length
      };
    }
    
    // Return empty result if no valid data
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: pageSize
    };
  } catch (error) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      const apiError = error.response.data as ApiError;
      console.error('API Error Details:', {
        type: apiError.type,
        message: apiError.msg,
        location: apiError.loc
      });
    }
    // Return empty result on error
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: pageSize
    };
  }
};

export default api; 