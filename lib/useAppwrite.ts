import { Alert } from "react-native";
import { useEffect, useState, useCallback } from "react";

//Defines the structure of the arguments passed to the hook.
interface UseAppwriteOptions<T, P extends Record<string, string | number>> {
  //A function that fetches data and returns a promise (Appwrite API call).
  fn: (params: P) => Promise<T>;
  params?: P;   //Parameters passed to the API function (optional)
  skip?: boolean;   //A flag to indicate whether to skip the initial API call.
}

interface UseAppwriteReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newParams: P) => Promise<void>;   //Function to trigger the API call with new parameters
}

//custom react hook to managing Appwrite calls with state handling and error handling
export const useAppwrite = <T, P extends Record<string, string | number>>({
  fn,
  params = {} as P,
  skip = false,
}: UseAppwriteOptions<T, P>): UseAppwriteReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (fetchParams: P) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn(fetchParams);
        setData(result);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  }, []);

  const refetch = async (newParams: P) => await fetchData(newParams);

  return { data, loading, error, refetch };
};
