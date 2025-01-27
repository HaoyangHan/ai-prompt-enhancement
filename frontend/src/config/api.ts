import axios from 'axios';

export enum ModelType {
  DEEPSEEK_CHAT = "deepseek-chat",
  DEEPSEEK_REASONER = "deepseek-reasoner"
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://192.168.31.208:8000',  // Use the server's IP address
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false  // Set to false since we're using IP address
});

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
    console.log('Sending request:', {
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