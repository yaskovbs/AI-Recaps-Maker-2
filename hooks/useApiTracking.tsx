// useApiTracking Hook
import { useContext } from 'react';
import { ApiTrackingContext } from '@/contexts/ApiTrackingContext';

export function useApiTracking() {
  const context = useContext(ApiTrackingContext);
  
  if (!context) {
    throw new Error('useApiTracking must be used within ApiTrackingProvider');
  }
  
  return context;
}
