import { useState } from "react";
import Avatar from "boring-avatars";

const isImageSource = (src) => {
  if (!src || typeof src !== "string") return false;

  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:") || src.startsWith("/");
};

const AvatarDisplay = ({ src, alt = "User avatar", size = 40, className = "" }) => {
  const seed = typeof src === "string" && src.trim() ? src : alt;
  const [failedSource, setFailedSource] = useState("");

  if (isImageSource(src) && failedSource !== src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ width: size, height: size }}
        onError={() => setFailedSource(src)}
      />
    );
  }

  return (
    <div className={className} style={{ width: size, height: size, overflow: "hidden" }} role="img" aria-label={alt}>
      <Avatar
        size={size}
        name={isImageSource(seed) ? alt : seed}
        variant="beam"
        colors={["#7c3aed", "#22d3ee", "#f472b6", "#facc15", "#0f172a"]}
      />
    </div>
  );
};

export default AvatarDisplay;
