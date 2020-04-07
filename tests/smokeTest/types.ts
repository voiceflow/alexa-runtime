export interface SessionRecording {
  skillId: string;
  requests: { request: SessionRequest; response: SessionResponse }[];
  httpCalls: Array<{ scope: string; path: string; method: string; status: number; response: any }>;
}

export interface SessionRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface SessionResponse {
  body: any;
  status?: number;
}
