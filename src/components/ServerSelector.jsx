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
  ChevronRight,
  CirclePlus,
  LogOut,
  Server,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  auth,
  db,
} from "../firebase.js";

function ServerSelector({
  user,
  profile,
  servers = [],
  isSuperAdmin,
  onSelectServer,
  onRefreshServers,
  onManageServer,
}) {
  const [
    serverName,
    setServerName,
  ] = useState("");

  const [
    memberEmail,
    setMemberEmail,
  ] = useState("");

  const [
    members,
    setMembers,
  ] = useState([]);

  const [creating, setCreating] =
    useState(false);

  const email =
    user?.email
      ?.trim()
      .toLowerCase() || "";

  const addMember = () => {
    const clean =
      memberEmail
        .trim()
        .toLowerCase();

    if (
      !clean ||
      !clean.includes("@")
    ) {
      alert(
        "Enter a valid email."
      );
      return;
    }

    if (
      clean === email ||
      members.includes(
        clean
      )
    ) {
      alert(
        "That email is already included."
      );
      return;
    }

    setMembers(
      (current) => [
        ...current,
        clean,
      ]
    );

    setMemberEmail("");
  };

  const createServer =
    async () => {
      const name =
        serverName.trim();

      if (!name) {
        alert(
          "Enter a server name."
        );
        return;
      }

      try {
        setCreating(true);

        const ref =
          await addDoc(
            collection(
              db,
              "servers"
            ),
            {
              name,

              ownerEmail:
                email,

              ownerUid:
                user.uid,

              members: [
                email,
                ...members,
              ],

              createdAt:
                serverTimestamp(),
            }
          );

        setServerName("");
        setMemberEmail("");
        setMembers([]);

        await onRefreshServers(
          ref.id
        );
      } catch (error) {
        console.error(error);

        alert(
          "Unable to create server."
        );
      } finally {
        setCreating(false);
      }
    };

  return (
    <div className="min-h-[100dvh] w-full bg-[#eaf0fa] px-3 py-6 pb-24 sm:px-6">

      <div className="mx-auto max-w-5xl">

        <header className="mb-6 rounded-[24px] bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-7">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <p className="text-sm text-blue-100/70">
                Good to see you,
              </p>

              <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                {profile?.displayName ||
                  "User"}!
              </h1>

              <div className="mt-2 flex flex-wrap gap-2">

                {profile?.username && (
                  <span className="text-sm text-blue-100/75">
                    @
                    {
                      profile.username
                    }
                  </span>
                )}

                {isSuperAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">

                    <ShieldCheck
                      size={14}
                    />

                    Super Admin

                  </span>
                )}

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                signOut(auth)
              }
              className="flex min-h-11 items-center gap-2 rounded-xl bg-white/12 px-4 text-sm font-bold"
            >
              <LogOut
                size={17}
              />

              Sign Out
            </button>

          </div>

        </header>

        <div className="grid gap-5 lg:grid-cols-2">

          <section className="app-card p-4 sm:p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#3d63d2]">
                  Workspace
                </p>

                <h2 className="mt-1 text-xl font-extrabold">
                  {isSuperAdmin
                    ? "All Servers"
                    : "Your Servers"}
                </h2>

              </div>

              <div className="app-icon-box">
                <Server
                  size={22}
                />
              </div>

            </div>

            {servers.length ===
            0 ? (
              <div className="mt-5 rounded-2xl bg-[#eaf0fa] p-8 text-center">

                <Server
                  size={30}
                  className="mx-auto text-[#9da9bb]"
                />

                <p className="mt-3 font-bold">
                  No servers yet
                </p>

              </div>
            ) : (
              <div className="mt-5 space-y-3">

                {servers.map(
                  (server) => {
                    const owner =
                      server.ownerEmail
                        ?.toLowerCase() ===
                      email;

                    const canManage =
                      owner ||
                      isSuperAdmin;

                    return (
                      <div
                        key={
                          server.id
                        }
                        className="overflow-hidden rounded-[20px] border border-[#dce3ef] bg-[#f4f7fc]"
                      >

                        <button
                          type="button"
                          onClick={() =>
                            onSelectServer(
                              server
                            )
                          }
                          className="flex min-h-[76px] w-full items-center gap-3 p-4 text-left"
                        >

                          <div className="app-icon-box">
                            <UsersRound
                              size={22}
                            />
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="truncate font-extrabold">
                              {
                                server.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-[#8995aa]">
                              {server.members
                                ?.length ||
                                0}{" "}
                              members
                            </p>

                          </div>

                          <ChevronRight
                            size={20}
                            className="text-[#8995aa]"
                          />

                        </button>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() =>
                              onManageServer(
                                server
                              )
                            }
                            className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-[#dce3ef] bg-[#e9eef8] text-sm font-bold text-[#294aad]"
                          >
                            <Settings
                              size={16}
                            />

                            Manage
                          </button>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

          <section className="app-card p-4 sm:p-6">

            <div className="flex items-center gap-3">

              <div className="app-icon-box">
                <CirclePlus
                  size={22}
                />
              </div>

              <div>

                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#3d63d2]">
                  New Group
                </p>

                <h2 className="text-xl font-extrabold">
                  Create Server
                </h2>

              </div>

            </div>

            <div className="mt-6">

              <label className="app-label">
                Server Name
              </label>

              <input
                value={
                  serverName
                }
                onChange={(event) =>
                  setServerName(
                    event.target.value
                  )
                }
                placeholder="Palawan Trip"
                className="app-input"
              />

            </div>

            <div className="mt-5">

              <label className="app-label">
                Add Member Email
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">

                <input
                  type="email"
                  value={
                    memberEmail
                  }
                  onChange={(event) =>
                    setMemberEmail(
                      event.target.value
                    )
                  }
                  placeholder="friend@gmail.com"
                  className="app-input min-w-0 flex-1"
                />

                <button
                  type="button"
                  onClick={
                    addMember
                  }
                  className="app-button-secondary px-5"
                >
                  Add
                </button>

              </div>

            </div>

            <div className="mt-5 space-y-2">

              <div className="rounded-2xl bg-[#e4ebff] p-3">

                <p className="break-all text-sm font-bold text-[#142a76]">
                  {email}
                </p>

                <p className="text-xs text-[#71809a]">
                  Owner
                </p>

              </div>

              {members.map(
                (member) => (
                  <div
                    key={
                      member
                    }
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#eaf0fa] p-3"
                  >

                    <p className="min-w-0 break-all text-sm">
                      {member}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setMembers(
                          (current) =>
                            current.filter(
                              (value) =>
                                value !==
                                member
                            )
                        )
                      }
                      className="text-xs font-bold text-[#cf4646]"
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
              onClick={
                createServer
              }
              className="app-button-primary mt-6 w-full disabled:opacity-50"
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