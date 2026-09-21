import type * as React from "react";

// The mockup preview keeps the toast hook for generated components, but the
// current mockup does not render a toast provider. Keep the shared types here
// so the workspace can typecheck without pulling the full app UI into the
// preview bundle.
export type ToastProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: unknown;
};

export type ToastActionElement = React.ReactElement;