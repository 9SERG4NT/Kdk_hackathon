import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateIssueStatus } from "../services/issueService";
import type { RoadIssue, IssueStatus } from "@/types";

interface UpdateParams {
  id: string;
  status: IssueStatus;
  performedBy?: string;
  assignedWorker?: string;
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, performedBy, assignedWorker }: UpdateParams) =>
      updateIssueStatus(id, status, performedBy, assignedWorker),
    onMutate: async ({ id, status, assignedWorker }) => {
      await queryClient.cancelQueries({ queryKey: ["issues"] });
      const previousIssues = queryClient.getQueryData<RoadIssue[]>(["issues"]);
      queryClient.setQueryData<RoadIssue[]>(["issues"], (old) =>
        old?.map((issue) =>
          issue.id === id
            ? { ...issue, status, ...(assignedWorker !== undefined ? { assigned_worker: assignedWorker } : {}) }
            : issue
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
