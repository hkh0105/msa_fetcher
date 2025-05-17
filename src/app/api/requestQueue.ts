import { fetchWithTimeout } from "./fetchWithTimeout";

type QueueItem = {
  input: RequestInfo;
  init: RequestInit;
  resolve: (res: Response) => void;
  reject: (err: unknown) => void;
  abortController?: AbortController;
};

const requestQueue: QueueItem[] = [];
const MAX_CONCURRENCY = 5;
let activeCount = 0;

export async function enqueueRequest(
  input: RequestInfo,
  init: RequestInit,
  abortController?: AbortController
): Promise<Response> {
  return new Promise((resolve, reject) => {
    requestQueue.push({ input, init, resolve, reject, abortController });
    processQueue();
  });
}

function processQueue() {
  while (activeCount < MAX_CONCURRENCY && requestQueue.length > 0) {
    const { input, init, resolve, reject, abortController } =
      requestQueue.shift()!;
    activeCount++;
    fetchWithTimeout(input, init, 10000, abortController)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeCount--;
        processQueue();
      });
  }
}
