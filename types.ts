export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isComplete: boolean;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    mimeType: string;
  };
  groundingUrls?: Array<{ title: string; uri: string }>;
}

export interface AudioConfig {
  sampleRate: number;
}
