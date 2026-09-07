import {
  useState,
} from "react";

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
  activeServer,
  onSelectServer,
  onRefreshServers,
}) {
  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    serverName,
    setServerName,
  ] = useState("");

  const [
    memberEmail,
    setMemberEmail,
  ] = useState("");

  const [
    memberEmails,
    setMemberEmails,
  ] = useState([]);

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

    if (
      !email.includes("@")
    ) {
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
        "You are already automatically included."
      );

      return;
    }

    const exists =
      memberEmails.includes(
        email
      );

    if (exists) {
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
        alert(
          "Your Google account needs an email address."
        );

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
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Money Splitter
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Your Servers
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Signed in as{" "}
              {user.email}
            </p>

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

        <div className="grid gap-6 lg:grid-cols-2">

          {/* EXISTING SERVERS */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 sm:p-6">

            <h2 className="text-xl font-bold">
              Your Servers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Only servers where your
              email is a member appear
              here.
            </p>

            {servers.length ===
            0 ? (

              <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center">

                <div className="mb-3 text-3xl">
                  🏠
                </div>

                <p className="text-sm text-slate-500">
                  You don't have a server yet.
                </p>

              </div>

            ) : (

              <div className="mt-6 space-y-3">

                {servers.map(
                  (server) => (

                    <button
                      type="button"
                      key={
                        server.id
                      }
                      onClick={() =>
                        onSelectServer(
                          server
                        )
                      }
                      className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                        activeServer
                          ?.id ===
                        server.id
                          ? "border-cyan-400/40 bg-cyan-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-xl">
                          👥
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold">
                            {
                              server.name
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            {
                              server
                                .members
                                ?.length ||
                              0
                            }{" "}
                            members
                          </p>

                        </div>

                      </div>

                      <span className="shrink-0 text-slate-500">
                        →
                      </span>

                    </button>

                  )
                )}

              </div>
            )}

          </section>

          {/* CREATE SERVER */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 sm:p-6">

            <h2 className="text-xl font-bold">
              Create Server
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add the Google email
              addresses of people who
              should have access.
            </p>

            <div className="mt-6">

              <label className="mb-2 block text-sm text-slate-300">
                Server Name
              </label>

              <input
                value={
                  serverName
                }
                onChange={(
                  event
                ) =>
                  setServerName(
                    event.target
                      .value
                  )
                }
                placeholder="Example: Marl, Ron & Justin"
                className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none focus:border-cyan-400/50"
              />

            </div>

            <div className="mt-5">

              <label className="mb-2 block text-sm text-slate-300">
                Add Member Email
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">

                <input
                  type="email"
                  value={
                    memberEmail
                  }
                  onChange={(
                    event
                  ) =>
                    setMemberEmail(
                      event.target
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
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none"
                />

                <button
                  type="button"
                  onClick={
                    addMember
                  }
                  className="min-h-12 rounded-xl bg-white/10 px-5 font-semibold"
                >
                  Add
                </button>

              </div>

            </div>

            {/* CREATOR */}

            <div className="mt-5">

              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Members
              </p>

              <div className="space-y-2">

                <div className="flex items-center justify-between gap-3 rounded-xl bg-cyan-400/10 px-3 py-3">

                  <span className="min-w-0 truncate text-sm text-cyan-200">
                    {user.email}
                  </span>

                  <span className="shrink-0 text-xs text-cyan-300">
                    You
                  </span>

                </div>

                {memberEmails.map(
                  (email) => (

                    <div
                      key={email}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-3"
                    >

                      <span className="min-w-0 truncate text-sm text-slate-300">
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

            </div>

            <button
              type="button"
              disabled={creating}
              onClick={
                createServer
              }
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