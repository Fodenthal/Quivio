import Script from "next/script";
import { GAListener } from "./GAListener";

export type GoogleAnalyticsProps = {
  measurementId: string | undefined;
};

/**
 * Injects the GA4 script and initializes `gtag`. Also mounts a client-side
 * route-change listener to send page_view events on navigation.
 *
 * @param measurementId - GA4 Measurement ID (e.g., G-XXXXXXXXXX)
 * @returns JSX element or null if no measurementId provided
 */
export const GoogleAnalytics = ({ measurementId }: GoogleAnalyticsProps) => {
  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { page_path: window.location.pathname });
        `}
      </Script>
      <GAListener measurementId={measurementId} />
    </>
  );
};

