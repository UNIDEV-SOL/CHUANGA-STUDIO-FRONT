import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData, extractApiMensagem } from "@/lib/httpClient";

export function throwApiError(error: unknown): never {
  throw new Error(extractApiMensagem(error));
}

export function useGet<TData>(
  endpoint: string,
  options?: { enabled?: boolean; queryKey?: unknown[] },
) {
  const queryKey = options?.queryKey ?? [endpoint];
  return useQuery({
    queryKey,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await apiClient.get(endpoint);
      return extractApiData<TData>(res.data);
    },
  });
}

export function usePost<TData, TVariables>(endpoint: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const res = await apiClient.post(endpoint, variables as any);
      return extractApiData<TData>(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: throwApiError,
  });
}

export function usePut<TData, TVariables>(endpoint: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const res = await apiClient.put(endpoint, variables as any);
      return extractApiData<TData>(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: throwApiError,
  });
}

export function usePatch<TData, TVariables>(endpoint: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const res = await apiClient.patch(endpoint, variables as any);
      return extractApiData<TData>(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: throwApiError,
  });
}

export function useDelete<TData>(endpoint: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(endpoint);
      return extractApiData<TData>(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: throwApiError,
  });
}

