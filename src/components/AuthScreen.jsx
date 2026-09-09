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
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-[#07184b]">
      {/* Deep premium background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(61,99,210,0.55),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(83,126,255,0.30),transparent_28%),linear-gradient(135deg,#07184b_0%,#10245f_48%,#09163d_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -left-10 top-36 h-52 w-52 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-32 -top-28 h-[430px] w-[430px] rounded-full bg-[#4169e1]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-160px] left-[38%] h-[380px] w-[380px] rounded-full bg-[#3155c5]/20 blur-3xl" />

      {/* Dot matrix */}
      <div className="pointer-events-none absolute left-[4%] top-[12%] hidden grid-cols-6 gap-3 opacity-20 lg:grid">
        {Array.from({ length: 30 }).map((_, index) => (
          <span key={index} className="h-1 w-1 rounded-full bg-white" />
        ))}
      </div>

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-[1440px] items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 xl:px-16">
        {/* HERO */}
        <section className="relative hidden min-h-[690px] lg:flex lg:flex-col lg:justify-center">
          <div className="relative z-20 max-w-[620px]">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[19px] border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
                <CircleDollarSign size={30} />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight text-white">Money Splitter</p>
                <p className="text-sm font-medium text-blue-100/55">Shared expenses, simplified.</p>
              </div>
            </div>

            <div className="mt-14 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold text-blue-100 shadow-lg backdrop-blur-xl">
              <Sparkles size={14} />
              Smarter shared spending
            </div>

            <h1 className="mt-6 max-w-[600px] text-[58px] font-black leading-[0.98] tracking-[-0.055em] text-white xl:text-[68px]">
              Split together.
              <span className="block bg-gradient-to-r from-[#9eb8ff] via-white to-[#7ea3ff] bg-clip-text text-transparent">Stay balanced.</span>
            </h1>

            <p className="mt-6 max-w-lg text-[16px] leading-7 text-blue-100/65">
              One beautiful space for group expenses, balances, payment methods and the moments you share.
            </p>
          </div>

          {/* Floating visual system */}
          <div className="relative z-20 mt-12 h-[255px] max-w-[650px]">
            <div className="absolute left-0 top-8 w-[330px] rotate-[-2deg] rounded-[26px] border border-white/15 bg-white/[0.11] p-5 shadow-[0_25px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-100/50">Weekend Dinner</p>
                  <p className="mt-1 text-3xl font-black text-white">₱2,480</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#a9c0ff]">
                  <ReceiptText size={21} />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                {["M", "R", "J", "R"].map((letter, index) => (
                  <div key={`${letter}-${index}`} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#18317a] bg-gradient-to-br from-[#6f91ed] to-[#294aad] text-xs font-black text-white">
                    {letter}
                  </div>
                ))}
                <span className="ml-2 text-xs font-bold text-blue-100/55">4 people included</span>
              </div>
            </div>

            <div className="absolute right-5 top-0 w-[245px] rotate-[3deg] rounded-[24px] border border-white/15 bg-white/[0.12] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-100/60">Your balance</span>
                <WalletCards size={18} className="text-[#a9c0ff]" />
              </div>
              <p className="mt-3 text-2xl font-black text-white">₱620.00</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#7d9cff] to-white" />
              </div>
              <p className="mt-3 text-[11px] font-semibold text-blue-100/50">Simple, clear, settled.</p>
            </div>

            <div className="absolute bottom-0 right-20 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#122c73]/80 px-4 py-3 shadow-xl backdrop-blur-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#70d7ae]/15 text-[#8ce7c2]">
                <UsersRound size={18} />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Everyone stays in sync</p>
                <p className="mt-0.5 text-[10px] text-blue-100/50">Track · split · settle</p>
              </div>
            </div>
          </div>
        </section>

        {/* AUTH */}
        <section className="mx-auto w-full max-w-[500px]">
          <div className="mb-7 text-center lg:hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-xl">
              <CircleDollarSign size={32} />
            </div>
            <h1 className="mt-4 text-2xl font-black text-white">Money Splitter</h1>
            <p className="mt-1 text-sm text-blue-100/55">Shared expenses, simplified.</p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-5 rounded-[42px] bg-gradient-to-br from-[#6e91ff]/25 to-transparent blur-2xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-white/20 bg-white/[0.96] shadow-[0_35px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#183680] via-[#2449aa] to-[#345ed0] px-6 py-7 text-white sm:px-8">
                <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full border-[28px] border-white/[0.06]" />
                <div className="pointer-events-none absolute bottom-[-65px] right-20 h-32 w-32 rounded-full bg-white/[0.06]" />
                <div className="pointer-events-none absolute right-8 top-7 grid grid-cols-4 gap-2 opacity-20">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <span key={index} className="h-1 w-1 rounded-full bg-white" />
                  ))}
                </div>

                {createMode && (
                  <button type="button" disabled={busy} onClick={backToSignIn} className="relative z-10 mb-5 inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-extrabold text-white transition hover:bg-white/20 disabled:opacity-50">
                    <ArrowLeft size={15} /> Back to Sign In
                  </button>
                )}

                <div className="relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/65">
                    {createMode ? "Start your journey" : "Welcome back"}
                  </p>
                  <h2 className="mt-2 text-[28px] font-black tracking-tight">
                    {createMode ? "Create your account" : "Good to see you again."}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100/70">
                    {createMode ? "Create your Money Splitter account and make shared spending easier." : "Your groups, balances and shared expenses are waiting for you."}
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {!createMode && (
                  <>
                    <button type="button" disabled={busy} onClick={handleGoogleLogin} className="group flex min-h-[54px] w-full items-center justify-center gap-3 rounded-2xl border border-[#dce3ef] bg-white px-4 text-sm font-extrabold text-[#34415c] shadow-[0_5px_18px_rgba(30,55,110,0.06)] transition hover:-translate-y-0.5 hover:border-[#bdcbed] hover:shadow-[0_10px_25px_rgba(30,55,110,0.10)] disabled:opacity-50">
                      {googleLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cbd4e5] border-t-[#142a76]" /> : (
                        <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.873h5.382a4.6 4.6 0 0 1-1.996 3.018v2.509h3.232c1.891-1.741 2.982-4.305 2.982-7.355Z" />
                          <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.418l-3.232-2.509c-.895.6-2.041.955-3.386.955-2.605 0-4.809-1.759-5.595-4.123H3.064v2.591A10 10 0 0 0 12 22Z" />
                          <path fill="#FBBC05" d="M6.405 13.905A6.02 6.02 0 0 1 6.091 12c0-.664.114-1.309.314-1.905V7.504H3.064A10 10 0 0 0 2 12c0 1.614.386 3.141 1.064 4.496l3.341-2.591Z" />
                          <path fill="#EA4335" d="M12 5.973c1.468 0 2.786.504 3.823 1.491l2.868-2.868C16.959 2.982 14.7 2 12 2a10 10 0 0 0-8.936 5.504l3.341 2.591C7.191 7.732 9.395 5.973 12 5.973Z" />
                        </svg>
                      )}
                      {googleLoading ? "Opening Google..." : "Continue with Google"}
                    </button>

                    <div className="my-6 flex items-center gap-3">
                      <div className="h-px flex-1 bg-[#e2e7f0]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a0aabd]">or continue with email</span>
                      <div className="h-px flex-1 bg-[#e2e7f0]" />
                    </div>
                  </>
                )}

                <form onSubmit={createMode ? handleCreateAccount : handleLogin} className="space-y-4">
                  {createMode && (
                    <div>
                      <label className="app-label">Display Name</label>
                      <div className="relative">
                        <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]" />
                        <input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={busy} autoComplete="name" placeholder="Your name" className="app-input app-input-icon" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="app-label">Email</label>
                    <div className="relative">
                      <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]" />
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} autoComplete="email" placeholder="you@email.com" className="app-input app-input-icon" />
                    </div>
                  </div>

                  <div>
                    <label className="app-label">Password</label>
                    <div className="relative">
                      <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]" />
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} autoComplete={createMode ? "new-password" : "current-password"} placeholder={createMode ? "At least 6 characters" : "Enter password"} className="app-input app-input-icon pr-12" />
                      <button type="button" tabIndex={-1} onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8995aa] transition hover:bg-[#edf1f7] hover:text-[#142a76]">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {!createMode && (
                      <div className="mt-2 flex justify-end">
                        <button type="button" disabled={busy} onClick={handleForgotPassword} className="text-xs font-extrabold text-[#294aad] transition hover:text-[#142a76] disabled:opacity-50">
                          {resetLoading ? "Sending..." : "Forgot Password?"}
                        </button>
                      </div>
                    )}
                  </div>

                  {createMode && (
                    <div>
                      <label className="app-label">Confirm Password</label>
                      <div className="relative">
                        <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]" />
                        <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={busy} autoComplete="new-password" placeholder="Enter password again" className="app-input app-input-icon pr-12" />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8995aa] transition hover:bg-[#edf1f7] hover:text-[#142a76]">
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={busy} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#183680] via-[#2449aa] to-[#345ed0] font-extrabold text-white shadow-[0_12px_28px_rgba(36,73,170,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(36,73,170,0.30)] disabled:opacity-50">
                    {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : createMode ? <UserPlus size={18} /> : <LockKeyhole size={18} />}
                    {loading ? (createMode ? "Creating Account..." : "Signing In...") : createMode ? "Create Account" : "Sign In"}
                  </button>
                </form>

                {!createMode ? (
                  <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#e1e7f2] bg-[#f6f8fd] px-4 py-3.5">
                    <div>
                      <p className="text-xs font-bold text-[#8995aa]">New to Money Splitter?</p>
                      <p className="mt-0.5 text-sm font-extrabold text-[#182442]">Create your free account</p>
                    </div>
                    <button type="button" disabled={busy} onClick={openCreateAccount} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e4ebff] text-[#294aad] transition hover:bg-[#d8e3ff] disabled:opacity-50" aria-label="Create account">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-[#dce5f6] bg-[#f7f9ff] p-4 text-center">
                    <p className="text-sm text-[#71809a]">Already have an account?</p>
                    <button type="button" disabled={busy} onClick={backToSignIn} className="mt-2 inline-flex items-center gap-2 font-extrabold text-[#294aad] transition hover:text-[#142a76] disabled:opacity-50">
                      <ArrowLeft size={15} /> Back to Sign In & Google
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold text-blue-100/45">
            <span className="flex items-center gap-1.5"><UsersRound size={13} /> Groups</span>
            <span className="h-3 w-px bg-white/15" />
            <span className="flex items-center gap-1.5"><ReceiptText size={13} /> Expenses</span>
            <span className="h-3 w-px bg-white/15" />
            <span className="flex items-center gap-1.5"><WalletCards size={13} /> Payments</span>
          </div>
        </section>
      </div>

      <Dialog />
    </main>
  );
}

export default AuthScreen;
