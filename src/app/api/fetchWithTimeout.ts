export async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit,
  timeoutMs: number = 10000,
  abortController?: AbortController
): Promise<Response> {
  const controller = abortController ?? new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}
