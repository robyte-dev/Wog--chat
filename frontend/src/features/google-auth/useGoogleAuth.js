import { useMutation, useQueryClient } from "@tanstack/react-query";
import { googleAuth } from "../../lib/api";

export default function useGoogleAuth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: googleAuth,
    onSuccess: async (result) => {
      if (result?.user) await queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });
}
