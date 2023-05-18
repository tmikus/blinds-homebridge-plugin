import axios from 'axios';

export interface FetchOptions {
    body?: string;
    method?: string;
}

export interface FetchResponse {
    json(): Promise<unknown>;
}

export async function fetch(url: string, options?: FetchOptions): Promise<FetchResponse> {
  const result = await axios.request({
    method: options?.method ?? 'GET',
    data: options?.body,
    url,
  });
  return {
    json: async () => result.data,
  };
}