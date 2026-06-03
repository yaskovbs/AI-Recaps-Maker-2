import { StripeProvider } from '@stripe/stripe-react-native';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function StripeProviderWrapper({ children }: Props) {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}>
      {children}
    </StripeProvider>
  );
}
