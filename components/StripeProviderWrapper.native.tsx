import { ReactNode } from 'react';
import Constants from 'expo-constants';
import React from 'react';

interface Props {
  children: ReactNode;
}

const isExpoGo = Constants.appOwnership === 'expo';

let StripeProvider: React.ComponentType<{ publishableKey: string; children: ReactNode }> | null = null;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
  } catch {
    // not available
  }
}

export default function StripeProviderWrapper({ children }: Props) {
  if (StripeProvider) {
    return (
      <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}>
        {children}
      </StripeProvider>
    );
  }
  return <>{children}</>;
}
