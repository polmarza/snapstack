import { Show, SignInButton, UserButton } from "@clerk/nextjs";

/** Controles de sesión de la cabecera: entrar con GitHub o menú de usuario. */
export function AuthControls() {
  return (
    <div data-testid="auth-controls" className="flex items-center">
      <Show
        when="signed-in"
        fallback={
          <SignInButton mode="modal">
            <button
              type="button"
              data-testid="sign-in-button"
              className="rounded-lg border border-edge px-4 py-2 text-sm hover:border-primary"
            >
              Entrar con GitHub
            </button>
          </SignInButton>
        }
      >
        <UserButton />
      </Show>
    </div>
  );
}
