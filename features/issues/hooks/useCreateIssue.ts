import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createIssue } from "../services/issueService";
import type { RoadIssue } from "@/types";

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIssue,
    onSuccess: (newIssue) => {
      queryClient.setQueryData<RoadIssue[]>(["issues"], (old) =>
        old ? [newIssue, ...old] : [newIssue]
      );
    },
  });
}
