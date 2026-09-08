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
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react";

import {
  db,
} from "../firebase.js";

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

  const currentEmail =
    user.email
      .trim()
      .toLowerCase();

  const ownerEmail =
    server.ownerEmail
      ?.trim()
      .toLowerCase();

  const members =
    server.members || [];

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
        !cleanEmail.includes(
          "@"
        )
      ) {
        alert(
          "Enter a valid email."
        );
        return;
      }

      if (
        members.includes(
          cleanEmail
        )
      ) {
        alert(
          "Already a member."
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

        onServerUpdated({
          ...server,
          members:
            updated,
        });

        setEmail("");
      } catch (error) {
        console.error(error);

        alert(
          "Unable to add member."
        );
      } finally {
        setSaving(false);
      }
    };

  const removeMember =
    async (member) => {
      if (
        member.toLowerCase() ===
        ownerEmail
      ) {
        return;
      }

      if (
        !window.confirm(
          `Remove ${member}?`
        )
      ) {
        return;
      }

      try {
        setSaving(true);

        const updated =
          members.filter(
            (value) =>
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

        onServerUpdated({
          ...server,
          members:
            updated,
        });
      } finally {
        setSaving(false);
      }
    };

  const deleteCollection =
    async (name) => {
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
          (item) =>
            deleteDoc(
              item.ref
            )
        )
      );
    };

  const deleteServer =
    async () => {
      if (
        !window.confirm(
          `Delete "${server.name}" permanently?`
        )
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
        ]);

        await deleteDoc(
          doc(
            db,
            "servers",
            server.id
          )
        );

        onServerDeleted(
          server.id
        );
      } catch (error) {
        console.error(error);

        alert(
          "Unable to delete server."
        );
      } finally {
        setDeleting(false);
      }
    };

  return (
    <div className="min-h-[100dvh] w-full bg-[#eaf0fa] px-3 py-6 pb-24 sm:px-6">

      <div className="mx-auto max-w-2xl">

        <header className="mb-5 rounded-[24px] bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"
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
                {server.name}
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

        <section className="app-card p-4 sm:p-6">

          <div className="flex items-center gap-3">

            <div className="app-icon-box">
              <UsersRound
                size={22}
              />
            </div>

            <h2 className="text-xl font-extrabold">
              Members
            </h2>

          </div>

          {canManage && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="friend@gmail.com"
                className="app-input min-w-0 flex-1"
              />

              <button
                type="button"
                disabled={saving}
                onClick={
                  addMember
                }
                className="app-button-primary flex items-center justify-center gap-2 px-5"
              >
                <UserPlus
                  size={17}
                />

                Add
              </button>

            </div>
          )}

          <div className="mt-6 space-y-2">

            {members.map(
              (member) => {
                const isOwner =
                  member.toLowerCase() ===
                  ownerEmail;

                return (
                  <div
                    key={
                      member
                    }
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#eaf0fa] p-4"
                  >

                    <div className="min-w-0">

                      <p className="break-all text-sm font-bold">
                        {member}
                      </p>

                      {isOwner && (
                        <p className="text-xs font-bold text-[#142a76]">
                          Owner
                        </p>
                      )}

                    </div>

                    {canManage &&
                      !isOwner && (
                        <button
                          type="button"
                          onClick={() =>
                            removeMember(
                              member
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffeded] text-[#cf4646]"
                        >
                          <UserMinus
                            size={18}
                          />
                        </button>
                      )}

                  </div>
                );
              }
            )}

          </div>

        </section>

        {canManage && (
          <section className="mt-5 rounded-[24px] border border-[#efcaca] bg-[#fff1f1] p-5">

            <div className="flex items-center gap-3 text-[#cf4646]">

              <Trash2
                size={21}
              />

              <h2 className="text-lg font-extrabold">
                Delete Server
              </h2>

            </div>

            <button
              type="button"
              disabled={deleting}
              onClick={
                deleteServer
              }
              className="mt-5 min-h-12 w-full rounded-xl bg-[#cf4646] px-5 font-bold text-white"
            >
              {deleting
                ? "Deleting..."
                : "Delete Server"}
            </button>

          </section>
        )}

      </div>

    </div>
  );
}

export default ManageMembers;