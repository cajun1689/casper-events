import AsyncStorage from "@react-native-async-storage/async-storage";

const CRASH_BREADCRUMBS_KEY = "crash_breadcrumbs_v1";
const MAX_BREADCRUMBS = 80;

type Breadcrumb = {
  ts: string;
  event: string;
  data?: Record<string, unknown>;
};

let installed = false;

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "\"[unserializable]\"";
  }
}

async function readBreadcrumbs(): Promise<Breadcrumb[]> {
  try {
    const raw = await AsyncStorage.getItem(CRASH_BREADCRUMBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Breadcrumb[];
    return [];
  } catch {
    return [];
  }
}

async function writeBreadcrumbs(next: Breadcrumb[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CRASH_BREADCRUMBS_KEY, JSON.stringify(next));
  } catch {
    // If storage is unavailable we still keep console output.
  }
}

export function logBreadcrumb(event: string, data?: Record<string, unknown>): void {
  const entry: Breadcrumb = {
    ts: new Date().toISOString(),
    event,
    data,
  };

  // Keep logs visible in device logs/TestFlight attached logs when possible.
  // eslint-disable-next-line no-console
  console.log(`[diag] ${entry.ts} ${event} ${safeStringify(data ?? {})}`);

  void (async () => {
    const prev = await readBreadcrumbs();
    const next = [...prev, entry].slice(-MAX_BREADCRUMBS);
    await writeBreadcrumbs(next);
  })();
}

export async function getBreadcrumbDump(): Promise<string> {
  const crumbs = await readBreadcrumbs();
  return safeStringify(crumbs);
}

export async function clearBreadcrumbs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CRASH_BREADCRUMBS_KEY);
  } catch {
    // ignore
  }
}

type ErrorUtilsLike = {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

export function installGlobalErrorHandler(): void {
  if (installed) return;
  installed = true;

  const errorUtils = (globalThis as unknown as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (!errorUtils?.setGlobalHandler || !errorUtils.getGlobalHandler) {
    logBreadcrumb("global-error-handler-unavailable");
    return;
  }

  const defaultHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === "string" ? error : "unknown-error";
    const stack = error instanceof Error ? error.stack : undefined;

    logBreadcrumb("global-js-error", {
      isFatal: Boolean(isFatal),
      message: errorMessage,
      stack,
    });

    defaultHandler?.(error, isFatal);
  });

  logBreadcrumb("global-error-handler-installed");
}
