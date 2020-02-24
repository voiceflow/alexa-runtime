export interface SessionRecording {
  requests: { request: SessionRequest; response: SessionResponse }[];
  fixtures: {
    metadata: unknown;
    diagrams: Record<string, unknown>;
  };
}

export interface SessionRequest {
  url: string;
  body: unknown;
}

export interface SessionResponse {
  body: unknown;
  status?: number;
}
