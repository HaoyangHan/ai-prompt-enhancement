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

export const getAnalysisHistory = async () => {
  try {
    const response = await api.get('/api/v1/prompts/history/analysis');
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

export const getComparisonHistory = async () => {
  try {
    const response = await api.get('/api/v1/prompts/history/comparison');
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