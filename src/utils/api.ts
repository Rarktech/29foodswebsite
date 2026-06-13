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
  let envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    let base = envUrl.trim();
    
    // De-duplicate ending slashes
    while (base.endsWith('/')) {
      base = base.slice(0, -1);
    }

    // Defensive check: If they appended '/api' at the end of their VITE_API_URL on Vercel
    // (e.g., "https://xyz.run.app/api"), and our cleanPath already has "/api/...",
    // we must prevent overlapping paths like "/api/api/..." by stripping "/api" from cleanPath.
    if (base.endsWith('/api') && cleanPath.startsWith('/api')) {
      return `${base}${cleanPath.slice(4)}`; // Strip '/api' (4 characters)
    }

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
      // Redirect to the stable active Cloud Run production backend container
      const defaultBackend = "https://ais-pre-zwhqys5pnqqwnhwouwwmbl-398576201729.europe-west2.run.app";
      return `${defaultBackend}${cleanPath}`;
    }
  }

  // 3. Localhost or same-origin fallback
  return cleanPath;
}
