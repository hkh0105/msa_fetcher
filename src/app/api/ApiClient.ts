import { requestInterceptor, responseInterceptor } from "./interceptors";
import { refreshAccessToken } from "./tokenManager";
import { ApiError } from "./error";
import { enqueueRequest } from "./requestQueue";

export class ApiClient {
  constructor(private baseUrl: string) {}

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    headers: Record<string, string> = {}
  ): Promise<T> {
    let input: RequestInfo = `${this.baseUrl}${endpoint}`;

    [input, options] = await requestInterceptor(input, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...headers,
      },
    });

    const res = await enqueueRequest(input, options);
    const interceptedResponse = await responseInterceptor(res);

    if (interceptedResponse.status === 401) {
      await refreshAccessToken();

      [input, options] = await requestInterceptor(input, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...headers,
        },
      });

      const retryRes = await enqueueRequest(input, options);
      const retryIntercepted = await responseInterceptor(retryRes);

      if (!retryIntercepted.ok) {
        const retryBody = await retryIntercepted.json();
        throw new ApiError(
          "Retry request failed",
          retryIntercepted.status,
          retryBody
        );
      }

      return retryIntercepted.json();
    }

    if (!interceptedResponse.ok) {
      const errorBody = await interceptedResponse.json();
      throw new ApiError(
        "Request failed",
        interceptedResponse.status,
        errorBody
      );
    }

    return interceptedResponse.json();
  }
}
