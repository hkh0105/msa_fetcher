import { requestInterceptor, responseInterceptor } from "./interceptors";
import { refreshAccessToken } from "./tokenManager";
import { ApiError } from "./error";
import { enqueueRequest } from "./requestQueue";

class TokenRefreshLock {
  private static instance: TokenRefreshLock;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): TokenRefreshLock {
    if (!TokenRefreshLock.instance) {
      TokenRefreshLock.instance = new TokenRefreshLock();
    }
    return TokenRefreshLock.instance;
  }

  async acquireRefreshLock(
    refreshCallback: () => Promise<void>
  ): Promise<void> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = refreshCallback().finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    headers: Record<string, string> = {},
    abortController?: AbortController
  ): Promise<T> {
    const tokenRefreshLock = TokenRefreshLock.getInstance();
    const input: RequestInfo = `${this.baseUrl}${endpoint}`;

    const prepareRequest = (originalOptions: RequestInit) => {
      const originalBody = originalOptions.body;
      const processedOptions = { ...originalOptions };

      if (originalBody instanceof ReadableStream) {
        const [stream1, stream2] = originalBody.tee();
        processedOptions.body = stream1;
        return { processedOptions, originalBody: stream2 };
      }

      return { processedOptions, originalBody };
    };

    const { processedOptions: initialOptions, originalBody } =
      prepareRequest(options);

    let [processedInput, processedOptions] = await requestInterceptor(input, {
      ...initialOptions,
      headers: {
        ...(initialOptions.headers || {}),
        ...headers,
      },
    });

    const res = await enqueueRequest(
      processedInput,
      processedOptions,
      abortController
    );
    const interceptedResponse = await responseInterceptor(res);

    if (interceptedResponse.status === 401) {
      await tokenRefreshLock.acquireRefreshLock(async () => {
        await refreshAccessToken();
      });

      const retryOptions: RequestInit = { ...options };

      if (originalBody instanceof ReadableStream) {
        retryOptions.body = originalBody;
      }

      [processedInput, processedOptions] = await requestInterceptor(input, {
        ...retryOptions,
        headers: {
          ...(retryOptions.headers || {}),
          ...headers,
        },
      });

      const retryRes = await enqueueRequest(
        processedInput,
        processedOptions,
        abortController
      );
      const retryIntercepted = await responseInterceptor(retryRes);

      if (!retryIntercepted.ok) {
        const retryBody = await retryIntercepted.json();
        throw new ApiError(
          "토큰 갱신 후 요청 실패",
          retryIntercepted.status,
          retryBody
        );
      }

      return retryIntercepted.json() as Promise<T>;
    }

    if (!interceptedResponse.ok) {
      const errorBody = await interceptedResponse.json();
      throw new ApiError("요청 실패", interceptedResponse.status, errorBody);
    }

    return interceptedResponse.json() as Promise<T>;
  }
}
