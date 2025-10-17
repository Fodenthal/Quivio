import Script from "next/script";

const CONSENT_DEFAULT_SCRIPT_ID = "consent-defaults";
const COOKIEBOT_SCRIPT_ID = "cookiebot";
const COOKIEBOT_CONSENT_SYNC_SCRIPT_ID = "cookiebot-consent-sync";

const consentDefaults = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });
`;

const cookiebotConsentSync = `
  (function() {
    const updateConsent = () => {
      const cookiebot = window.Cookiebot;
      if (!cookiebot || typeof gtag !== "function") {
        return;
      }

      const consent = cookiebot.consent || {};
      gtag('consent', 'update', {
        ad_storage: consent.marketing ? 'granted' : 'denied',
        ad_user_data: consent.marketing ? 'granted' : 'denied',
        ad_personalization: consent.marketing ? 'granted' : 'denied',
        analytics_storage: consent.statistics ? 'granted' : 'denied'
      });
    };

    if (window.Cookiebot && window.Cookiebot.consent) {
      updateConsent();
    }

    window.addEventListener('CookiebotOnConsentReady', updateConsent);
    window.addEventListener('CookiebotOnLoad', updateConsent);
    window.addEventListener('CookiebotOnAccept', updateConsent);
    window.addEventListener('CookiebotOnDecline', updateConsent);
  })();
`;

export type ConsentManagerProps = {
  cookiebotId?: string;
};

export const ConsentManager = ({ cookiebotId }: ConsentManagerProps) => {
  if (process.env.NODE_ENV === "development" && !cookiebotId) {
    // eslint-disable-next-line no-console -- surface missing local configuration during dev
    console.warn(
      "[ConsentManager] NEXT_PUBLIC_COOKIEBOT_ID is not set. Consent banner will not render until configured."
    );
  }

  return (
    <>
      <Script id={CONSENT_DEFAULT_SCRIPT_ID} strategy="beforeInteractive">
        {consentDefaults}
      </Script>
      {cookiebotId ? (
        <>
          <Script
            id={COOKIEBOT_SCRIPT_ID}
            src="https://consent.cookiebot.com/uc.js"
            data-cbid={cookiebotId}
            data-blockingmode="auto"
            strategy="beforeInteractive"
          />
          <Script id={COOKIEBOT_CONSENT_SYNC_SCRIPT_ID} strategy="afterInteractive">
            {cookiebotConsentSync}
          </Script>
        </>
      ) : null}
    </>
  );
};
