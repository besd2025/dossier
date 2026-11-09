export function AppLogo({ className = "size-7", ...props }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold tracking-wider text-xs shadow-xs select-none ${className}`}
      {...props}
    >
      <span>BESD</span>
    </div>
  );
}

