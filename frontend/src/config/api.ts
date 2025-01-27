import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzePrompt = async (prompt: string) => {
  const response = await api.post('/api/v1/prompts/analyze', {
    prompt_text: prompt,
    context: "general",
    preferences: {
      style: "professional",
      tone: "neutral"
    }
  });
  return response.data;
};

export default api; 