/**
 * use-toast — 안전한 fallback 버전
 */
import * as React from "react";

// notify가 없으면 fallback 사용
const fallbackNotify = {
  success: (msg: any) => console.log("✅", msg),
  error: (msg: any) => console.error("❌", msg),
  info: (msg: any) => console.log("ℹ️", msg),
  warning: (msg: any) => console.warn("⚠️", msg),
  message: (msg: any) => console.log("📢", msg),
  dismiss: () => {},
};

type Variant = "default" | "destructive" | "success" | "warning" | "info";

type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: Variant;
  action?: React.ReactNode;
  duration?: number;
};

type ToastReturn = { id: string | number; dismiss: () => void; update: () => void };

function classify(variant?: Variant) {
  if (variant === "destructive") return "error";
  if (variant === "success") return "success";
  if (variant === "warning") return "warning";
  if (variant === "info") return "info";
  return "message";
}

function toast({ title, description, variant, duration }: ToastInput = {}): ToastReturn {
  const kind = classify(variant);
  const message = title ?? description ?? "알림";

  // notify가 있으면 사용, 없으면 fallback
  const notify = (window as any).__PHONARA_NOTIFY || fallbackNotify;
  
  if (kind === "error") {
    notify.error?.(message);
  } else if (kind === "success") {
    notify.success?.(message);
  } else {
    notify.message?.(message);
  }

  return {
    id: Date.now(),
    dismiss: () => {},
    update: () => {},
  };
}

function useToast() {
  return {
    toast,
    dismiss: () => {},
    toasts: [] as Array<{ id: string }>,
  };
}

export { useToast, toast };