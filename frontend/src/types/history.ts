export interface BaseHistoryItem {
  id: string;
  timestamp: string;
  model_used: string;
}

export interface AnalysisHistoryItem extends BaseHistoryItem {
  original_prompt: string;
  enhanced_prompt: string;
  overall_score: number;
  metrics: {
    clarity: {
      score: number;
      description: string;
      suggestions: string[];
    };
    [key: string]: {
      score: number;
      description: string;
      suggestions: string[];
    };
  };
  suggestions: string[];
}

export interface ComparisonHistoryItem extends BaseHistoryItem {
  original_prompt: string;
  enhanced_prompt: string;
  comparison_metrics: {
    improvement_score: number;
    key_differences: string[];
    strengths: string[];
    weaknesses: string[];
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HistoryState {
  analysisHistory: PaginatedResponse<AnalysisHistoryItem>;
  comparisonHistory: PaginatedResponse<ComparisonHistoryItem>;
  isLoading: boolean;
  error: string | null;
  selectedItem: AnalysisHistoryItem | ComparisonHistoryItem | null;
} 