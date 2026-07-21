/// <reference types="vite/client" />

declare module '~icons/fluent/*' {
  const component: any
  export default component
}

declare module '~icons/ant-design/*' {
  const component: any
  export default component
}

declare module '~icons/akar-icons/*' {
  const component: any
  export default component
}

declare module '~icons/carbon/*' {
  const component: any
  export default component
}

declare module '@/services/*' {
  const api: any
  export default api
}

declare module '@/utils/apiError' {
  export function getApiErrorMessage(error: any, fallback?: string): string
  export function getApiErrors(error: any): Record<string, string[]> | null
  export function isApiError(error: any): boolean
}

declare module '@/utils/logger' {
  const logger: {
    error(message: string, context?: Record<string, any>): void
    warn(message: string, context?: Record<string, any>): void
    info(message: string, context?: Record<string, any>): void
    debug(message: string, context?: Record<string, any>): void
  }
  export default logger
}

declare module '@/utils/getValues' {
  export function getValues(formData: any): any
}

declare module '@/constants' {
  export const paymentOptions: { label: string; value: string }[]
}

declare module 'vuestic-ui/css' {}

declare module '*.css' {
  const styles: { [className: string]: string }
  export default styles
}
