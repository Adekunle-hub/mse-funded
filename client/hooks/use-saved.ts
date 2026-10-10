"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useToast } from "@/components/feedback/toast"
import { useHydrated } from "@/hooks/use-hydrated"
import { savedApi } from "@/lib/api/saved"
import { formatDate } from "@/lib/format/date"
import type { ScholarshipSummary } from "@/lib/types/scholarship"
import type { SavedScholarship, SavedScholarshipUpdate } from "@/lib/types/saved"

export const savedQueryKey = ["saved"] as const

export function useSavedList() {
  const hydrated = useHydrated()
  const query = useQuery({ queryKey: savedQueryKey, queryFn: savedApi.list })
  // Saved data lives only in the browser; match the server render until hydration completes.
  return hydrated ? query : { ...query, data: undefined, isPending: true as const }
}

export function useSavedEntry(id: string) {
  const query = useSavedList()
  return { entry: query.data?.find((item) => item.scholarship.id === id), isPending: query.isPending }
}

function useOptimisticSaved() {
  const queryClient = useQueryClient()

  return {
    async apply(update: (items: SavedScholarship[]) => SavedScholarship[]) {
      await queryClient.cancelQueries({ queryKey: savedQueryKey })
      const previous = queryClient.getQueryData<SavedScholarship[]>(savedQueryKey)
      queryClient.setQueryData<SavedScholarship[]>(savedQueryKey, (items = []) => update(items))
      return previous
    },
    rollback(previous: SavedScholarship[] | undefined) {
      queryClient.setQueryData(savedQueryKey, previous)
    },
    settle() {
      return queryClient.invalidateQueries({ queryKey: savedQueryKey })
    },
  }
}

export function useToggleSave() {
  const toast = useToast()
  const optimistic = useOptimisticSaved()

  const mutation = useMutation({
    mutationFn: ({ scholarship, save }: { scholarship: ScholarshipSummary; save: boolean }) =>
      save ? savedApi.save(scholarship).then(() => undefined) : savedApi.remove(scholarship.id),
    onMutate: ({ scholarship, save }) =>
      optimistic.apply((items) =>
        save
          ? [
              {
                scholarship,
                status: "interested",
                note: "",
                remindersOn: true,
                savedAt: new Date().toISOString(),
              },
              ...items.filter((item) => item.scholarship.id !== scholarship.id),
            ]
          : items.filter((item) => item.scholarship.id !== scholarship.id)
      ),
    onError: (_error, variables, previous) => {
      optimistic.rollback(previous)
      toast({
        tone: "error",
        message: variables.save ? "Couldn't save. Try again." : "Couldn't remove. Try again.",
        action: { label: "Retry", onClick: () => mutation.mutate(variables) },
      })
    },
    onSuccess: (_data, { scholarship, save }) => {
      if (!save) return
      toast({
        tone: "saved",
        message: `Saved. We'll remind you before ${formatDate(scholarship.deadline, { withYear: false })}.`,
        action: { label: "Undo", onClick: () => mutation.mutate({ scholarship, save: false }) },
      })
    },
    onSettled: optimistic.settle,
  })

  return mutation
}

export function useUpdateSaved() {
  const toast = useToast()
  const optimistic = useOptimisticSaved()

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: SavedScholarshipUpdate }) =>
      savedApi.update(id, changes),
    onMutate: ({ id, changes }) =>
      optimistic.apply((items) =>
        items.map((item) => (item.scholarship.id === id ? { ...item, ...changes } : item))
      ),
    onError: (_error, _variables, previous) => {
      optimistic.rollback(previous)
      toast({ tone: "error", message: "Couldn't save that change. Try again." })
    },
    onSettled: optimistic.settle,
  })
}

export function useRemoveSaved() {
  const toast = useToast()
  const optimistic = useOptimisticSaved()

  const restore = useMutation({
    mutationFn: (entry: SavedScholarship) => savedApi.restore(entry),
    onSettled: optimistic.settle,
  })

  return useMutation({
    mutationFn: (entry: SavedScholarship) => savedApi.remove(entry.scholarship.id),
    onMutate: (entry) =>
      optimistic.apply((items) => items.filter((item) => item.scholarship.id !== entry.scholarship.id)),
    onError: (_error, _entry, previous) => {
      optimistic.rollback(previous)
      toast({ tone: "error", message: "Couldn't remove. Try again." })
    },
    onSuccess: (_data, entry) => {
      toast({
        tone: "success",
        message: `Removed ${entry.scholarship.title}.`,
        action: { label: "Undo", onClick: () => restore.mutate(entry) },
      })
    },
    onSettled: optimistic.settle,
  })
}
