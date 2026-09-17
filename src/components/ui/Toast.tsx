export interface ToastProps {
  message: string;
  visible?: boolean;
}

export function Toast({message, visible = true}: ToastProps) {
  if (!visible) return null;
  return <div className="ean-toast" role="status" aria-live="polite">{message}</div>;
}

export default Toast;
