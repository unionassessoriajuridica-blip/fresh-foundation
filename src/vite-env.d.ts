/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extensão para SweetAlert2 (opcional, mas recomendado)
declare module 'sweetalert2' {
  interface SweetAlertOptions {
    customClass?: {
      popup?: string;
      container?: string;
      header?: string;
      title?: string;
      closeButton?: string;
      icon?: string;
      image?: string;
      content?: string;
      input?: string;
      actions?: string;
      confirmButton?: string;
      cancelButton?: string;
      footer?: string;
    };
  }
}