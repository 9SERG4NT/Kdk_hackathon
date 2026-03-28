import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateIssueStatus } from "../services/issueService";
import type { RoadIssue, DbIssueStatus } from "@/types";

interface UpdateParams {
  id: string;
  status: DbIssueStatus;
  performedBy?: string;
  assignedTo?: string;
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, performedBy, assignedTo }: UpdateParams) =>
      updateIssueStatus(id, status, performedBy, assignedTo),
    onMutate: async ({ id, status, assignedTo }) => {
      await queryClient.cancelQueries({ queryKey: ["issues"] });
      const previousIssues = queryClient.getQueryData<RoadIssue[]>(["issues"]);
      queryClient.setQueryData<RoadIssue[]>(["issues"], (old) =>
        old?.map((issue) =>
          issue.id === id
            ? { ...issue, status, ...(assignedTo !== undefined ? { assigned_to: assignedTo } : {}) }
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
