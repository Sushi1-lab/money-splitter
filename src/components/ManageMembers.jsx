import { useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react";

import {
  db,
} from "../firebase.js";

import useAppDialog from "../hooks/useAppDialog.jsx";

function ManageMembers({
  user,
  server,
  isSuperAdmin,
  onClose,
  onServerUpdated,
  onServerDeleted,
}) {
  const [email, setEmail] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [
    removingMember,
    setRemovingMember,
  ] = useState(null);

  const [
    showMembers,
    setShowMembers,
  ] = useState(false);

  const {
    Dialog,
    success,
    warning,
    error,
    confirm,
  } = useAppDialog();

  const currentEmail =
    user?.email
      ?.trim()
      .toLowerCase() ||
    "";

  const ownerEmail =
    server?.ownerEmail
      ?.trim()
      .toLowerCase() ||
    "";

  const members =
    server?.members || [];

  const owner =
    currentEmail ===
    ownerEmail;

  const canManage =
    owner ||
    isSuperAdmin;

  const addMember =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !cleanEmail ||
        !cleanEmail.includes(
          "@"
        )
      ) {
        await warning(
          "Valid Email Required",
          "Enter a valid email address."
        );
        return;
      }

      if (
        members.some(
          (member) =>
            member
              .trim()
              .toLowerCase() ===
            cleanEmail
        )
      ) {
        await warning(
          "Already a Member",
          `${cleanEmail} is already included in this workspace.`
        );
        return;
      }

      try {
        setSaving(true);

        const updated = [
          ...members,
          cleanEmail,
        ];

        await updateDoc(
          doc(
            db,
            "servers",
            server.id
          ),
          {
            members:
              updated,
          }
        );

        onServerUpdated?.({
          ...server,
          members:
            updated,
        });

        setEmail("");
        setShowMembers(true);

        await success(
          "Member Added",
          `${cleanEmail} can now access ${server.name}.`
        );
      } catch (err) {
        console.error(
          "Add member error:",
          err
        );

        await error(
          "Unable to Add Member",
          err?.code ===
            "permission-denied"
            ? "Firestore blocked this change. Check your workspace permissions."
            : "Please try again."
        );
      } finally {
        setSaving(false);
      }
    };

  const removeMember =
    async (
      member
    ) => {
      if (
        member
          .toLowerCase() ===
        ownerEmail
      ) {
        return;
      }

      const approved =
        await confirm({
          type:
            "danger",
          title:
            "Remove Member?",
          message:
            `Are you sure you want to remove ${member} from ${server.name}?`,
          confirmText:
            "Remove Member",
        });

      if (
        !approved
      ) {
        return;
      }

      try {
        setSaving(true);
        setRemovingMember(
          member
        );

        const updated =
          members.filter(
            (
              value
            ) =>
              value !==
              member
          );

        await updateDoc(
          doc(
            db,
            "servers",
            server.id
          ),
          {
            members:
              updated,
          }
        );

        onServerUpdated?.({
          ...server,
          members:
            updated,
        });

        await success(
          "Member Removed",
          `${member} was removed from ${server.name}.`
        );
      } catch (err) {
        console.error(
          "Remove member error:",
          err
        );

        await error(
          "Unable to Remove Member",
          "Please try again."
        );
      } finally {
        setSaving(false);
        setRemovingMember(
          null
        );
      }
    };

  const deleteCollection =
    async (
      name
    ) => {
      const snapshot =
        await getDocs(
          collection(
            db,
            "servers",
            server.id,
            name
          )
        );

      await Promise.all(
        snapshot.docs.map(
          (
            item
          ) =>
            deleteDoc(
              item.ref
            )
        )
      );
    };

  const deleteServer =
    async () => {
      const approved =
        await confirm({
          type:
            "danger",
          title:
            "Delete Workspace?",
          message:
            `Are you sure you want to permanently delete "${server.name}"? All expenses, balances, members, usernames, and workspace data will be removed. This action cannot be undone.`,
          confirmText:
            "Delete Workspace",
        });

      if (
        !approved
      ) {
        return;
      }

      try {
        setDeleting(true);

        await Promise.all([
          deleteCollection(
            "splits"
          ),
          deleteCollection(
            "settlements"
          ),
          deleteCollection(
            "people"
          ),
          deleteCollection(
            "usernames"
          ),
        ]);

        await deleteDoc(
          doc(
            db,
            "servers",
            server.id
          )
        );

        onServerDeleted?.(
          server.id
        );
      } catch (err) {
        console.error(
          "Delete workspace error:",
          err
        );

        await error(
          "Unable to Delete Workspace",
          err?.code ===
            "permission-denied"
            ? "Firestore blocked this deletion. Only the workspace owner or super admin can delete it."
            : "Please try again."
        );
      } finally {
        setDeleting(false);
      }
    };

  return (
    <>
      <div className="min-h-[100dvh] w-full bg-[#eaf0fa] px-3 py-6 pb-24 sm:px-6">
        <div className="mx-auto max-w-2xl">

          <header className="mb-5 rounded-[24px] bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white">
            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={
                  onClose
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/20"
              >
                <ArrowLeft
                  size={20}
                />
              </button>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-100/70">
                  Server Settings
                </p>

                <h1 className="truncate text-2xl font-extrabold">
                  {
                    server.name
                  }
                </h1>
              </div>

            </div>
          </header>

          {isSuperAdmin &&
            !owner && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#dce6ff] p-4 text-[#142a76]">
                <ShieldCheck
                  size={20}
                />

                <p className="font-bold">
                  Super Admin access
                </p>
              </div>
            )}

          <section className="app-card overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setShowMembers(
                  (
                    current
                  ) =>
                    !current
                )
              }
              className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-6"
            >
              <div className="flex items-center gap-3">
                <div className="app-icon-box">
                  <UsersRound
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-[#182442]">
                    Members
                  </h2>

                  <p className="mt-1 text-xs font-bold text-[#8995aa]">
                    {members.length} member{members.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-extrabold text-[#52617d] sm:inline">
                  {showMembers
                    ? "Hide Members"
                    : "Show Members"}
                </span>

                {showMembers ? (
                  <ChevronDown
                    size={19}
                    className="text-[#71809a]"
                  />
                ) : (
                  <ChevronRight
                    size={19}
                    className="text-[#71809a]"
                  />
                )}
              </div>
            </button>

            {showMembers && (
              <div className="border-t border-[#e3e8f0] p-4 sm:p-6">

                {canManage && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={
                        email
                      }
                      onChange={(
                        event
                      ) =>
                        setEmail(
                          event
                            .target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();
                          addMember();
                        }
                      }}
                      placeholder="friend@gmail.com"
                      className="app-input min-w-0 flex-1"
                    />

                    <button
                      type="button"
                      disabled={
                        saving
                      }
                      onClick={
                        addMember
                      }
                      className="app-button-primary flex min-h-12 items-center justify-center gap-2 px-5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving &&
                      !removingMember ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <UserPlus
                          size={17}
                        />
                      )}

                      {saving &&
                      !removingMember
                        ? "Adding..."
                        : "Add"}
                    </button>
                  </div>
                )}

                <div className={`${canManage ? "mt-6" : ""} space-y-2`}>
                  {members.length ===
                  0 ? (
                    <div className="rounded-2xl bg-[#eef2f8] p-6 text-center">
                      <UsersRound
                        size={28}
                        className="mx-auto text-[#9ba6b9]"
                      />

                      <p className="mt-3 text-sm font-extrabold text-[#52617d]">
                        No members yet
                      </p>
                    </div>
                  ) : (
                    members.map(
                      (
                        member
                      ) => {
                        const isOwner =
                          member
                            .toLowerCase() ===
                          ownerEmail;

                        const isMe =
                          member
                            .toLowerCase() ===
                          currentEmail;

                        return (
                          <div
                            key={
                              member
                            }
                            className="flex items-center justify-between gap-3 rounded-2xl bg-[#eaf0fa] p-4"
                          >
                            <div className="min-w-0">
                              <p className="break-all text-sm font-bold text-[#182442]">
                                {
                                  member
                                }
                              </p>

                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {isOwner && (
                                  <span className="rounded-full bg-[#dce6ff] px-2 py-0.5 text-[10px] font-extrabold text-[#142a76]">
                                    Owner
                                  </span>
                                )}

                                {isMe && (
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#71809a]">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>

                            {canManage &&
                              !isOwner && (
                                <button
                                  type="button"
                                  disabled={
                                    saving
                                  }
                                  title="Remove member"
                                  onClick={() =>
                                    removeMember(
                                      member
                                    )
                                  }
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffeded] text-[#cf4646] transition hover:bg-[#ffe1e1] disabled:opacity-50"
                                >
                                  {removingMember ===
                                  member ? (
                                    <LoaderCircle
                                      size={18}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <UserMinus
                                      size={18}
                                    />
                                  )}
                                </button>
                              )}
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {canManage && (
            <section className="mt-5 rounded-[24px] border border-[#efcaca] bg-[#fff1f1] p-5">
              <div className="flex items-center gap-3 text-[#cf4646]">
                <Trash2
                  size={21}
                />

                <div>
                  <h2 className="text-lg font-extrabold">
                    Delete Workspace
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[#a85b5b]">
                    Permanently remove this workspace and its saved data.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={
                  deleteServer
                }
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#cf4646] px-5 font-bold text-white transition hover:bg-[#ba3f3f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  "Delete Workspace"
                )}
              </button>
            </section>
          )}

        </div>
      </div>

      <Dialog />
    </>
  );
}

export default ManageMembers;
