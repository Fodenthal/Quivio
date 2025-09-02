'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface BlogAdProps {
  slot: string;
  style?: React.CSSProperties;
  format?: string;
  responsive?: boolean;
  className?: string;
}

export function BlogAd({ 
  slot, 
  style = { display: 'block' }, 
  format = 'auto',
  responsive = true,
  className = ''
}: BlogAdProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`my-8 ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-7659818852435801"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}
