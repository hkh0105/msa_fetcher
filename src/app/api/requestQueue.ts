import { fetchWithTimeout } from "./fetchWithTimeout";

type QueueItem = {
  input: RequestInfo;
  init: RequestInit;
  resolve: (res: Response) => void;
  reject: (err: unknown) => void;
};

const requestQueue: QueueItem[] = [];
let processing = false;

export async function enqueueRequest(
  input: RequestInfo,
  init: RequestInit
): Promise<Response> {
  return new Promise((resolve, reject) => {
    requestQueue.push({ input, init, resolve, reject });
    if (!processing) {
      processQueue();
    }
  });
}

async function processQueue() {
  processing = true;

  while (requestQueue.length > 0) {
    const { input, init, resolve, reject } = requestQueue.shift()!;

    try {
      const res = await fetchWithTimeout(input, init);
      resolve(res);
    } catch (error) {
      reject(error);
    }
  }

  processing = false;
}
