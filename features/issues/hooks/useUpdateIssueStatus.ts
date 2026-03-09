import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateIssueStatus } from "../services/issueService";
import type { RoadIssue, IssueStatus } from "@/types";

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) =>
      updateIssueStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["issues"] });
      const previousIssues = queryClient.getQueryData<RoadIssue[]>(["issues"]);
      queryClient.setQueryData<RoadIssue[]>(["issues"], (old) =>
        old?.map((issue) =>
          issue.id === id ? { ...issue, status } : issue
        )
      );
      return { previousIssues };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(["issues"], context.previousIssues);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
