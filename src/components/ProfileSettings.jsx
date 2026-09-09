import {
  LogOut,
  Save,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  updateProfile,
} from "firebase/auth";

import {
  db,
} from "../firebase.js";

import Wallets from "./Wallets.jsx";

import useAppDialog from "../hooks/useAppDialog.jsx";

function ProfileSettings({
  user,
  profile,
  activeServer = null,
  serverUsername = "",
  onProfileUpdated,
  onSignOut,
}) {
  const {
    Dialog,
    success,
    warning,
    error,
  } = useAppDialog();

  const [displayName, setDisplayName] =
    useState(
      profile?.displayName ||
        user?.displayName ||
        ""
    );

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    setDisplayName(
      profile?.displayName ||
        user?.displayName ||
        ""
    );

  }, [
    profile?.displayName,
    profile?.username,
  ]);

  const saveProfile =
    async (
      event
    ) => {
      event.preventDefault();

      const cleanName =
        displayName
          .trim()
          .replace(/\s+/g, " ");

      if (
        cleanName.length <
        2
      ) {
        await warning(
          "Display Name Too Short",
          "Use at least 2 characters."
        );
        return;
      }

      try {
        setSaving(true);

        // IMPORTANT:
        // The profile username is now only the user's
        // preferred/default username. It is NOT globally unique.
        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            uid:
              user.uid,
            email:
              user.email
                ?.trim()
                .toLowerCase() ||
              "",
            displayName:
              cleanName,
            username:
              profile?.username ||
              "",
            photoURL:
              profile?.photoURL ||
              user?.photoURL ||
              null,
            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        await updateProfile(
          user,
          {
            displayName:
              cleanName,
          }
        );

        const updated = {
          ...profile,
          uid:
            user.uid,
          email:
            user.email ||
            "",
          displayName:
            cleanName,
          username:
            profile?.username ||
            "",
          photoURL:
            profile?.photoURL ||
            user?.photoURL ||
            null,
        };

        onProfileUpdated?.(
          updated
        );

        await success(
          "Profile Updated",
          "Your profile changes were saved successfully."
        );
      } catch (err) {
        console.error(
          "Profile update error:",
          err
        );

        await error(
          "Unable to Update Profile",
          "Please try again."
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <>
      <section className="space-y-5">
        <form
          onSubmit={
            saveProfile
          }
          className="app-card overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
            <div className="flex items-center gap-3">
              {profile?.photoURL ||
              user?.photoURL ? (
                <img
                  src={
                    profile?.photoURL ||
                    user?.photoURL
                  }
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <UserRound
                    size={22}
                  />
                </div>
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
                  Account
                </p>

                <h2 className="text-xl font-extrabold">
                  Profile Settings
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            <div>
              <label className="app-label">
                Display Name
              </label>

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
                className="app-input"
              />
            </div>

            {activeServer && serverUsername && (
              <div>
                <label className="app-label">
                  Username
                </label>

                <div className="rounded-2xl border border-[#dce5f6] bg-[#eef3ff] px-4 py-4">
                  <p className="font-extrabold text-[#294aad]">
                    @{serverUsername}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                    This is the username you are using in this server.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="app-label">
                Email
              </label>

              <div className="app-input flex items-center bg-[#f3f5f9] text-[#8995aa]">
                {user?.email}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                saving
              }
              className="app-button-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save
                size={17}
              />
              {saving
                ? "Saving..."
                : "Save Profile"}
            </button>
          </div>
        </form>

        <Wallets
          user={
            user
          }
          profile={
            profile
          }
        />

        <div className="app-card p-4 sm:p-6">
          <button
            type="button"
            onClick={
              onSignOut
            }
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffeded] font-extrabold text-[#c85353] transition hover:bg-[#ffe2e2]"
          >
            <LogOut
              size={18}
            />
            Sign Out
          </button>
        </div>
      </section>

      <Dialog />
    </>
  );
}

export default ProfileSettings;
