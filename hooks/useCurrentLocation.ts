import { useEffect, useState, useCallback } from 'react';
import { Accuracy, getCurrentLocation, Location } from '@apps-in-toss/framework';

export function useCurrentLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCurrentLocation({
        accuracy: Accuracy.Balanced,
      });

      setLocation(response);
    } catch (error) {
      let errorMessage = '위치 정보를 가져오는 데 실패했어요.';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, []);

  return { location, loading, error, reloadLocation: fetchLocation };
}
