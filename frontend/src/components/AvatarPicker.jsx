import Avatar from "boring-avatars";
import { ShuffleIcon } from "lucide-react";
import "./avatar-picker.css";

const COLORS = ["#7c3aed", "#22d3ee", "#f472b6", "#facc15", "#0f172a"];

const AvatarPicker = ({ seed, onChange, title = "Your profile avatar", description = "Choose a look that feels like you.", actionLabel = "Generate a new avatar" }) => (
  <div className="avatar-picker">
    <div className="avatar-picker-preview">
      <Avatar size={88} name={seed || "WOG learner"} variant="beam" colors={COLORS} />
    </div>
    <div className="avatar-picker-copy">
      <strong>{title}</strong>
      <span>{description}</span>
      <button className="avatar-picker-action" type="button" onClick={() => onChange(Math.random().toString(36).slice(2, 11))}>
        <ShuffleIcon aria-hidden="true" /> {actionLabel}
      </button>
    </div>
  </div>
);

export default AvatarPicker;
