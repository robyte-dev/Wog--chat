import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";
import { disconnectStreamChat } from "../features/chat/useStreamChat";
import toast from "react-hot-toast";

const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      try {
        await disconnectStreamChat();
      } catch (error) {
        console.error("Could not disconnect Stream chat cleanly:", error);
      }
      queryClient.removeQueries({ queryKey: ["streamToken"] });
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Could not sign out. Please try again."),
  });

  return { logoutMutation, isPending, error };
};
export default useLogout;
