/**
 * Intelligent API Route Resolver
 * 
 * Resolves the backend server endpoint URL dynamically.
 * Maps relative paths directly on locally unified environments,
 * but redirects to the active Cloud Run container if the frontend is hosted on Vercel/Netlify.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. Explicitly check for user-defined VITE_API_URL (e.g. customized Vercel config)
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl) {
    const base = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return `${base}${cleanPath}`;
  }

  // 2. Intelligent external deployment detection
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isExternalHost = 
      host.includes("vercel.app") || 
      host.includes("netlify.app") || 
      host.includes("github.dev") || 
      host.includes("amplifyapp.com") ||
      host.includes("pages.dev") ||
      host.includes("web.app"); // Firebase hosting fallback

    if (isExternalHost) {
      // Redirect to the active Cloud Run API Container endpoint
      const defaultBackend = "https://ais-dev-zwhqys5pnqqwnhwouwwmbl-398576201729.europe-west2.run.app";
      return `${defaultBackend}${cleanPath}`;
    }
  }

  // 3. Localhost or same-origin fallback
  return cleanPath;
}
