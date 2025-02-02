export interface ComparisonMetrics {
  score: number;
  description: string;
  suggestions: string[];
}

export interface PromptVersion {
  prompt: string;
  metrics: Record<string, ComparisonMetrics>;
  suggestions?: string[];
  highlighted_prompt?: string;
}

export interface ComparisonResult {
  original_prompt: PromptVersion;
  enhanced_prompt: PromptVersion;
  model_used: string;
} 