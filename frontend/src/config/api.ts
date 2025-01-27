import axios from 'axios';

export enum ModelType {
  DEEPSEEK_CHAT = "deepseek-chat",
  DEEPSEEK_REASONER = "deepseek-reasoner"
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
    console.log('Analyzing prompt:', {
      prompt_text: prompt,
      context: context || null,
      preferences: {
        style: "professional",
        tone: "neutral",
        model: model
      }
    });
    
    const response = await api.post('/api/v1/prompts/analyze', {
      prompt_text: prompt,
      context: context || null,
      preferences: {
        style: "professional",
        tone: "neutral",
        model: model
      }
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

export default api; 