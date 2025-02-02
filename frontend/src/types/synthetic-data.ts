export interface SyntheticDataRequest {
  template: string;
  model: string;
  batch_size: number;
  additional_instructions?: string;
  force_refresh?: boolean;
}

export interface GenerateSimilarRequest extends SyntheticDataRequest {
  reference_content: string;
}

export interface GeneratedItem {
  content: string;
  score: number;
  index: number;
  timestamp: string;
}

export interface GenerationResponse {
  id: string;
  timestamp: string;
  template: string;
  model: string;
  data: GeneratedItem[];
  generation_time: number;
  is_cached: boolean;
  cached_at?: string;
  reference_content?: string;
}

export interface GenerationRecord extends GenerationResponse {
  id: string;
}

export type GenerationHistoryResponse = GenerationRecord[]; 