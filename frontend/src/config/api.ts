import axios from 'axios';

export enum ModelType {
  DEEPSEEK_V3 = "deepseek-v3",
  GPT_4 = "gpt-4",
  CLAUDE_3_SONNET = "claude-3-sonnet"
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PromptPreferences {
  style: string;
  tone: string;
  model: ModelType;
}

export const analyzePrompt = async (
  prompt: string,
  model: ModelType = ModelType.DEEPSEEK_V3,
  context?: string
) => {
  const response = await api.post('/api/v1/prompts/analyze', {
    prompt_text: prompt,
    context: context || undefined,
    preferences: {
      style: "professional",
      tone: "neutral",
      model: model
    }
  });
  return response.data;
};

export default api; 