import { toast as sonnerToast } from "sonner"

const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, { description }),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, { description }),
  loading: (message: string, description?: string) =>
    sonnerToast.loading(message, { description }),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
}

export { toast }
