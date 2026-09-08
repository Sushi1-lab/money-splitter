import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  PlusCircle,
  ReceiptText,
  Server,
  Sparkles,
  UserPlus,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase.js";

import useAppDialog from "../hooks/useAppDialog.jsx";

function AuthScreen() {
  const [
    createMode,
    setCreateMode,
  ] = useState(false);

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const {
    Dialog,
    warning,
    error,
  } = useAppDialog();

  // =========================================
  // HELPERS
  // =========================================

  const cleanEmail = (
    value
  ) =>
    String(value)
      .trim()
      .toLowerCase();

  const getAuthErrorMessage = (
    authError
  ) => {
    const code =
      authError?.code ||
      "";

    switch (code) {
      case "auth/invalid-email":
        return "Enter a valid email address.";

      case "auth/user-disabled":
        return "This account has been disabled.";

      case "auth/user-not-found":
        return "We couldn't find an account with this email.";

      case "auth/wrong-password":
        return "The password you entered is incorrect.";

      case "auth/invalid-credential":
        return "The email or password you entered is incorrect.";

      case "auth/email-already-in-use":
        return "An account already exists with this email.";

      case "auth/weak-password":
        return "Your password is too weak. Use at least 6 characters.";

      case "auth/missing-password":
        return "Please enter your password.";

      case "auth/too-many-requests":
        return "Too many attempts were made. Please wait a little and try again.";

      case "auth/network-request-failed":
        return "We couldn't connect to the internet. Check your connection and try again.";

      case "auth/popup-blocked":
        return "Your browser blocked the Google sign-in window. Allow popups and try again.";

      case "auth/unauthorized-domain":
        return "This website is not authorized for Firebase Authentication.";

      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using another sign-in method.";

      case "auth/operation-not-allowed":
        return "This sign-in method is currently unavailable.";

      default:
        return (
          authError?.message ||
          "Something went wrong. Please try again."
        );
    }
  };

  // =========================================
  // LOGIN
  // =========================================

  const handleLogin =
    async (event) => {
      event.preventDefault();

      const normalizedEmail =
        cleanEmail(email);

      if (!normalizedEmail) {
        await warning(
          "Email Required",
          "Enter your email address."
        );

        return;
      }

      if (!password) {
        await warning(
          "Password Required",
          "Enter your password."
        );

        return;
      }

      try {
        setLoading(true);

        await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );
      } catch (err) {
        console.error(
          "Login error:",
          err
        );

        await error(
          "Unable to Sign In",
          getAuthErrorMessage(
            err
          )
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================================
  // CREATE ACCOUNT
  // =========================================

  const handleCreateAccount =
    async (event) => {
      event.preventDefault();

      const normalizedEmail =
        cleanEmail(email);

      const cleanName =
        displayName
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      if (
        cleanName.length <
        2
      ) {
        await warning(
          "Name Required",
          "Enter your name using at least 2 characters."
        );

        return;
      }

      if (!normalizedEmail) {
        await warning(
          "Email Required",
          "Enter your email address."
        );

        return;
      }

      if (
        password.length <
        6
      ) {
        await warning(
          "Password Too Short",
          "Your password must contain at least 6 characters."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        await warning(
          "Passwords Don't Match",
          "Make sure both passwords are the same."
        );

        return;
      }

      try {
        setLoading(true);

        const credential =
          await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
          );

        const firebaseUser =
          credential.user;

        await updateProfile(
          firebaseUser,
          {
            displayName:
              cleanName,
          }
        );

        await setDoc(
          doc(
            db,
            "users",
            firebaseUser.uid
          ),
          {
            displayName:
              cleanName,

            username:
              "",

            email:
              normalizedEmail,

            photoURL:
              firebaseUser.photoURL ||
              null,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      } catch (err) {
        console.error(
          "Create account error:",
          err
        );

        await error(
          "Unable to Create Account",
          getAuthErrorMessage(
            err
          )
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================================
  // GOOGLE SIGN IN
  // =========================================

  const handleGoogleLogin =
    async () => {
      try {
        setGoogleLoading(
          true
        );

        const provider =
          new GoogleAuthProvider();

        provider.setCustomParameters({
          prompt:
            "select_account",
        });

        const credential =
          await signInWithPopup(
            auth,
            provider
          );

        const firebaseUser =
          credential.user;

        const userRef =
          doc(
            db,
            "users",
            firebaseUser.uid
          );

        const snapshot =
          await getDoc(
            userRef
          );

        if (
          !snapshot.exists()
        ) {
          await setDoc(
            userRef,
            {
              displayName:
                firebaseUser.displayName ||
                "",

              username:
                "",

              email:
                cleanEmail(
                  firebaseUser.email
                ),

              photoURL:
                firebaseUser.photoURL ||
                null,

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );
        } else {
          await setDoc(
            userRef,
            {
              email:
                cleanEmail(
                  firebaseUser.email
                ),

              photoURL:
                firebaseUser.photoURL ||
                snapshot.data()
                  ?.photoURL ||
                null,

              updatedAt:
                serverTimestamp(),
            },
            {
              merge: true,
            }
          );
        }
      } catch (err) {
        console.error(
          "Google sign-in error:",
          err
        );

        if (
          err?.code ===
            "auth/popup-closed-by-user" ||
          err?.code ===
            "auth/cancelled-popup-request"
        ) {
          return;
        }

        await error(
          "Google Sign-In Failed",
          getAuthErrorMessage(
            err
          )
        );
      } finally {
        setGoogleLoading(
          false
        );
      }
    };

  // =========================================
  // MODE
  // =========================================

  const openCreateAccount =
    () => {
      setCreateMode(
        true
      );

      setPassword(
        ""
      );

      setConfirmPassword(
        ""
      );

      setShowPassword(
        false
      );

      setShowConfirmPassword(
        false
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const backToSignIn =
    () => {
      setCreateMode(
        false
      );

      setPassword(
        ""
      );

      setConfirmPassword(
        ""
      );

      setShowPassword(
        false
      );

      setShowConfirmPassword(
        false
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const busy =
    loading ||
    googleLoading;

  // =========================================
  // UI
  // =========================================

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#eaf0fa]">
      {/* BACKGROUND GRAPHICS */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-[380px] w-[380px] rounded-full bg-[#cfdcff]/50 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[430px] w-[430px] rounded-full bg-[#b9c9ff]/45 blur-3xl" />

      <div className="pointer-events-none absolute left-[46%] top-[10%] hidden h-32 w-32 rotate-12 rounded-[35px] border border-white/50 bg-white/20 backdrop-blur-sm lg:block" />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 xl:px-14">
        {/* =====================================
            LEFT SIDE
        ====================================== */}

        <section className="hidden lg:block">
          {/* BRAND */}

          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#10245f] to-[#294aad] text-white shadow-[0_12px_30px_rgba(20,42,118,0.2)]">
              <CircleDollarSign
                size={29}
              />
            </div>

            <div>
              <p className="text-2xl font-extrabold text-[#182442]">
                Money Splitter
              </p>

              <p className="text-sm text-[#8995aa]">
                Shared expenses,
                simplified.
              </p>
            </div>
          </div>

          {/* HEADLINE */}

          <div className="mt-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cbd6ef] bg-white/60 px-3 py-2 text-xs font-bold text-[#294aad] shadow-sm backdrop-blur">
              <Sparkles
                size={14}
              />

              Easy expense sharing
            </div>

            <h1 className="mt-5 text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#182442]">
              Split expenses
              without the awkward
              math.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#71809a]">
              Keep track of shared
              expenses, balances,
              payments and wallet
              details in one place.
            </p>
          </div>

          {/* =================================
              1 - 2 - 3 SECTION
          ================================== */}

          <div className="mt-9 space-y-3">
            {/* STEP 1 */}

            <div className="group flex max-w-xl items-center gap-4 rounded-[22px] border border-white/70 bg-white/65 p-4 shadow-[0_12px_30px_rgba(40,64,120,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#142a76] text-lg font-extrabold text-white shadow-sm">
                1
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4ebff] text-[#142a76]">
                <Server
                  size={20}
                />
              </div>

              <div>
                <p className="font-extrabold text-[#182442]">
                  Create or join a
                  server
                </p>

                <p className="mt-1 text-sm text-[#8995aa]">
                  Keep each group,
                  trip or household
                  organized.
                </p>
              </div>
            </div>

            {/* STEP 2 */}

            <div className="group flex max-w-xl items-center gap-4 rounded-[22px] border border-white/70 bg-white/65 p-4 shadow-[0_12px_30px_rgba(40,64,120,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#294aad] text-lg font-extrabold text-white shadow-sm">
                2
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4ebff] text-[#142a76]">
                <ReceiptText
                  size={20}
                />
              </div>

              <div>
                <p className="font-extrabold text-[#182442]">
                  Add shared
                  expenses
                </p>

                <p className="mt-1 text-sm text-[#8995aa]">
                  Choose who
                  covered it and
                  who should be
                  included.
                </p>
              </div>
            </div>

            {/* STEP 3 */}

            <div className="group flex max-w-xl items-center gap-4 rounded-[22px] border border-white/70 bg-white/65 p-4 shadow-[0_12px_30px_rgba(40,64,120,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3d63d2] text-lg font-extrabold text-white shadow-sm">
                3
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4ebff] text-[#142a76]">
                <WalletCards
                  size={20}
                />
              </div>

              <div>
                <p className="font-extrabold text-[#182442]">
                  See who owes who
                </p>

                <p className="mt-1 text-sm text-[#8995aa]">
                  Check balances
                  and open payment
                  details when it's
                  time to settle.
                </p>
              </div>
            </div>
          </div>

          {/* =================================
              SMALL GRAPHIC PREVIEW
          ================================== */}

          <div className="relative mt-8 max-w-xl">
            <div className="rounded-[26px] border border-white/70 bg-gradient-to-br from-[#10245f] to-[#294aad] p-5 text-white shadow-[0_20px_55px_rgba(20,42,118,0.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100/60">
                    Example Balance
                  </p>

                  <p className="mt-1 text-lg font-extrabold">
                    Dinner Split
                  </p>
                </div>

                <div className="flex -space-x-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#294aad] bg-white text-xs font-extrabold text-[#142a76]">
                    M
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#294aad] bg-[#dfe7ff] text-xs font-extrabold text-[#142a76]">
                    R
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#294aad] bg-[#c9d6ff] text-xs font-extrabold text-[#142a76]">
                    J
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[18px] bg-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <UserRound
                      size={18}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-blue-100/60">
                      Ron owes Marl
                    </p>

                    <p className="font-extrabold">
                      ₱450.00
                    </p>
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-blue-100/70"
                  />

                  <CheckCircle2
                    size={20}
                    className="text-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="absolute -right-5 -top-5 flex h-16 w-16 rotate-6 items-center justify-center rounded-[20px] bg-white text-[#294aad] shadow-[0_12px_35px_rgba(40,64,120,0.15)]">
              <PlusCircle
                size={28}
              />
            </div>
          </div>
        </section>

        {/* =====================================
            RIGHT SIDE LOGIN
        ====================================== */}

        <section className="mx-auto w-full max-w-md">
          {/* MOBILE BRAND */}

          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#10245f] to-[#294aad] text-white shadow-[0_12px_30px_rgba(20,42,118,0.2)]">
              <WalletCards
                size={31}
              />
            </div>

            <h1 className="mt-4 text-2xl font-extrabold text-[#182442]">
              Money Splitter
            </h1>

            <p className="mt-1 text-sm text-[#8995aa]">
              Shared expenses,
              simplified.
            </p>
          </div>

          {/* MOBILE 1-2-3 */}

          {!createMode && (
            <div className="mb-5 grid grid-cols-3 gap-2 lg:hidden">
              <div className="rounded-[16px] bg-white/75 p-3 text-center shadow-sm backdrop-blur">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#142a76] text-xs font-extrabold text-white">
                  1
                </div>

                <p className="mt-2 text-[10px] font-extrabold text-[#52617d]">
                  Join Server
                </p>
              </div>

              <div className="rounded-[16px] bg-white/75 p-3 text-center shadow-sm backdrop-blur">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#294aad] text-xs font-extrabold text-white">
                  2
                </div>

                <p className="mt-2 text-[10px] font-extrabold text-[#52617d]">
                  Add Expense
                </p>
              </div>

              <div className="rounded-[16px] bg-white/75 p-3 text-center shadow-sm backdrop-blur">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#3d63d2] text-xs font-extrabold text-white">
                  3
                </div>

                <p className="mt-2 text-[10px] font-extrabold text-[#52617d]">
                  Settle Up
                </p>
              </div>
            </div>
          )}

          {/* AUTH CARD */}

          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(31,53,108,0.14)] backdrop-blur-xl">
            {/* HEADER */}

            <div className="relative overflow-hidden bg-gradient-to-br from-[#10245f] via-[#142a76] to-[#294aad] p-6 text-white">
              <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border-[18px] border-white/5" />

              <div className="pointer-events-none absolute bottom-0 right-16 h-16 w-16 rounded-t-full bg-white/5" />

              {createMode && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={
                    backToSignIn
                  }
                  className="relative z-10 mb-4 inline-flex min-h-9 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-bold transition hover:bg-white/15"
                >
                  <ArrowLeft
                    size={15}
                  />

                  Back to Sign In
                </button>
              )}

              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100/60">
                  {createMode
                    ? "Get Started"
                    : "Welcome"}
                </p>

                <h2 className="mt-1 text-2xl font-extrabold">
                  {createMode
                    ? "Create Account"
                    : "Welcome Back"}
                </h2>

                <p className="mt-2 max-w-xs text-sm leading-6 text-blue-100/70">
                  {createMode
                    ? "Create your Money Splitter account and start organizing shared expenses."
                    : "Sign in to continue to your servers, balances and shared expenses."}
                </p>
              </div>
            </div>

            {/* BODY */}

            <div className="p-5 sm:p-6">
              {!createMode && (
                <>
                  {/* GOOGLE */}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={
                      handleGoogleLogin
                    }
                    className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-[15px] border border-[#dce3ef] bg-white px-4 text-sm font-extrabold text-[#34415c] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f6f8fc] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cbd4e5] border-t-[#142a76]" />
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.873h5.382a4.6 4.6 0 0 1-1.996 3.018v2.509h3.232c1.891-1.741 2.982-4.305 2.982-7.355Z"
                        />

                        <path
                          fill="#34A853"
                          d="M12 22c2.7 0 4.964-.895 6.618-2.418l-3.232-2.509c-.895.6-2.041.955-3.386.955-2.605 0-4.809-1.759-5.595-4.123H3.064v2.591A10 10 0 0 0 12 22Z"
                        />

                        <path
                          fill="#FBBC05"
                          d="M6.405 13.905A6.02 6.02 0 0 1 6.091 12c0-.664.114-1.309.314-1.905V7.504H3.064A10 10 0 0 0 2 12c0 1.614.386 3.141 1.064 4.496l3.341-2.591Z"
                        />

                        <path
                          fill="#EA4335"
                          d="M12 5.973c1.468 0 2.786.504 3.823 1.491l2.868-2.868C16.959 2.982 14.7 2 12 2a10 10 0 0 0-8.936 5.504l3.341 2.591C7.191 7.732 9.395 5.973 12 5.973Z"
                        />
                      </svg>
                    )}

                    {googleLoading
                      ? "Opening Google..."
                      : "Continue with Google"}
                  </button>

                  {/* DIVIDER */}

                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#e0e6ef]" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0aabd]">
                      or use email
                    </span>

                    <div className="h-px flex-1 bg-[#e0e6ef]" />
                  </div>
                </>
              )}

              {/* FORM */}

              <form
                onSubmit={
                  createMode
                    ? handleCreateAccount
                    : handleLogin
                }
                className="space-y-4"
              >
                {/* DISPLAY NAME */}

                {createMode && (
                  <div>
                    <label className="app-label">
                      Display Name
                    </label>

                    <div className="relative">
                      <UserRound
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
                      />

                      <input
                        type="text"
                        value={
                          displayName
                        }
                        onChange={(
                          event
                        ) =>
                          setDisplayName(
                            event.target
                              .value
                          )
                        }
                        disabled={busy}
                        autoComplete="name"
                        placeholder="Your name"
                        className="app-input app-input-icon"
                      />
                    </div>
                  </div>
                )}

                {/* EMAIL */}

                <div>
                  <label className="app-label">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(
                        event
                      ) =>
                        setEmail(
                          event.target
                            .value
                        )
                      }
                      disabled={busy}
                      autoComplete="email"
                      placeholder="you@email.com"
                      className="app-input app-input-icon"
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <label className="app-label">
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        password
                      }
                      onChange={(
                        event
                      ) =>
                        setPassword(
                          event.target
                            .value
                        )
                      }
                      disabled={busy}
                      autoComplete={
                        createMode
                          ? "new-password"
                          : "current-password"
                      }
                      placeholder={
                        createMode
                          ? "At least 6 characters"
                          : "Enter password"
                      }
                      className="app-input app-input-icon pr-12"
                    />

                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() =>
                        setShowPassword(
                          (
                            current
                          ) =>
                            !current
                        )
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8995aa] transition hover:bg-[#edf1f7] hover:text-[#142a76]"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={18}
                        />
                      ) : (
                        <Eye
                          size={18}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}

                {createMode && (
                  <div>
                    <label className="app-label">
                      Confirm Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
                      />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          confirmPassword
                        }
                        onChange={(
                          event
                        ) =>
                          setConfirmPassword(
                            event.target
                              .value
                          )
                        }
                        disabled={busy}
                        autoComplete="new-password"
                        placeholder="Enter password again"
                        className="app-input app-input-icon pr-12"
                      />

                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() =>
                          setShowConfirmPassword(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8995aa] transition hover:bg-[#edf1f7] hover:text-[#142a76]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff
                            size={18}
                          />
                        ) : (
                          <Eye
                            size={18}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={busy}
                  className="app-button-primary flex min-h-[54px] w-full items-center justify-center gap-2 shadow-[0_10px_24px_rgba(20,42,118,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : createMode ? (
                    <UserPlus
                      size={18}
                    />
                  ) : (
                    <LogIn
                      size={18}
                    />
                  )}

                  {loading
                    ? createMode
                      ? "Creating Account..."
                      : "Signing In..."
                    : createMode
                      ? "Create Account"
                      : "Sign In"}
                </button>
              </form>

              {/* CREATE ACCOUNT LINK */}

              {!createMode && (
                <div className="mt-6 rounded-[18px] bg-[#eef3ff] p-4 text-center">
                  <p className="text-sm text-[#71809a]">
                    Don't have an
                    account?
                  </p>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={
                      openCreateAccount
                    }
                    className="mt-1 inline-flex items-center gap-1 font-extrabold text-[#294aad] transition hover:text-[#142a76]"
                  >
                    Create one

                    <ArrowRight
                      size={15}
                    />
                  </button>
                </div>
              )}

              {createMode && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-[#8995aa]">
                    Already have an
                    account?{" "}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={
                        backToSignIn
                      }
                      className="font-extrabold text-[#294aad]"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SMALL TRUST ROW */}

          {!createMode && (
            <div className="mt-5 flex items-center justify-center gap-5 text-[11px] font-bold text-[#8995aa]">
              <span className="flex items-center gap-1.5">
                <UsersRound
                  size={14}
                />

                Groups
              </span>

              <span className="h-3 w-px bg-[#cfd7e5]" />

              <span className="flex items-center gap-1.5">
                <ReceiptText
                  size={14}
                />

                Expenses
              </span>

              <span className="h-3 w-px bg-[#cfd7e5]" />

              <span className="flex items-center gap-1.5">
                <WalletCards
                  size={14}
                />

                Payments
              </span>
            </div>
          )}
        </section>
      </div>

      <Dialog />
    </main>
  );
}

export default AuthScreen;