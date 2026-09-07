import { useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase.js";

function ManageMembers({
  user,
  server,
  onClose,
  onServerUpdated,
  onServerDeleted,
}) {
  const [memberEmail, setMemberEmail] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    deletingServer,
    setDeletingServer,
  ] = useState(false);

  const currentUserEmail =
    user?.email
      ?.trim()
      .toLowerCase();

  const ownerEmail =
    server?.ownerEmail
      ?.trim()
      .toLowerCase();

  const members =
    server?.members || [];

  const isOwner =
    currentUserEmail ===
    ownerEmail;

  // =========================================================
  // ADD MEMBER
  // =========================================================

  const addMember = async () => {
    if (!isOwner) {
      alert(
        "Only the server owner can add members."
      );

      return;
    }

    const email =
      memberEmail
        .trim()
        .toLowerCase();

    if (!email) {
      alert(
        "Please enter an email address."
      );

      return;
    }

    if (
      !email.includes("@")
    ) {
      alert(
        "Please enter a valid email address."
      );

      return;
    }

    const alreadyExists =
      members.some(
        (member) =>
          member.toLowerCase() ===
          email
      );

    if (alreadyExists) {
      alert(
        "This person is already a member."
      );

      return;
    }

    try {
      setSaving(true);

      const updatedMembers = [
        ...members,
        email,
      ];

      await updateDoc(
        doc(
          db,
          "servers",
          server.id
        ),
        {
          members:
            updatedMembers,
        }
      );

      const updatedServer = {
        ...server,
        members:
          updatedMembers,
      };

      setMemberEmail("");

      onServerUpdated(
        updatedServer
      );
    } catch (error) {
      console.error(
        "Add member error:",
        error
      );

      alert(
        "Unable to add member."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // REMOVE MEMBER
  // =========================================================

  const removeMember =
    async (email) => {
      if (!isOwner) {
        alert(
          "Only the server owner can remove members."
        );

        return;
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (
        normalizedEmail ===
        ownerEmail
      ) {
        alert(
          "The server owner cannot be removed."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Remove ${email} from ${server.name}?`
        );

      if (!confirmed) return;

      try {
        setSaving(true);

        const updatedMembers =
          members.filter(
            (member) =>
              member.toLowerCase() !==
              normalizedEmail
          );

        await updateDoc(
          doc(
            db,
            "servers",
            server.id
          ),
          {
            members:
              updatedMembers,
          }
        );

        const updatedServer = {
          ...server,
          members:
            updatedMembers,
        };

        onServerUpdated(
          updatedServer
        );
      } catch (error) {
        console.error(
          "Remove member error:",
          error
        );

        alert(
          "Unable to remove member."
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================================
  // DELETE SUBCOLLECTION
  // =========================================================

  const deleteSubcollection =
    async (
      subcollectionName
    ) => {
      const snapshot =
        await getDocs(
          collection(
            db,
            "servers",
            server.id,
            subcollectionName
          )
        );

      await Promise.all(
        snapshot.docs.map(
          (item) =>
            deleteDoc(item.ref)
        )
      );
    };

  // =========================================================
  // DELETE SERVER
  // =========================================================

  const deleteServer =
    async () => {
      if (!isOwner) {
        alert(
          "Only the server owner can delete this server."
        );

        return;
      }

      const firstConfirm =
        window.confirm(
          `Delete "${server.name}" permanently?\n\nThis will delete its splits and payment records.`
        );

      if (!firstConfirm) {
        return;
      }

      const secondConfirm =
        window.confirm(
          "This action cannot be undone. Are you absolutely sure?"
        );

      if (!secondConfirm) {
        return;
      }

      try {
        setDeletingServer(true);

        // Delete all server data first
        await Promise.all([
          deleteSubcollection(
            "splits"
          ),
          deleteSubcollection(
            "settlements"
          ),
        ]);

        // Delete server document
        await deleteDoc(
          doc(
            db,
            "servers",
            server.id
          )
        );

        alert(
          "Server deleted successfully."
        );

        onServerDeleted(
          server.id
        );
      } catch (error) {
        console.error(
          "Delete server error:",
          error
        );

        alert(
          "Unable to delete the server."
        );
      } finally {
        setDeletingServer(
          false
        );
      }
    };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6">

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          <div className="min-w-0">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Server Settings
            </p>

            <h1 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
              {server.name}
            </h1>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold"
          >
            ← Back
          </button>

        </div>

        {/* MEMBERS */}

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:p-6">

          <div className="mb-6">

            <p className="text-sm text-slate-400">
              Server access
            </p>

            <h2 className="text-xl font-bold">
              Manage Members
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Anyone whose Google email is listed here can access this server's expenses and history.
            </p>

          </div>

          {isOwner && (
            <div className="mb-6">

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Add Member
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">

                <input
                  type="email"
                  value={memberEmail}
                  onChange={(event) =>
                    setMemberEmail(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();
                      addMember();
                    }
                  }}
                  placeholder="friend@gmail.com"
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                />

                <button
                  type="button"
                  onClick={addMember}
                  disabled={
                    saving ||
                    deletingServer
                  }
                  className="min-h-12 rounded-xl bg-cyan-400 px-5 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Add Member"}
                </button>

              </div>

            </div>
          )}

          <div className="mb-3 flex items-center justify-between gap-3">

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Members
            </p>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-400">
              {members.length}
            </span>

          </div>

          <div className="space-y-2">

            {members.map(
              (email) => {
                const normalizedEmail =
                  email.toLowerCase();

                const memberIsOwner =
                  normalizedEmail ===
                  ownerEmail;

                const memberIsYou =
                  normalizedEmail ===
                  currentUserEmail;

                return (
                  <div
                    key={email}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 sm:p-4"
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 font-bold text-slate-950">
                        {email
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-medium text-slate-200">
                          {email}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-1">

                          {memberIsOwner && (
                            <span className="rounded-full bg-purple-400/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                              Owner
                            </span>
                          )}

                          {memberIsYou && (
                            <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                              You
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                    {isOwner &&
                      !memberIsOwner && (
                        <button
                          type="button"
                          disabled={
                            saving ||
                            deletingServer
                          }
                          onClick={() =>
                            removeMember(
                              email
                            )
                          }
                          className="min-h-10 shrink-0 rounded-xl bg-red-500/10 px-3 text-xs font-semibold text-red-300 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}

                  </div>
                );
              }
            )}

          </div>

          {!isOwner && (
            <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm text-slate-500">
              Only the owner of this server can change its members.
            </div>
          )}

        </section>

        {/* DANGER ZONE */}

        {isOwner && (
          <section className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/[0.05] p-4 sm:p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
              Danger Zone
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Delete Server
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              This permanently deletes this server, all split history and all payment records.
            </p>

            <button
              type="button"
              onClick={deleteServer}
              disabled={
                deletingServer
              }
              className="mt-5 min-h-12 w-full rounded-xl bg-red-500 px-5 font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {deletingServer
                ? "Deleting Server..."
                : "Delete Server"}
            </button>

          </section>
        )}

      </div>

    </div>
  );
}

export default ManageMembers;