import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
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
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase.js";

import useAppDialog from "../hooks/useAppDialog.jsx";

function AuthScreen() {
  // =========================================
  // PAGE MODE
  // =========================================

  const [
    createMode,
    setCreateMode,
  ] = useState(false);

  // =========================================
  // FORM
  // =========================================

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

  // =========================================
  // LOADING
  // =========================================

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const [
    resetLoading,
    setResetLoading,
  ] = useState(false);

  // =========================================
  // PASSWORD VISIBILITY
  // =========================================

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  // =========================================
  // CUSTOM DIALOG
  // =========================================

  const {
    Dialog,
    success,
    warning,
    error,
  } = useAppDialog();

  // =========================================
  // HELPERS
  // =========================================

  const cleanEmail = (value) =>
    String(value)
      .trim()
      .toLowerCase();

  const cleanName = (value) =>
    String(value)
      .trim()
      .replace(/\s+/g, " ");

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
  // FIND EXISTING PROFILE BY EMAIL
  // =========================================

  const findExistingProfileByEmail =
    async (emailAddress) => {
      const normalizedEmail =
        cleanEmail(
          emailAddress
        );

      if (!normalizedEmail) {
        return null;
      }

      try {
        const usersQuery =
          query(
            collection(
              db,
              "users"
            ),
            where(
              "email",
              "==",
              normalizedEmail
            )
          );

        const snapshot =
          await getDocs(
            usersQuery
          );

        if (
          snapshot.empty
        ) {
          return null;
        }

        const firstDoc =
          snapshot.docs[0];

        return {
          id:
            firstDoc.id,
          ...firstDoc.data(),
        };
      } catch (err) {
        console.error(
          "Find profile by email error:",
          err
        );

        return null;
      }
    };

  // =========================================
  // SYNC USER PROFILE
  // =========================================

  const syncUserProfile =
    async ({
      firebaseUser,
      preferredDisplayName = "",
      normalizedEmail = "",
    }) => {
      const userRef =
        doc(
          db,
          "users",
          firebaseUser.uid
        );

      const userSnapshot =
        await getDoc(
          userRef
        );

      const currentData =
        userSnapshot.exists()
          ? userSnapshot.data()
          : null;

      let username =
        currentData
          ?.username ||
        "";

      let preservedName =
        currentData
          ?.displayName ||
        "";

      // If this UID does not already have a username,
      // look for an existing profile using the same email.
      if (!username) {
        const emailProfile =
          await findExistingProfileByEmail(
            normalizedEmail ||
              firebaseUser.email
          );

        if (
          emailProfile &&
          emailProfile.id !==
            firebaseUser.uid
        ) {
          if (
            emailProfile.username
          ) {
            username =
              emailProfile.username;
          }

          if (
            !preservedName &&
            emailProfile.displayName
          ) {
            preservedName =
              emailProfile.displayName;
          }
        }
      }

      const finalDisplayName =
        cleanName(
          preferredDisplayName
        ) ||
        cleanName(
          firebaseUser.displayName
        ) ||
        cleanName(
          preservedName
        );

      if (
        userSnapshot.exists()
      ) {
        await setDoc(
          userRef,
          {
            displayName:
              finalDisplayName ||
              currentData
                ?.displayName ||
              "",

            email:
              cleanEmail(
                normalizedEmail ||
                  firebaseUser.email
              ),

            photoURL:
              firebaseUser.photoURL ||
              currentData
                ?.photoURL ||
              null,

            ...(username
              ? {
                  username,
                }
              : {}),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      } else {
        await setDoc(
          userRef,
          {
            displayName:
              finalDisplayName,

            username:
              username ||
              "",

            email:
              cleanEmail(
                normalizedEmail ||
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
      }
    };

  // =========================================
  // EMAIL LOGIN
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

        const credential =
          await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
          );

        await syncUserProfile({
          firebaseUser:
            credential.user,
          normalizedEmail,
        });
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

      const normalizedName =
        cleanName(
          displayName
        );

      if (
        normalizedName.length <
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
              normalizedName,
          }
        );

        await syncUserProfile({
          firebaseUser,
          preferredDisplayName:
            normalizedName,
          normalizedEmail,
        });
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
  // FORGOT PASSWORD
  // =========================================

  const handleForgotPassword =
    async () => {
      const normalizedEmail =
        cleanEmail(email);

      if (!normalizedEmail) {
        await warning(
          "Email Required",
          "Enter your email address first, then click Forgot Password."
        );

        return;
      }

      try {
        setResetLoading(
          true
        );

        await sendPasswordResetEmail(
          auth,
          normalizedEmail
        );

        await success(
          "Reset Request Sent",
          `If ${normalizedEmail} is registered with Email/Password, a password reset email will be sent. Check your Inbox, Spam, Junk, and Promotions folders.`
        );
      } catch (err) {
        console.error(
          "Password reset error:",
          err
        );

        let message =
          "We couldn't send the password reset email.";

        switch (
          err?.code
        ) {
          case "auth/invalid-email":
            message =
              "Enter a valid email address.";
            break;

          case "auth/user-not-found":
            message =
              "No Email/Password account was found for this email.";
            break;

          case "auth/too-many-requests":
            message =
              "Too many reset attempts were made. Wait a little and try again.";
            break;

          case "auth/network-request-failed":
            message =
              "Check your internet connection and try again.";
            break;

          case "auth/operation-not-allowed":
            message =
              "Email/Password authentication is not enabled in Firebase.";
            break;

          default:
            message =
              err?.message ||
              message;
        }

        await error(
          "Unable to Reset Password",
          message
        );
      } finally {
        setResetLoading(
          false
        );
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

        await syncUserProfile({
          firebaseUser,
          preferredDisplayName:
            firebaseUser.displayName ||
            "",
          normalizedEmail:
            firebaseUser.email ||
            "",
        });
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
  // SWITCH TO CREATE ACCOUNT
  // =========================================

  const openCreateAccount =
    () => {
      setCreateMode(true);

      setPassword("");
      setConfirmPassword("");

      setShowPassword(false);
      setShowConfirmPassword(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =========================================
  // BACK TO SIGN IN
  // =========================================

  const backToSignIn =
    () => {
      setCreateMode(false);

      setPassword("");
      setConfirmPassword("");

      setShowPassword(false);
      setShowConfirmPassword(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const busy =
    loading ||
    googleLoading ||
    resetLoading;

  // =========================================
  // UI
  // =========================================

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#eaf0fa]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[380px] w-[380px] rounded-full bg-[#cfdcff]/50 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[430px] w-[430px] rounded-full bg-[#b9c9ff]/45 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 md:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:px-10 xl:px-14">
        {/* =====================================
            DESKTOP / LANDSCAPE
        ====================================== */}

        <section className="hidden lg:block">
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

          <div className="mt-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cbd6ef] bg-white/60 px-3 py-2 text-xs font-bold text-[#294aad] shadow-sm backdrop-blur">
              <Sparkles
                size={14}
              />

              Easy expense sharing
            </div>

            <h1 className="mt-5 text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#182442]">
              Split expenses without
              the awkward math.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#71809a]">
              Keep track of shared
              expenses, balances,
              payments and wallet
              details in one place.
            </p>
          </div>

          <div className="mt-9 space-y-3">
            <div className="flex max-w-xl items-center gap-4 rounded-[22px] border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#142a76] text-lg font-extrabold text-white">
                1
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4ebff] text-[#142a76]">
                <Server
                  size={20}
                />
              </div>

              <div>
                <p className="font-extrabold text-[#182442]">
                  Create or join a server
                </p>

                <p className="mt-1 text-sm text-[#8995aa]">
                  Keep each group,
                  trip or household
                  organized.
                </p>
              </div>
            </div>

            <div className="flex max-w-xl items-center gap-4 rounded-[22px] border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#294aad] text-lg font-extrabold text-white">
                2
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4ebff] text-[#142a76]">
                <ReceiptText
                  size={20}
                />
              </div>

              <div>
                <p className="font-extrabold text-[#182442]">
                  Add shared expenses
                </p>

                <p className="mt-1 text-sm text-[#8995aa]">
                  Choose who covered
                  the expense and who
                  should be included.
                </p>
              </div>
            </div>

            <div className="flex max-w-xl items-center gap-4 rounded-[22px] border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3d63d2] text-lg font-extrabold text-white">
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
                  Check balances and
                  payment details when
                  it's time to settle.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
            AUTH SIDE
        ====================================== */}

        <section className="mx-auto w-full max-w-md self-center lg:max-w-[460px]">
          {/* MOBILE LOGO */}

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

          {/* MOBILE STEPS */}

          {!createMode && (
            <div className="mb-5 grid grid-cols-3 gap-2 lg:hidden">
              <div className="rounded-[16px] bg-white/75 p-3 text-center shadow-sm">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#142a76] text-xs font-extrabold text-white">
                  1
                </div>

                <p className="mt-2 text-[10px] font-extrabold text-[#52617d]">
                  Join Server
                </p>
              </div>

              <div className="rounded-[16px] bg-white/75 p-3 text-center shadow-sm">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#294aad] text-xs font-extrabold text-white">
                  2
                </div>

                <p className="mt-2 text-[10px] font-extrabold text-[#52617d]">
                  Add Expense
                </p>
              </div>

              <div className="rounded-[16px] bg-white/75 p-3 text-center shadow-sm">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#3d63d2] text-xs font-extrabold text-white">
                  3
                </div>

                <p className="mt-2 text-[10px] font-extrabold text-[#52617d]">
                  Settle Up
                </p>
              </div>
            </div>
          )}

          {/* CARD */}

          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(31,53,108,0.14)] backdrop-blur-xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#10245f] via-[#142a76] to-[#294aad] p-6 text-white">
              {createMode && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={
                    backToSignIn
                  }
                  className="relative z-10 mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-xs font-extrabold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft
                    size={16}
                  />

                  Back to Google Sign-In
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
                    ? "Create your Money Splitter account using your email and password."
                    : "Sign in to continue to your servers, balances and shared expenses."}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {/* GOOGLE */}

              {!createMode && (
                <>
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

                  {!createMode && (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={
                          handleForgotPassword
                        }
                        className="text-xs font-extrabold text-[#294aad] transition hover:text-[#142a76] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resetLoading
                          ? "Sending..."
                          : "Forgot Password?"}
                      </button>
                    </div>
                  )}
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
                    <LockKeyhole
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
                    Don't have an account?
                  </p>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={
                      openCreateAccount
                    }
                    className="mt-1 inline-flex items-center gap-1 font-extrabold text-[#294aad] transition hover:text-[#142a76] disabled:opacity-50"
                  >
                    Create one

                    <ArrowRight
                      size={15}
                    />
                  </button>
                </div>
              )}

              {/* BACK TO GOOGLE */}

              {createMode && (
                <div className="mt-6 rounded-[18px] border border-[#dce5f6] bg-[#f7f9ff] p-4 text-center">
                  <p className="text-sm text-[#71809a]">
                    Already have an account
                    or prefer Google?
                  </p>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={
                      backToSignIn
                    }
                    className="mt-2 inline-flex items-center gap-2 font-extrabold text-[#294aad] transition hover:text-[#142a76] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft
                      size={15}
                    />

                    Back to Sign In & Google
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}

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