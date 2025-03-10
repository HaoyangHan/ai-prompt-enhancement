import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export enum ModelType {
  DEEPSEEK_CHAT = 'deepseek-chat',
  GPT_4 = 'gpt-4',
  STELLAR_CHAT = 'stellar-chat'
}

export interface PromptAnalysisRequest {
  prompt: string;
  model?: string;
}

export interface PromptEnhancementRequest {
  prompt: string;
  instruction?: string;
  model?: string;
}

export interface PromptComparisonRequest {
  original_prompt: string;
  enhanced_prompt: string;
  model?: string;
}

export const analyzePrompt = async (request: PromptAnalysisRequest, modelType: ModelType = ModelType.STELLAR_CHAT) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/prompt-enhancement/analyze?model_type=${modelType}`, request);
    return response.data;
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    throw error;
  }
};

export const enhancePrompt = async (request: PromptEnhancementRequest, modelType: ModelType = ModelType.STELLAR_CHAT) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/prompt-enhancement/enhance?model_type=${modelType}`, request);
    return response.data;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    throw error;
  }
};

export const comparePrompts = async (request: PromptComparisonRequest, modelType: ModelType = ModelType.STELLAR_CHAT) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/prompt-enhancement/compare?model_type=${modelType}`, request);
    return response.data;
  } catch (error) {
    console.error('Error comparing prompts:', error);
    throw error;
  }
};

export const getAnalysisHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/prompt-enhancement/analysis-history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
};

export const getComparisonHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/prompt-enhancement/comparison-history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comparison history:', error);
    throw error;
  }
};

export default axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
}); 