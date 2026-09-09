import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { Me } from '../types'

export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/accounts/me/')).data,
    staleTime: 5 * 60_000,
  })
}
