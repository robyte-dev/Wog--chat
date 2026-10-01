import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { verifyNewDevice } from "../../lib/api";
import "./sessions.css";

export default function DeviceVerification({ email, onCancel }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await verifyNewDevice({ email, code });
      toast.success("This device is verified.");
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not verify this device.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="device-verification" aria-labelledby="device-verification-title">
      <div className="device-verification-icon"><MailCheck size={25} /></div>
      <p className="device-verification-eyebrow">NEW DEVICE CHECK</p>
      <h2 id="device-verification-title">Check your email</h2>
      <p>Enter the six-digit sign-in code sent to <strong>{email}</strong>. It expires in five minutes.</p>
      <form onSubmit={submit}>
        <label htmlFor="device-code">Verification code</label>
        <input id="device-code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required />
        {error && <p className="device-verification-error" role="alert">{error}</p>}
        <button className="btn btn-primary w-full" type="submit" disabled={pending || code.length !== 6}>{pending ? "Verifying…" : "Verify and sign in"}</button>
      </form>
      <button type="button" className="device-verification-back" onClick={onCancel}><ArrowLeft size={15} /> Back to sign in</button>
    </section>
  );
}
