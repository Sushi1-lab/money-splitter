import {
  AtSign,
  Save,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import {
  updateProfile,
} from "firebase/auth";

import { db } from "../firebase.js";

import useAppDialog from "../hooks/useAppDialog.jsx";
import Wallets from "./Wallets.jsx";

function ProfileSettings({
  user,
  profile,
  onProfileUpdated,
}) {
  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const {
    Dialog,
    success,
    warning,
    error,
  } = useAppDialog();

  // =========================================
  // LOAD CURRENT PROFILE
  // =========================================

  useEffect(() => {
    setDisplayName(
      profile?.displayName ||
        user?.displayName ||
        ""
    );

    setUsername(
      profile?.username ||
        ""
    );
  }, [
    profile,
    user,
  ]);

  // =========================================
  // USERNAME CLEANER
  // =========================================

  const cleanUsername = (
    value
  ) =>
    String(value)
      .toLowerCase()
      .replace(
        /[^a-z0-9._]/g,
        ""
      )
      .slice(
        0,
        20
      );

  // =========================================
  // SAVE PROFILE
  // =========================================

  const saveProfile =
    async (event) => {
      event.preventDefault();

      const cleanName =
        displayName
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const newUsername =
        cleanUsername(
          username
        );

      if (
        cleanName.length <
        2
      ) {
        await warning(
          "Display Name Required",
          "Enter a display name with at least 2 characters."
        );

        return;
      }

      if (
        newUsername.length <
        3
      ) {
        await warning(
          "Username Required",
          "Your username must contain at least 3 characters."
        );

        return;
      }

      const oldUsername =
        cleanUsername(
          profile?.username ||
            ""
        );

      try {
        setSaving(true);

        await runTransaction(
          db,
          async (
            transaction
          ) => {
            const userRef =
              doc(
                db,
                "users",
                user.uid
              );

            const newUsernameRef =
              doc(
                db,
                "usernames",
                newUsername
              );

            const newUsernameSnap =
              await transaction.get(
                newUsernameRef
              );

            if (
              newUsernameSnap.exists() &&
              newUsernameSnap.data()
                ?.uid !==
                user.uid
            ) {
              throw new Error(
                "USERNAME_TAKEN"
              );
            }

            // =================================
            // READ OLD USERNAME BEFORE WRITES
            // =================================

            let oldUsernameRef =
              null;

            let oldUsernameSnap =
              null;

            if (
              oldUsername &&
              oldUsername !==
                newUsername
            ) {
              oldUsernameRef =
                doc(
                  db,
                  "usernames",
                  oldUsername
                );

              oldUsernameSnap =
                await transaction.get(
                  oldUsernameRef
                );
            }

            // =================================
            // DELETE OLD USERNAME
            // =================================

            if (
              oldUsernameRef &&
              oldUsernameSnap?.exists() &&
              oldUsernameSnap.data()
                ?.uid ===
                user.uid
            ) {
              transaction.delete(
                oldUsernameRef
              );
            }

            // =================================
            // SAVE NEW USERNAME
            // =================================

            transaction.set(
              newUsernameRef,
              {
                uid:
                  user.uid,

                email:
                  user.email ||
                  "",

                username:
                  newUsername,

                updatedAt:
                  serverTimestamp(),
              }
            );

            // =================================
            // SAVE USER PROFILE
            // =================================

            transaction.set(
              userRef,
              {
                displayName:
                  cleanName,

                username:
                  newUsername,

                email:
                  user.email
                    ?.trim()
                    .toLowerCase() ||
                  "",

                photoURL:
                  user.photoURL ||
                  profile
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
        );

        await updateProfile(
          user,
          {
            displayName:
              cleanName,
          }
        );

        const updatedProfile =
          {
            ...profile,

            id:
              user.uid,

            displayName:
              cleanName,

            username:
              newUsername,

            email:
              user.email
                ?.trim()
                .toLowerCase() ||
              "",

            photoURL:
              user.photoURL ||
              profile
                ?.photoURL ||
              null,
          };

        onProfileUpdated(
          updatedProfile
        );

        await success(
          "Profile Updated",
          "Your profile has been saved."
        );
      } catch (err) {
        console.error(
          "Profile update error:",
          err
        );

        if (
          err.message ===
          "USERNAME_TAKEN"
        ) {
          await warning(
            "Username Taken",
            `@${newUsername} is already being used.`
          );
        } else {
          await error(
            "Unable to Update Profile",
            "We couldn't save your profile."
          );
        }
      } finally {
        setSaving(false);
      }
    };

  return (
    <section className="space-y-6">
      {/* =====================================
          PROFILE SETTINGS
      ====================================== */}

      <div className="app-card w-full min-w-0 overflow-hidden">
        <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <UserRound
                size={22}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
                Account
              </p>

              <h2 className="text-xl font-extrabold">
                My Profile
              </h2>
            </div>
          </div>
        </div>

        <form
          onSubmit={
            saveProfile
          }
          className="space-y-6 p-4 sm:p-6"
        >
          {/* PROFILE PREVIEW */}

          <div className="flex items-center gap-4 rounded-[20px] bg-[#eef3ff] p-4">
            {profile?.photoURL ||
            user?.photoURL ? (
              <img
                src={
                  profile
                    ?.photoURL ||
                  user
                    ?.photoURL
                }
                alt=""
                referrerPolicy="no-referrer"
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dbe4ff] text-[#142a76]">
                <UserRound
                  size={28}
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-extrabold text-[#182442]">
                {displayName ||
                  "Your Name"}
              </p>

              <p className="mt-1 truncate text-sm text-[#71809a]">
                {username
                  ? `@${username}`
                  : "No username yet"}
              </p>

              <p className="mt-1 truncate text-xs text-[#9ba6b9]">
                {user?.email}
              </p>
            </div>
          </div>

          {/* DISPLAY NAME */}

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
                placeholder="Example: Marl"
                maxLength={40}
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
                placeholder="marl"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                className="app-input app-input-icon"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-[#8995aa]">
              3–20 characters.
              Letters, numbers,
              periods and
              underscores are
              allowed.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="app-button-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Save
                size={18}
              />
            )}

            {saving
              ? "Saving..."
              : "Save Profile"}
          </button>
        </form>
      </div>

      {/* =====================================
          MY WALLET SECTION
      ====================================== */}

      <div>
        <div className="mb-3 flex items-center gap-2 px-1">
          <WalletCards
            size={19}
            className="text-[#142a76]"
          />

          <div>
            <h2 className="font-extrabold text-[#182442]">
              My Wallet
            </h2>

            <p className="text-xs text-[#8995aa]">
              Manage your own QR
              codes and payment
              methods.
            </p>
          </div>
        </div>

        <Wallets
          user={user}
          profile={profile}
        />
      </div>

      <Dialog />
    </section>
  );
}

export default ProfileSettings;