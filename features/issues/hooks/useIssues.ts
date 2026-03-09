import { useQuery } from "@tanstack/react-query";
import { fetchIssues } from "../services/issueService";

export function useIssues() {
  return useQuery({
    queryKey: ["issues"],
    queryFn: fetchIssues,
    refetchInterval: 30000,
  });
}
