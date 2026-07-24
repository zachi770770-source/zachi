"use client";

import * as React from "react";
import Script from "next/script";

import { siteConfig } from "@/config/site";
import { hasAnalyticsConsent, hasMarketingConsent } from "@/lib/analytics";

/**
 * טוען סקריפטים חיצוניים (GA / GTM / Meta Pixel) רק כאשר:
 * 1. מזהה הוזן דרך משתני סביבה (NEXT_PUBLIC_GA_ID וכו').
 * 2. המשתמש אישר את קטגוריית העוגיות הרלוונטית.
 * כברירת מחדל, בלי הסכמה ובלי מזהים - שום דבר לא נטען.
 */
export function AnalyticsScripts() {
  const [analyticsAllowed, setAnalyticsAllowed] = React.useState(false);
  const [marketingAllowed, setMarketingAllowed] = React.useState(false);

  React.useEffect(() => {
    function sync() {
      setAnalyticsAllowed(hasAnalyticsConsent());
      setMarketingAllowed(hasMarketingConsent());
    }
    sync();
    window.addEventListener("cookie-consent-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cookie-consent-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const { googleAnalyticsId, googleTagManagerId, metaPixelId } =
    siteConfig.analytics;

  return (
    <>
      {analyticsAllowed && googleTagManagerId ? (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${googleTagManagerId}');`}
        </Script>
      ) : null}

      {analyticsAllowed && googleAnalyticsId && !googleTagManagerId ? (
        <>
          <Script
            id="ga-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${googleAnalyticsId}');`}
          </Script>
        </>
      ) : null}

      {marketingAllowed && metaPixelId ? (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${metaPixelId}');fbq('track', 'PageView');`}
        </Script>
      ) : null}
    </>
  );
}
