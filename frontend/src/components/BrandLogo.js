import React, { useState } from 'react';
import { HeartPulse } from 'lucide-react';

const STARTUP_LOGO_SRC = '/branding/sanarios-logo.png';

export default function BrandLogo({
  size = 24,
  imgClassName = '',
  iconClassName = 'text-primary',
  alt = 'Doctor365 logo',
}) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (!loadFailed) {
    return (
      <img
        src={STARTUP_LOGO_SRC}
        alt={alt}
        width={size}
        height={size}
        className={`object-contain ${imgClassName}`}
        onError={() => setLoadFailed(true)}
      />
    );
  }

  return <HeartPulse className={iconClassName} style={{ width: size, height: size }} />;
}
