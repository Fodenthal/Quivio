declare global {
  interface Window {
    // Minimal gtag typings for our usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
  }
}

export {};

