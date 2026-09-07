import {
  signInWithPopup,
} from "firebase/auth";

import {
  auth,
  googleProvider,
} from "../firebase.js";

function AuthScreen() {
  const signIn = async () => {
    try {
      await signInWithPopup(
        auth,
        googleProvider
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      if (
        error.code ===
        "auth/unauthorized-domain"
      ) {
        alert(
          "This website domain is not authorized in Firebase Authentication."
        );

        return;
      }

      alert(
        "Unable to sign in with Google."
      );
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-white">

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 text-3xl">
          💸
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Expense Manager
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Money Splitter
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
          Sign in to access your private expense servers.
        </p>

        <button
          type="button"
          onClick={signIn}
          className="mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 font-bold text-slate-950 transition hover:bg-slate-200"
        >
          <span className="text-xl">
            G
          </span>

          Continue with Google
        </button>

      </div>

    </div>
  );
}

export default AuthScreen;