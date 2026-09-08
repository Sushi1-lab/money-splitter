import {
  AtSign,
  CheckCircle2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

import {
  db,
} from "../firebase.js";

import useAppDialog from "../hooks/useAppDialog.jsx";

function ProfileSetup({
  user,
  existingProfile = null,
  onProfileCreated,
}) {
  const [
    displayName,
    setDisplayName,
  ] = useState(
    existingProfile?.displayName ||
      user?.displayName ||
      ""
  );

  const [
    username,
    setUsername,
  ] = useState(
    existingProfile?.username ||
      ""
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    checkingOldProfile,
    setCheckingOldProfile,
  ] = useState(true);

  const [
    oldProfile,
    setOldProfile,
  ] = useState(null);

  const [
    recoveryChecked,
    setRecoveryChecked,
  ] = useState(false);

  const {
    Dialog,
    success,
    warning,
    error,
    confirm,
  } = useAppDialog();

  // =========================================
  // HELPERS
  // =========================================

  const cleanEmail = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const cleanName = (value) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, " ");

  const cleanUsername = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(
        /[^a-z0-9._]/g,
        ""
      )
      .slice(0, 20);

  const currentEmail =
    cleanEmail(
      user?.email
    );

  // =========================================
  // SEARCH OLD PROFILE USING SAME EMAIL
  // =========================================

  useEffect(() => {
    let cancelled =
      false;

    const checkExistingProfile =
      async () => {
        if (
          !user?.uid ||
          !currentEmail
        ) {
          if (!cancelled) {
            setCheckingOldProfile(
              false
            );

            setRecoveryChecked(
              true
            );
          }

          return;
        }

        // Current profile already has a username.
        // No recovery is needed.
        if (
          existingProfile
            ?.username
        ) {
          if (!cancelled) {
            setCheckingOldProfile(
              false
            );

            setRecoveryChecked(
              true
            );
          }

          return;
        }

        try {
          setCheckingOldProfile(
            true
          );

          const sameEmailQuery =
            query(
              collection(
                db,
                "users"
              ),
              where(
                "email",
                "==",
                currentEmail
              )
            );

          const snapshot =
            await getDocs(
              sameEmailQuery
            );

          const matchingDoc =
            snapshot.docs.find(
              (profileDoc) => {
                if (
                  profileDoc.id ===
                  user.uid
                ) {
                  return false;
                }

                const data =
                  profileDoc.data();

                return Boolean(
                  data?.username
                );
              }
            );

          if (
            !cancelled &&
            matchingDoc
          ) {
            setOldProfile({
              uid:
                matchingDoc.id,

              ...matchingDoc.data(),
            });
          }
        } catch (err) {
          console.error(
            "Existing profile lookup error:",
            err
          );
        } finally {
          if (!cancelled) {
            setCheckingOldProfile(
              false
            );

            setRecoveryChecked(
              true
            );
          }
        }
      };

    checkExistingProfile();

    return () => {
      cancelled =
        true;
    };
  }, [
    user?.uid,
    currentEmail,
    existingProfile?.username,
  ]);

  // =========================================
  // ASK USER ABOUT OLD USERNAME
  // =========================================

  useEffect(() => {
    if (
      !recoveryChecked ||
      !oldProfile ||
      oldProfile.username ===
        existingProfile
          ?.username
    ) {
      return;
    }

    let cancelled =
      false;

    const askForRecovery =
      async () => {
        const oldUsername =
          cleanUsername(
            oldProfile.username
          );

        if (!oldUsername) {
          return;
        }

        const shouldRecover =
          await confirm({
            title:
              "Existing Profile Found",

            message:
              `We found an existing Money Splitter profile using ${currentEmail}.\n\nName: ${
                oldProfile.displayName ||
                "Not set"
              }\nUsername: @${oldUsername}\n\nDo you want to use this existing username?`,

            confirmText:
              `Use @${oldUsername}`,

            cancelText:
              "Create New Username",
          });

        if (
          cancelled ||
          !shouldRecover
        ) {
          setOldProfile(
            null
          );

          return;
        }

        await recoverExistingProfile(
          oldProfile
        );
      };

    askForRecovery();

    return () => {
      cancelled =
        true;
    };
  }, [
    recoveryChecked,
    oldProfile,
  ]);

  // =========================================
  // RECOVER / TRANSFER OLD USERNAME
  // =========================================

  const recoverExistingProfile =
    async (
      profileToRecover
    ) => {
      if (
        !profileToRecover ||
        !user?.uid
      ) {
        return;
      }

      const oldUsername =
        cleanUsername(
          profileToRecover
            .username
        );

      const oldEmail =
        cleanEmail(
          profileToRecover
            .email
        );

      if (
        !oldUsername ||
        oldEmail !==
          currentEmail
      ) {
        await error(
          "Unable to Recover Profile",
          "The existing profile does not match the email of your current account."
        );

        return;
      }

      // Google accounts are normally already verified.
      // For Email/Password accounts we require email
      // verification before transferring another UID's username.
      if (
        !user.emailVerified
      ) {
        try {
          await sendEmailVerification(
            user
          );

          await warning(
            "Verify Your Email First",
            `For security, you need to verify ${currentEmail} before we can transfer @${oldUsername}. We sent you a verification email. After verifying it, sign in again and choose the existing username.`
          );
        } catch (err) {
          console.error(
            "Verification email error:",
            err
          );

          await error(
            "Verification Required",
            "Your email must be verified before an existing username can be transferred."
          );
        }

        return;
      }

      try {
        setSaving(true);

        const oldUserRef =
          doc(
            db,
            "users",
            profileToRecover.uid
          );

        const newUserRef =
          doc(
            db,
            "users",
            user.uid
          );

        const usernameRef =
          doc(
            db,
            "usernames",
            oldUsername
          );

        const result =
          await runTransaction(
            db,
            async (
              transaction
            ) => {
              const [
                oldUserSnap,
                newUserSnap,
                usernameSnap,
              ] =
                await Promise.all([
                  transaction.get(
                    oldUserRef
                  ),

                  transaction.get(
                    newUserRef
                  ),

                  transaction.get(
                    usernameRef
                  ),
                ]);

              if (
                !oldUserSnap.exists()
              ) {
                throw new Error(
                  "The old profile could not be found."
                );
              }

              const oldData =
                oldUserSnap.data();

              const oldDataEmail =
                cleanEmail(
                  oldData.email
                );

              if (
                oldDataEmail !==
                  currentEmail
              ) {
                throw new Error(
                  "The old profile email does not match your current email."
                );
              }

              if (
                cleanUsername(
                  oldData.username
                ) !==
                  oldUsername
              ) {
                throw new Error(
                  "The username on the old profile has changed."
                );
              }

              if (
                usernameSnap.exists()
              ) {
                const usernameOwner =
                  usernameSnap.data()
                    ?.uid;

                if (
                  usernameOwner !==
                    profileToRecover.uid &&
                  usernameOwner !==
                    user.uid
                ) {
                  throw new Error(
                    `@${oldUsername} is currently owned by another account.`
                  );
                }
              }

              const newData =
                newUserSnap.exists()
                  ? newUserSnap.data()
                  : {};

              const recoveredDisplayName =
                cleanName(
                  oldData.displayName
                ) ||
                cleanName(
                  newData.displayName
                ) ||
                cleanName(
                  user.displayName
                );

              // Give username to current account.
              transaction.set(
                newUserRef,
                {
                  displayName:
                    recoveredDisplayName,

                  username:
                    oldUsername,

                  email:
                    currentEmail,

                  photoURL:
                    newData.photoURL ||
                    user.photoURL ||
                    oldData.photoURL ||
                    null,

                  recoveredFromUid:
                    profileToRecover.uid,

                  updatedAt:
                    serverTimestamp(),

                  ...(!newUserSnap.exists()
                    ? {
                        createdAt:
                          serverTimestamp(),
                      }
                    : {}),
                },
                {
                  merge: true,
                }
              );

              // Transfer username reservation.
              transaction.set(
                usernameRef,
                {
                  uid:
                    user.uid,

                  email:
                    currentEmail,

                  updatedAt:
                    serverTimestamp(),
                },
                {
                  merge: true,
                }
              );

              // Remove username from old duplicate profile,
              // but keep the old profile for safety/history.
              transaction.set(
                oldUserRef,
                {
                  username:
                    "",

                  migratedToUid:
                    user.uid,

                  migratedAt:
                    serverTimestamp(),

                  updatedAt:
                    serverTimestamp(),
                },
                {
                  merge: true,
                }
              );

              return {
                displayName:
                  recoveredDisplayName,

                username:
                  oldUsername,

                email:
                  currentEmail,

                photoURL:
                  newData.photoURL ||
                  user.photoURL ||
                  oldData.photoURL ||
                  null,
              };
            }
          );

        if (
          result.displayName &&
          user.displayName !==
            result.displayName
        ) {
          await updateProfile(
            user,
            {
              displayName:
                result.displayName,
            }
          );
        }

        await success(
          "Profile Restored",
          `Welcome back. @${result.username} is now connected to this account.`
        );

        onProfileCreated?.(
          result
        );
      } catch (err) {
        console.error(
          "Profile recovery error:",
          err
        );

        await error(
          "Unable to Restore Profile",
          err?.message ||
            "We couldn't restore your existing username."
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================
  // CREATE A NEW USERNAME
  // =========================================

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      const finalName =
        cleanName(
          displayName
        );

      const finalUsername =
        cleanUsername(
          username
        );

      if (
        finalName.length <
        2
      ) {
        await warning(
          "Name Required",
          "Enter your name using at least 2 characters."
        );

        return;
      }

      if (
        finalUsername.length <
        3
      ) {
        await warning(
          "Username Too Short",
          "Your username must contain at least 3 characters."
        );

        return;
      }

      if (!user?.uid) {
        return;
      }

      try {
        setSaving(true);

        const userRef =
          doc(
            db,
            "users",
            user.uid
          );

        const usernameRef =
          doc(
            db,
            "usernames",
            finalUsername
          );

        await runTransaction(
          db,
          async (
            transaction
          ) => {
            const usernameSnap =
              await transaction.get(
                usernameRef
              );

            if (
              usernameSnap.exists() &&
              usernameSnap.data()
                ?.uid !==
                user.uid
            ) {
              throw new Error(
                `@${finalUsername} is already taken.`
              );
            }

            transaction.set(
              usernameRef,
              {
                uid:
                  user.uid,

                email:
                  currentEmail,

                updatedAt:
                  serverTimestamp(),

                ...(!usernameSnap.exists()
                  ? {
                      createdAt:
                        serverTimestamp(),
                    }
                  : {}),
              },
              {
                merge: true,
              }
            );

            transaction.set(
              userRef,
              {
                displayName:
                  finalName,

                username:
                  finalUsername,

                email:
                  currentEmail,

                photoURL:
                  user.photoURL ||
                  existingProfile
                    ?.photoURL ||
                  null,

                updatedAt:
                  serverTimestamp(),

                ...(!existingProfile
                  ? {
                      createdAt:
                        serverTimestamp(),
                    }
                  : {}),
              },
              {
                merge: true,
              }
            );
          }
        );

        await updateProfile(
          user,
          {
            displayName:
              finalName,
          }
        );

        const updatedProfile =
          {
            ...(existingProfile ||
              {}),

            displayName:
              finalName,

            username:
              finalUsername,

            email:
              currentEmail,

            photoURL:
              user.photoURL ||
              existingProfile
                ?.photoURL ||
              null,
          };

        await success(
          "Profile Ready",
          `Your username is @${finalUsername}.`
        );

        onProfileCreated?.(
          updatedProfile
        );
      } catch (err) {
        console.error(
          "Profile setup error:",
          err
        );

        await error(
          "Unable to Save Profile",
          err?.message ||
            "We couldn't save your profile."
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================
  // LOADING OLD PROFILE
  // =========================================

  if (
    checkingOldProfile
  ) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#eaf0fa] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-white bg-white p-8 text-center shadow-[0_20px_60px_rgba(31,53,108,0.12)]">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d8e1f6] border-t-[#294aad]" />

          <h2 className="mt-5 text-xl font-extrabold text-[#182442]">
            Checking your profile
          </h2>

          <p className="mt-2 text-sm text-[#71809a]">
            We're checking whether this email already has a Money Splitter username.
          </p>
        </div>

        <Dialog />
      </main>
    );
  }

  // =========================================
  // PROFILE SETUP UI
  // =========================================

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#eaf0fa] px-4 py-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[380px] w-[380px] rounded-full bg-[#cfdcff]/60 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[430px] w-[430px] rounded-full bg-[#b9c9ff]/50 blur-3xl" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(31,53,108,0.14)] backdrop-blur-xl">
        <div className="bg-gradient-to-br from-[#10245f] via-[#142a76] to-[#294aad] p-6 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <UserRound
              size={24}
            />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-blue-100/60">
            One Last Step
          </p>

          <h1 className="mt-1 text-2xl font-extrabold">
            Set Up Your Profile
          </h1>

          <p className="mt-2 text-sm leading-6 text-blue-100/70">
            Choose how other members will recognize you in Money Splitter.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5 p-5 sm:p-6"
        >
          {/* EMAIL */}

          <div className="rounded-[18px] border border-[#e2e8f2] bg-[#f7f9fd] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4ebff] text-[#294aad]">
                <Mail
                  size={18}
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-[#8995aa]">
                  Signed in as
                </p>

                <p className="truncate text-sm font-extrabold text-[#182442]">
                  {currentEmail}
                </p>
              </div>
            </div>
          </div>

          {/* NAME */}

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
                disabled={saving}
                placeholder="Your name"
                className="app-input app-input-icon"
              />
            </div>
          </div>

          {/* USERNAME */}

          <div>
            <label className="app-label">
              Username
            </label>

            <div className="relative">
              <AtSign
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
              />

              <input
                type="text"
                value={
                  username
                }
                onChange={(
                  event
                ) =>
                  setUsername(
                    cleanUsername(
                      event.target
                        .value
                    )
                  )
                }
                disabled={saving}
                placeholder="marl"
                maxLength={20}
                className="app-input app-input-icon"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-[#8995aa]">
              3–20 characters. You can use lowercase letters, numbers, periods and underscores.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="app-button-primary flex min-h-[54px] w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <CheckCircle2
                size={18}
              />
            )}

            {saving
              ? "Saving..."
              : "Continue"}
          </button>

          <div className="flex items-start gap-3 rounded-[16px] bg-[#eef3ff] p-4">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-[#294aad]"
            />

            <p className="text-xs leading-5 text-[#71809a]">
              Your username is used to identify you inside shared Money Splitter servers.
            </p>
          </div>
        </form>
      </div>

      <Dialog />
    </main>
  );
}

export default ProfileSetup;