import { Landmark } from "lucide-react";

export function AppLogo({ className = "size-7", ...props }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold tracking-wider text-xs shadow-xs select-none ${className}`}
      {...props}
    >
      <span>
        <Landmark size={24} /> <div className="size-full"> </div>
      </span>
    </div>
  );
}
