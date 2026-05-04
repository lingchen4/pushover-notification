export interface PushoverSendOptions {
  userKey: string;
  apiToken: string;
  message: string;
  title?: string;
  sound?: string;
  priority?: number;
}

export interface PushoverResponse {
  status: number;
  request: string;
}
