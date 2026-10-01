import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { getUserFriends, updateProfile, removeFriend, deleteAccount, getActiveSessions, terminateSession, terminateOtherSessions } from "../lib/api";
import { LANGUAGES } from "../constants";
import useAuthUser from "../hooks/useAuthUser";
import { disconnectStreamChat } from "../features/chat/useStreamChat";
import AvatarDisplay from "../components/AvatarDisplay";
import AvatarPicker from "../components/AvatarPicker";
import ConfirmDialog from "../components/ConfirmDialog";
import "../features/profile/profile.css";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (authUser) setForm({
      fullName: authUser.fullName || "", bio: authUser.bio || "",
      profilePic: authUser.profilePic?.startsWith("http") ? authUser.fullName : authUser.profilePic || authUser.fullName || "WOG learner",
      nativeLanguage: authUser.nativeLanguage || "", location: authUser.location || "",
    });
  }, [authUser]);

  const { data: friends = [] } = useQuery({ queryKey: ["friends"], queryFn: getUserFriends });
  const { data: sessionData = { sessions: [] }, isLoading: sessionsLoading } = useQuery({ queryKey: ["activeSessions"], queryFn: getActiveSessions });
  const refreshSessions = async () => {
    await queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
    await queryClient.invalidateQueries({ queryKey: ["authUser"] });
  };
  const sessionMutation = useMutation({
    mutationFn: terminateSession,
    onSuccess: async (result) => { toast.success(result.message); await refreshSessions(); },
    onError: (error) => toast.error(error.response?.data?.message || "Could not sign out this device."),
  });
  const otherSessionsMutation = useMutation({
    mutationFn: terminateOtherSessions,
    onSuccess: async (result) => { toast.success(result.message); await refreshSessions(); },
    onError: (error) => toast.error(error.response?.data?.message || "Could not sign out other devices."),
  });
  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async ({ user }) => {
      queryClient.setQueryData(["authUser"], { success: true, user });
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Your profile was updated.");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Could not update your profile."),
  });
  const friendMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: async () => {
      setConfirm(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["friends"] }),
        queryClient.invalidateQueries({ queryKey: ["users"] }),
      ]);
      toast.success("Friend removed from your connections.");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Could not remove this friend."),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      setConfirm(null);
      try { await disconnectStreamChat(); } catch (error) { console.warn("Stream disconnect failed:", error); }
      queryClient.clear();
      toast.success("Your account was permanently deleted.");
      navigate("/login", { replace: true });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Account deletion failed. Please retry."),
  });

  const setField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <div className="profile-page">
      <header className="profile-heading">
        <span>YOUR ACCOUNT</span>
        <h1>Profile & connections</h1>
        <p>Keep your learner profile up to date and manage who you’re connected with.</p>
      </header>

      <section className="profile-panel">
        <div className="profile-panel-heading">
          <div className="profile-avatar"><AvatarDisplay src={form.profilePic} alt={form.fullName || "Profile"} size={76} className="object-cover" /></div>
          <div><h2>Your profile</h2><p>{authUser?.email}</p></div>
        </div>
        <form className="profile-form" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(form); }}>
          <label>Full name<input name="fullName" value={form.fullName || ""} onChange={setField} maxLength={80} required /></label>
          <div className="profile-wide"><AvatarPicker seed={form.profilePic} onChange={(profilePic) => setForm((current) => ({ ...current, profilePic }))} title="Your profile avatar" description="Preview and generate a new look. Save changes to apply it." actionLabel="Generate another avatar" /></div>
          <label className="profile-wide">About you<textarea name="bio" value={form.bio || ""} onChange={setField} maxLength={500} rows={3} placeholder="A little about you" /></label>
          <label>Native language<select className="language-choice" name="nativeLanguage" value={form.nativeLanguage || ""} onChange={setField}><option value="">Choose a language</option>{LANGUAGES.map((language) => <option key={language} value={language.toLowerCase()}>{language}</option>)}</select></label>
          <label>Location<input name="location" value={form.location || ""} onChange={setField} maxLength={120} placeholder="City, country" /></label>
          <div className="profile-wide profile-form-actions"><button className="btn btn-primary" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save changes"}</button></div>
        </form>
      </section>

      <section className="profile-panel">
        <div className="profile-section-heading"><div><h2>Devices and active sessions</h2><p>Each sign-in appears here. New browsers need a code from your email.</p></div><button type="button" className="btn btn-ghost btn-sm" onClick={() => otherSessionsMutation.mutate()} disabled={otherSessionsMutation.isPending || (sessionData.sessions || []).length < 2}>{otherSessionsMutation.isPending ? "Signing out…" : "Sign out other devices"}</button></div>
        {sessionsLoading ? <p className="profile-empty">Loading your sessions…</p> : sessionData.sessions?.length ? <div className="profile-friends">{sessionData.sessions.map((session) => <article className="profile-friend" key={session.id}>
          <div className="session-device-icon">{session.device?.includes("Android") || session.device?.includes("iOS") ? "▯" : "▰"}</div>
          <div><strong>{session.device} {session.current && <span className="session-current">This device</span>}</strong><span>Last active {new Date(session.lastActiveAt).toLocaleString()} · Signed in {new Date(session.createdAt).toLocaleDateString()}</span></div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm({ type: "session", id: session.id, device: session.device })}>Sign out</button>
        </article>)}</div> : <p className="profile-empty">No active devices were found.</p>}
      </section>

      <section className="profile-panel">
        <div className="profile-section-heading"><div><h2>Your connections</h2><p>Remove a connection at any time. This does not delete either account.</p></div><span className="badge badge-outline">{friends.length}</span></div>
        {friends.length ? <div className="profile-friends">{friends.map((friend) => <article className="profile-friend" key={friend._id}>
          <AvatarDisplay src={friend.profilePic} alt={friend.fullName || "Friend"} size={44} className="object-cover" />
          <div><strong>{friend.fullName}</strong><span>{friend.nativeLanguage || "WOG member"}</span></div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setConfirm({ type: "friend", id: friend._id, name: friend.fullName })}>Remove</button>
        </article>)}</div> : <p className="profile-empty">You haven’t connected with any friends yet.</p>}
      </section>

      <section className="profile-danger-zone">
        <div><h2>Delete your account</h2><p>Permanently remove your WOG profile, connections, requests, and chat data. You will need to sign up again to use WOG.</p></div>
        <button className="btn btn-error btn-outline" type="button" onClick={() => setConfirm({ type: "account" })}>Delete account</button>
      </section>

      {confirm?.type === "friend" && <ConfirmDialog title={`Remove ${confirm.name || "this friend"}?`} description="You will both be removed from each other’s connections. Your account and chat history will remain." confirmLabel="Yes, remove friend" danger busy={friendMutation.isPending} onCancel={() => setConfirm(null)} onConfirm={() => friendMutation.mutate(confirm.id)} />}
      {confirm?.type === "session" && <ConfirmDialog title={`Sign out ${confirm.device || "this device"}?`} description="This device’s session and trusted-device access will be revoked. It must pass email verification next time it signs in." confirmLabel="Sign out device" danger busy={sessionMutation.isPending} onCancel={() => setConfirm(null)} onConfirm={() => { setConfirm(null); sessionMutation.mutate(confirm.id); }} />}
      {confirm?.type === "account" && <ConfirmDialog title="Permanently delete your account?" description="This permanently deletes your WOG profile, friend connections, pending requests, Stream chat identity, conversations, and messages. You will be signed out and must create a new account to return. This cannot be undone." confirmLabel="Yes, permanently delete" danger busy={deleteMutation.isPending} onCancel={() => setConfirm(null)} onConfirm={() => deleteMutation.mutate()} />}
    </div>
  );
};

export default ProfilePage;
