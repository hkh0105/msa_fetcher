import { ApiClient } from "@/app/api/ApiClient";
import { HeaderKey, ContentType } from "@/app/constant/api";

export abstract class BaseRepository {
  protected apiClient: ApiClient;
  protected baseHeaders: Record<string, string>;

  constructor(apiClient: ApiClient, baseHeaders: Record<string, string> = {}) {
    this.apiClient = apiClient;
    this.baseHeaders = {
      [HeaderKey.CONTENT_TYPE]: ContentType.JSON,
      ...baseHeaders,
    };
  }

  protected async get<T>(
    endpoint: string,
    headers?: Record<string, string>,
    abortController?: AbortController
  ) {
    return this.apiClient.request<T>(
      endpoint,
      {
        method: "GET",
      },
      { ...this.baseHeaders, ...headers },
      abortController
    );
  }

  protected async post<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>,
    abortController?: AbortController
  ) {
    return this.apiClient.request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      { ...this.baseHeaders, ...headers },
      abortController
    );
  }

  protected async put<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>,
    abortController?: AbortController
  ) {
    return this.apiClient.request<T>(
      endpoint,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      { ...this.baseHeaders, ...headers },
      abortController
    );
  }

  protected async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
    abortController?: AbortController
  ) {
    return this.apiClient.request<T>(
      endpoint,
      {
        method: "DELETE",
      },
      { ...this.baseHeaders, ...headers },
      abortController
    );
  }
}
