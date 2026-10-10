"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { useHydrated } from "@/hooks/use-hydrated"
import { getCurrentUser, logout, type User } from "@/lib/api/auth"
import { savedApi } from "@/lib/api/saved"
import { safeNextPath } from "@/lib/auth/validation"
import { queryKeys } from "@/lib/query-keys"
import { routes } from "@/lib/routes"

export function useCurrentUser() {
  const hydrated = useHydrated()
  const query = useQuery({ queryKey: queryKeys.currentUser, queryFn: getCurrentUser, staleTime: 5 * 60_000 })

  return {
    user: hydrated ? (query.data ?? null) : null,
    isLoading: !hydrated || query.isPending,
  }
}

export function useFinishSignIn() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return async (user: User) => {
    queryClient.setQueryData(queryKeys.currentUser, user)

    const scholarshipToSave = new URLSearchParams(window.location.search).get("save")
    if (scholarshipToSave) await savedApi.save(scholarshipToSave).catch(() => undefined)

    await queryClient.invalidateQueries({ queryKey: queryKeys.saved })
    router.replace(safeNextPath(routes.tracker))
  }
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.currentUser, null)
      queryClient.removeQueries({ queryKey: queryKeys.saved })
      router.push(routes.home)
    },
  })
}
