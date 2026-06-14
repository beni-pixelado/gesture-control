import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react';

// createAuthClient do @neondatabase/auth é a função correta.
// Recebe a URL do servidor hospedado pelo Neon e o adapter React.
// O adapter injeta os hooks do React (useSession, etc).
export const authClient = createAuthClient(
  import.meta.env.VITE_NEON_AUTH_URL,
  { adapter: BetterAuthReactAdapter() }
);