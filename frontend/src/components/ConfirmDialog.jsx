import "./confirm-dialog.css";

const ConfirmDialog = ({ title, description, confirmLabel, cancelLabel = "Cancel", danger = false, busy = false, onConfirm, onCancel }) => (
  <div className="confirm-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <h2 id="confirm-title">{title}</h2>
      <p>{description}</p>
      <div className="confirm-actions">
        <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        <button className={`btn ${danger ? "btn-error" : "btn-primary"}`} type="button" onClick={onConfirm} disabled={busy}>
          {busy ? <span className="loading loading-spinner loading-sm" /> : confirmLabel}
        </button>
      </div>
    </section>
  </div>
);

export default ConfirmDialog;
