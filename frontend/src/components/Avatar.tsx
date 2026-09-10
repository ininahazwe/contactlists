import { avatarTone, initials } from "../utils/format";

interface Props {
  name: string;
  size?: "sm" | "md" | "lg";
  /** Forces a tone instead of the one derived from the name. */
  tone?: "ink" | "teal" | "mint" | "";
}

export default function Avatar({ name, size = "sm", tone }: Props) {
  const t = tone ?? avatarTone(name);
  return (
    <span className={`avatar avatar--${size}${t ? ` avatar--${t}` : ""}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
