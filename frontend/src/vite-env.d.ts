/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_PLATFORM_ADDRESS: string
  readonly VITE_SCRIPT_ADDRESS: string
  readonly VITE_POLICY_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
