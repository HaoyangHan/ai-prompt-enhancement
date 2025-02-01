export interface SyntheticDataRequest {
  template: string;
  model: string;
  batch_size: number;
}

export interface GenerateSimilarRequest extends SyntheticDataRequest {
  reference_content: string;
}

export interface GenerationResponse {
  data: string[];
  generation_time: number;
  is_cached: boolean;
  model: string;
  template?: string;
  reference_content?: string;
}

export interface GenerationRecord {
  id: string;
  timestamp: string;
  template: string;
  model: string;
  data: string[];
  generation_time: number;
  is_cached: boolean;
  reference_content?: string;
}

export type GenerationHistoryResponse = GenerationRecord[]; 