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

      alert(
        "Unable to sign in with Google."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">

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
          Sign in so your servers,
          expenses and payment history
          stay private.
        </p>

        <button
          type="button"
          onClick={signIn}
          className="mt-8 min-h-14 w-full rounded-2xl bg-white px-5 font-bold text-slate-950 transition hover:bg-slate-200"
        >
          Continue with Google
        </button>

      </div>

    </div>
  );
}

export default AuthScreen;