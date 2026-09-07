import { useState } from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase.js";

function ServerSelector({
  user,
  servers,
  isSuperAdmin,
  onSelectServer,
  onRefreshServers,
  onManageServer,
}) {
  const [creating, setCreating] =
    useState(false);

  const [serverName, setServerName] =
    useState("");

  const [memberEmail, setMemberEmail] =
    useState("");

  const [memberEmails, setMemberEmails] =
    useState([]);

  const normalizedUserEmail =
    user?.email
      ?.trim()
      .toLowerCase();

  const addMember = () => {
    const email =
      memberEmail
        .trim()
        .toLowerCase();

    if (!email) return;

    if (!email.includes("@")) {
      alert(
        "Please enter a valid email."
      );
      return;
    }

    if (
      email ===
      normalizedUserEmail
    ) {
      alert(
        "You are already included automatically."
      );
      return;
    }

    if (
      memberEmails.includes(
        email
      )
    ) {
      alert(
        "That email is already included."
      );
      return;
    }

    setMemberEmails(
      (current) => [
        ...current,
        email,
      ]
    );

    setMemberEmail("");
  };

  const removeMember = (
    email
  ) => {
    setMemberEmails(
      (current) =>
        current.filter(
          (item) =>
            item !== email
        )
    );
  };

  const createServer =
    async () => {
      const trimmedName =
        serverName.trim();

      if (!trimmedName) {
        alert(
          "Please enter a server name."
        );
        return;
      }

      if (
        !normalizedUserEmail
      ) {
        return;
      }

      try {
        setCreating(true);

        const members = [
          normalizedUserEmail,
          ...memberEmails,
        ];

        const serverRef =
          await addDoc(
            collection(
              db,
              "servers"
            ),
            {
              name:
                trimmedName,

              ownerEmail:
                normalizedUserEmail,

              members,

              createdAt:
                serverTimestamp(),
            }
          );

        setServerName("");
        setMemberEmail("");
        setMemberEmails([]);

        await onRefreshServers(
          serverRef.id
        );
      } catch (error) {
        console.error(
          "Create server error:",
          error
        );

        alert(
          "Unable to create server."
        );
      } finally {
        setCreating(false);
      }
    };

  return (
    <div className="relative min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-950 px-3 py-5 text-white sm:px-6 sm:py-8">

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-5xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Money Splitter
              </p>

              {isSuperAdmin && (
                <span className="rounded-full bg-purple-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-300">
                  Super Admin
                </span>
              )}

            </div>

            <h1 className="mt-1 text-3xl font-bold">
              {isSuperAdmin
                ? "All Servers"
                : "Your Servers"}
            </h1>

            <p className="mt-2 break-all text-sm text-slate-400">
              Signed in as{" "}
              {user.email}
            </p>

            {isSuperAdmin && (
              <p className="mt-2 text-xs text-purple-300">
                You have access to every server.
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={() =>
              signOut(auth)
            }
            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-300"
          >
            Sign Out
          </button>

        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">

          {/* SERVER LIST */}

          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:p-6">

            <div className="flex items-center justify-between gap-3">

              <div>

                <h2 className="text-xl font-bold">
                  {isSuperAdmin
                    ? "All Servers"
                    : "Your Servers"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {servers.length}{" "}
                  {servers.length === 1
                    ? "server"
                    : "servers"}
                </p>

              </div>

              {isSuperAdmin && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10">
                  👑
                </div>
              )}

            </div>

            {servers.length ===
            0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center">

                <div className="mb-3 text-3xl">
                  🏠
                </div>

                <p className="text-sm text-slate-500">
                  No servers yet.
                </p>

              </div>
            ) : (
              <div className="mt-6 space-y-3">

                {servers.map(
                  (server) => {
                    const isOwner =
                      server.ownerEmail
                        ?.toLowerCase() ===
                      normalizedUserEmail;

                    const canManage =
                      isOwner ||
                      isSuperAdmin;

                    return (
                      <div
                        key={server.id}
                        className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                      >

                        <button
                          type="button"
                          onClick={() =>
                            onSelectServer(
                              server
                            )
                          }
                          className="flex min-h-16 w-full min-w-0 items-center justify-between gap-3 p-4 text-left transition hover:bg-white/5"
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-xl">
                              👥
                            </div>

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="break-words font-semibold">
                                  {server.name}
                                </p>

                                {isOwner && (
                                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-300">
                                    Owner
                                  </span>
                                )}

                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {server.members?.length ||
                                  0}{" "}
                                members
                              </p>

                              {isSuperAdmin &&
                                !isOwner && (
                                  <p className="mt-1 break-all text-[10px] text-purple-300">
                                    Owner:{" "}
                                    {server.ownerEmail}
                                  </p>
                                )}

                            </div>

                          </div>

                          <span className="shrink-0 text-slate-500">
                            →
                          </span>

                        </button>

                        {canManage && (
                          <div className="border-t border-white/5 p-2">

                            <button
                              type="button"
                              onClick={() =>
                                onManageServer(
                                  server
                                )
                              }
                              className="min-h-11 w-full rounded-xl bg-white/5 px-4 text-sm font-medium text-cyan-300"
                            >
                              ⚙️ Manage Server
                            </button>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

          {/* CREATE SERVER */}

          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:p-6">

            <h2 className="text-xl font-bold">
              Create Server
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a private expense group.
            </p>

            <div className="mt-6">

              <label className="mb-2 block text-sm text-slate-300">
                Server Name
              </label>

              <input
                value={serverName}
                onChange={(event) =>
                  setServerName(
                    event.target.value
                  )
                }
                placeholder="Example: Barkada"
                className="min-h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none"
              />

            </div>

            <div className="mt-5">

              <label className="mb-2 block text-sm text-slate-300">
                Add Member Email
              </label>

              <div className="flex min-w-0 flex-col gap-2 sm:flex-row">

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
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none"
                />

                <button
                  type="button"
                  onClick={addMember}
                  className="min-h-12 rounded-xl bg-white/10 px-5 font-semibold"
                >
                  Add
                </button>

              </div>

            </div>

            <div className="mt-5 space-y-2">

              <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-cyan-400/10 px-3 py-3">

                <span className="min-w-0 break-all text-sm text-cyan-200">
                  {user.email}
                </span>

                <span className="shrink-0 text-xs text-cyan-300">
                  Owner
                </span>

              </div>

              {memberEmails.map(
                (email) => (
                  <div
                    key={email}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-3"
                  >

                    <span className="min-w-0 break-all text-sm text-slate-300">
                      {email}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeMember(
                          email
                        )
                      }
                      className="shrink-0 text-xs text-red-300"
                    >
                      Remove
                    </button>

                  </div>
                )
              )}

            </div>

            <button
              type="button"
              disabled={creating}
              onClick={createServer}
              className="mt-6 min-h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-5 font-bold text-slate-950 disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create Server"}
            </button>

          </section>

        </div>

      </div>

    </div>
  );
}

export default ServerSelector;