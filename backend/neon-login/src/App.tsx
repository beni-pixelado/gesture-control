
import { NeonAuthUIProvider, AuthView } from '@neondatabase/auth/react/ui';
import { authClient } from './auth';
import './App.css';

export default function App() {
  // Deriva a view atual do pathname para que /auth/sign-up mostre
  // o formulário de cadastro e /auth/sign-in mostre o de login.
  const pathname = window.location.pathname;

  return (
    <NeonAuthUIProvider authClient={authClient}>
      <AuthView
        pathname={pathname}
        redirectTo="/hub"
      />
    </NeonAuthUIProvider>
  );
}