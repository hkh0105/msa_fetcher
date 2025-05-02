import { getAccessToken, logout } from "./tokenManager";

export async function requestInterceptor(
  input: RequestInfo,
  init: RequestInit
): Promise<[RequestInfo, RequestInit]> {
  const token = getAccessToken();

  if (!init.headers) init.headers = {};

  if (token) {
    (init.headers as Record<string, string>)[
      "Authorization"
    ] = `Bearer ${token}`;
  }

  return [input, init];
}

export async function responseInterceptor(
  response: Response
): Promise<Response> {
  if (!response.ok) {
    if (response.status === 403) {
      logout();
    }
    if (response.status >= 500) {
      alert("서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
    }
  }
  return response;
}
