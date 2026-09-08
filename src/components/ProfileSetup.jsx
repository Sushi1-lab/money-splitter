import { useState } from "react";

import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import {
  updateProfile,
} from "firebase/auth";

import {
  AtSign,
  CircleUserRound,
  UserRound,
} from "lucide-react";

import {
  db,
} from "../firebase.js";

function ProfileSetup({
  user,
  onProfileCreated,
}) {
  const [
    displayName,
    setDisplayName,
  ] = useState(
    user?.displayName || ""
  );

  const [
    username,
    setUsername,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const cleanUsername = (
    value
  ) =>
    value
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(
        /[^a-z0-9._]/g,
        ""
      );

  const saveProfile =
    async (event) => {
      event.preventDefault();

      const cleanName =
        displayName.trim();

      const cleanUser =
        cleanUsername(
          username
        );

      if (
        cleanName.length < 2
      ) {
        alert(
          "Please enter your name."
        );
        return;
      }

      if (
        cleanUser.length < 3 ||
        cleanUser.length > 20
      ) {
        alert(
          "Username must be 3–20 characters."
        );
        return;
      }

      try {
        setLoading(true);

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
            cleanUser
          );

        await runTransaction(
          db,
          async (
            transaction
          ) => {
            const existing =
              await transaction.get(
                usernameRef
              );

            if (
              existing.exists()
            ) {
              throw new Error(
                "USERNAME_TAKEN"
              );
            }

            const provider =
              user.providerData?.some(
                (item) =>
                  item.providerId ===
                  "google.com"
              )
                ? "google"
                : "password";

            const data = {
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
                cleanUser,

              photoURL:
                user.photoURL ||
                null,

              provider,

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            };

            transaction.set(
              usernameRef,
              {
                uid:
                  user.uid,

                username:
                  cleanUser,

                createdAt:
                  serverTimestamp(),
              }
            );

            transaction.set(
              userRef,
              data
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

        onProfileCreated({
          uid:
            user.uid,

          email:
            user.email
              ?.trim()
              .toLowerCase(),

          displayName:
            cleanName,

          username:
            cleanUser,

          photoURL:
            user.photoURL ||
            null,
        });
      } catch (error) {
        console.error(
          "Profile error:",
          error
        );

        if (
          error.message ===
          "USERNAME_TAKEN"
        ) {
          alert(
            "That username is already being used."
          );
        } else {
          alert(
            "Unable to create your profile."
          );
        }
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#eaf0fa] px-4 py-8">

      <div className="app-card w-full max-w-md overflow-hidden">

        <div className="bg-gradient-to-br from-[#10245f] to-[#294aad] px-6 py-8 text-center text-white">

          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="mx-auto h-20 w-20 rounded-full border-4 border-white/20 object-cover"
            />
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
              <CircleUserRound
                size={42}
              />
            </div>
          )}

          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-100">
            Profile Setup
          </p>

          <h1 className="mt-2 text-2xl font-extrabold">
            Complete your profile
          </h1>

        </div>

        <form
          onSubmit={
            saveProfile
          }
          className="space-y-5 p-5 sm:p-7"
        >

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
                onChange={(event) =>
                  setDisplayName(
                    event.target.value
                  )
                }
                placeholder="Marl Joshua"
                className="app-input app-input-icon"
              />

            </div>

          </div>

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
                value={username}
                onChange={(event) =>
                  setUsername(
                    cleanUsername(
                      event.target.value
                    )
                  )
                }
                placeholder="marl"
                autoCapitalize="none"
                className="app-input app-input-icon"
              />

            </div>

          </div>

          <div className="rounded-2xl bg-[#eaf0fa] p-4">

            <p className="text-xs text-[#8995aa]">
              Account email
            </p>

            <p className="mt-1 break-all text-sm font-bold text-[#52617d]">
              {user.email}
            </p>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="app-button-primary w-full disabled:opacity-50"
          >
            {loading
              ? "Creating Profile..."
              : "Complete Setup"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default ProfileSetup;