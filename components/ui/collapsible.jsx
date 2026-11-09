"use client";

import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { resolveNativeButton } from "@/lib/utils";

function Collapsible({
  asChild = false,
  children,
  render,
  ...props
}) {
  const renderProp = asChild && React.isValidElement(children) ? children : render;
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      render={renderProp}
      {...props}
    >
      {!renderProp ? children : undefined}
    </CollapsiblePrimitive.Root>
  );
}

function CollapsibleTrigger({
  asChild = false,
  nativeButton,
  children,
  render,
  ...props
}) {
  const renderProp = asChild && React.isValidElement(children) ? children : render;
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      render={renderProp}
      nativeButton={resolveNativeButton(renderProp, nativeButton)}
      {...props}
    >
      {!renderProp ? children : undefined}
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsibleContent({
  asChild = false,
  children,
  render,
  ...props
}) {
  const renderProp = asChild && React.isValidElement(children) ? children : render;
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      render={renderProp}
      {...props}
    >
      {!renderProp ? children : undefined}
    </CollapsiblePrimitive.Panel>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };

