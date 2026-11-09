"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "cn";
import { resolveNativeButton } from "@/lib/utils";

function Popover({ ...props }) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  asChild = false,
  nativeButton,
  children,
  render,
  ...props
}) {
  const renderProp = asChild && React.isValidElement(children) ? children : render;
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      render={renderProp}
      nativeButton={resolveNativeButton(renderProp, nativeButton)}
      {...props}
    >
      {!renderProp ? children : undefined}
    </PopoverPrimitive.Trigger>
  );
}

function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  children,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 flex w-72 flex-col gap-2.5 rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-md outline-hidden",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverClose({
  asChild = false,
  nativeButton,
  children,
  render,
  ...props
}) {
  const renderProp = asChild && React.isValidElement(children) ? children : render;
  return (
    <PopoverPrimitive.Close
      data-slot="popover-close"
      render={renderProp}
      nativeButton={resolveNativeButton(renderProp, nativeButton)}
      {...props}
    >
      {!renderProp ? children : undefined}
    </PopoverPrimitive.Close>
  );
}

function PopoverTitle({ className, ...props }) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverTitle,
  PopoverDescription,
};

