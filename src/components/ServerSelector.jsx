import {
  ArrowLeft,
  ArrowLeftRight,
  AtSign,
  ChevronDown,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Plus,
  Server,
  Settings,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase.js";

import useAppDialog from "../hooks/useAppDialog.jsx";

function ServerSelector({
  user,
  profile,
  servers = [],
  isSuperAdmin = false,
  onSelectServer,
  onRefreshServers,
  onManageServer,
  onSwitchApp,
}) {
  const {
    Dialog,
    success,
    warning,
    error,
    confirm,
  } = useAppDialog();

  const [showWorkspaces, setShowWorkspaces] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [name, setName] =
    useState("");

  const [serverType, setServerType] =
    useState("temporary");

  const [creating, setCreating] =
    useState(false);

  const [
    entryServer,
    setEntryServer,
  ] = useState(null);

  const [
    entryUsername,
    setEntryUsername,
  ] = useState(
    profile?.username || ""
  );

  const [
    lockedWorkspaceUsername,
    setLockedWorkspaceUsername,
  ] = useState("");

  const [
    checkingWorkspaceUsername,
    setCheckingWorkspaceUsername,
  ] = useState(false);

  const [
    typeEditorServerId,
    setTypeEditorServerId,
  ] = useState(null);

  const [
    typeSavingId,
    setTypeSavingId,
  ] = useState(null);

  const [
    enteringServerId,
    setEnteringServerId,
  ] = useState(null);

  const normalizeUsername = (
    value = ""
  ) =>
    String(value)
      .trim()
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 20);

  const openWorkspaceEntry =
    async (server) => {
      setEntryServer(
        server
      );

      const fallbackUsername =
        normalizeUsername(
          profile?.username || ""
        );

      setEntryUsername(
        fallbackUsername
      );

      setLockedWorkspaceUsername(
        ""
      );

      if (
        !server?.id ||
        !user?.email
      ) {
        return;
      }

      try {
        setCheckingWorkspaceUsername(
          true
        );

        const currentEmail =
          normalizeEmail(
            user.email
          );

        const snapshot =
          await getDocs(
            collection(
              db,
              "servers",
              server.id,
              "usernames"
            )
          );

        const registeredEntry =
          snapshot.docs.find(
            (item) => {
              const data =
                item.data();

              return (
                normalizeEmail(
                  data?.email ||
                    ""
                ) ===
                currentEmail
              );
            }
          );

        let registeredUsername =
          "";

        if (
          registeredEntry
        ) {
          registeredUsername =
            normalizeUsername(
              registeredEntry.data()
                ?.username ||
                registeredEntry.id ||
                ""
            );
        }

        // Migration fallback:
        // Older workspaces may only have the username on a people record.
        if (
          !registeredUsername
        ) {
          const peopleSnapshot =
            await getDocs(
              collection(
                db,
                "servers",
                server.id,
                "people"
              )
            );

          const linkedPerson =
            peopleSnapshot.docs.find(
              (item) => {
                const data =
                  item.data();

                return (
                  normalizeEmail(
                    data?.linkedEmail ||
                      ""
                  ) ===
                    currentEmail &&
                  normalizeUsername(
                    data?.username ||
                      ""
                  )
                );
              }
            );

          if (
            linkedPerson
          ) {
            registeredUsername =
              normalizeUsername(
                linkedPerson.data()
                  ?.username ||
                  ""
              );
          }
        }

        if (
          registeredUsername
        ) {
          setLockedWorkspaceUsername(
            registeredUsername
          );

          setEntryUsername(
            registeredUsername
          );
        }
      } catch (err) {
        console.error(
          "Existing workspace username lookup error:",
          err
        );
      } finally {
        setCheckingWorkspaceUsername(
          false
        );
      }
    };

  const continueIntoWorkspace =
    async () => {
      const cleanUsername =
        normalizeUsername(
          entryUsername
        );

      if (
        cleanUsername.length <
        3
      ) {
        await warning(
          "Username Required",
          "Choose a username with at least 3 characters."
        );

        return;
      }

      try {
        setEnteringServerId(
          entryServer?.id ||
            "entering"
        );

        const currentEmail =
          normalizeEmail(
            user?.email
          );

        if (
          entryServer?.id
        ) {
          const usernamesSnapshot =
            await getDocs(
              collection(
                db,
                "servers",
                entryServer.id,
                "usernames"
              )
            );

          const emailRegisteredEntry =
            usernamesSnapshot.docs.find(
              (item) => {
                const data =
                  item.data();

                return (
                  normalizeEmail(
                    data?.email ||
                      ""
                  ) ===
                  currentEmail
                );
              }
            );

          if (
            emailRegisteredEntry
          ) {
            const registeredUsername =
              normalizeUsername(
                emailRegisteredEntry.data()
                  ?.username ||
                  emailRegisteredEntry.id ||
                  ""
              );

            if (
              registeredUsername &&
              registeredUsername !==
                cleanUsername
            ) {
              setLockedWorkspaceUsername(
                registeredUsername
              );

              setEntryUsername(
                registeredUsername
              );

              await error(
                "Workspace Username Cannot Be Changed",
                `Your email is already registered as @${registeredUsername} in this workspace. Once a workspace username is registered, it cannot be changed.`
              );

              return;
            }
          } else {
            const approved =
              await confirm({
                type:
                  "warning",
                title:
                  "Confirm Your Workspace Username",
                message:
                  `You are about to register @${cleanUsername} for ${entryServer?.name || "this workspace"}. This username will be permanently linked to ${currentEmail} in this workspace and cannot be changed later.`,
                confirmText:
                  `Use @${cleanUsername}`,
              });

            if (
              !approved
            ) {
              return;
            }
          }

          const usernameRef =
            doc(
              db,
              "servers",
              entryServer.id,
              "usernames",
              cleanUsername
            );

          const usernameSnapshot =
            await getDoc(
              usernameRef
            );

          if (
            usernameSnapshot.exists()
          ) {
            const registeredEmail =
              normalizeEmail(
                usernameSnapshot.data()
                  ?.email ||
                  ""
              );

            if (
              registeredEmail &&
              registeredEmail !==
                currentEmail
            ) {
              await error(
                "Username Already Registered",
                `@${cleanUsername} is already connected to another registered email in this workspace. Please choose a different username.`
              );

              return;
            }
          }

          // Migration-safe fallback for older workspace members
          // whose usernames may only exist in the people collection.
          const peopleSnapshot =
            await getDocs(
              collection(
                db,
                "servers",
                entryServer.id,
                "people"
              )
            );

          const conflictingPerson =
            peopleSnapshot.docs.find(
              (item) => {
                const data =
                  item.data();

                const savedUsername =
                  normalizeUsername(
                    data?.username ||
                      ""
                  );

                const savedEmail =
                  normalizeEmail(
                    data?.linkedEmail ||
                      ""
                  );

                return (
                  savedUsername ===
                    cleanUsername &&
                  savedEmail &&
                  savedEmail !==
                    currentEmail
                );
              }
            );

          if (
            conflictingPerson
          ) {
            await error(
              "Username Already Registered",
              `@${cleanUsername} is already connected to another registered email in this workspace. Please choose a different username.`
            );

            return;
          }
        }

        await onSelectServer?.(
          entryServer,
          cleanUsername
        );
      } catch (err) {
        console.error(
          "Workspace username validation error:",
          err
        );

        await error(
          "Unable to Verify Username",
          err?.code ===
            "permission-denied"
            ? "Firestore blocked the username check. Please make sure your updated Firestore rules are published."
            : "We couldn't verify this username right now. Please try again."
        );
      } finally {
        setEnteringServerId(
          null
        );
      }
    };

  const normalizeEmail = (
    email = ""
  ) =>
    String(email)
      .trim()
      .toLowerCase();

  const canManageWorkspace = (
    server
  ) =>
    isSuperAdmin ||
    normalizeEmail(
      server?.ownerEmail
    ) ===
      normalizeEmail(
        user?.email
      );

  const changeWorkspaceType =
    async (
      server,
      nextType
    ) => {
      if (
        !server?.id ||
        !canManageWorkspace(
          server
        )
      ) {
        return;
      }

      const currentType =
        server.serverType ||
        server.workspaceType ||
        "temporary";

      if (
        currentType ===
        nextType
      ) {
        setTypeEditorServerId(
          null
        );

        return;
      }

      const nextLabel =
        nextType ===
        "long-term"
          ? "Long-term"
          : "Temporary";

      const approved =
        await confirm({
          type:
            "info",
          title:
            `Change to ${nextLabel}?`,
          message:
            nextType ===
            "long-term"
              ? "Monthly expense analytics and long-term workspace features will become available."
              : "Monthly long-term analytics will be hidden, but your existing expenses and members will remain.",
          confirmText:
            `Use ${nextLabel}`,
        });

      if (!approved) {
        return;
      }

      try {
        setTypeSavingId(
          server.id
        );

        await updateDoc(
          doc(
            db,
            "servers",
            server.id
          ),
          {
            serverType:
              nextType,
            workspaceType:
              nextType,
            typeUpdatedByUid:
              user?.uid ||
              "",
            typeUpdatedByEmail:
              normalizeEmail(
                user?.email
              ),
            typeUpdatedAt:
              serverTimestamp(),
          }
        );

        setTypeEditorServerId(
          null
        );

        await onRefreshServers?.();

        await success(
          "Workspace Type Updated",
          `${server.name} is now a ${nextLabel.toLowerCase()} workspace.`
        );
      } catch (err) {
        console.error(
          "Workspace type update error:",
          err
        );

        await error(
          "Unable to Change Workspace Type",
          err?.code ===
            "permission-denied"
            ? "Firestore blocked this change. Only the workspace owner or super admin can change the workspace type."
            : "Please try again."
        );
      } finally {
        setTypeSavingId(
          null
        );
      }
    };

  const createServer =
    async (
      event
    ) => {
      event.preventDefault();

      const cleanName =
        name
          .trim()
          .replace(/\s+/g, " ");

      if (!cleanName) {
        await warning(
          "Workspace Name Required",
          "Enter a name for your workspace."
        );
        return;
      }

      try {
        setCreating(true);

        const email =
          normalizeEmail(
            user?.email
          );

        const reference =
          await addDoc(
            collection(
              db,
              "servers"
            ),
            {
              name:
                cleanName,
              serverType,
              ownerUid:
                user?.uid ||
                "",
              ownerEmail:
                email,
              ownerUsername:
                profile?.username ||
                "",
              members: [
                email,
              ],
              createdAt:
                serverTimestamp(),
            }
          );

        setName("");
        setServerType(
          "temporary"
        );
        setShowCreate(false);
        setShowWorkspaces(true);

        // Refresh the list only. The user should open the
        // workspace explicitly so App.jsx can perform the
        // server-scoped username check before entry.
        await onRefreshServers?.();
      } catch (err) {
        console.error(
          "Create workspace error:",
          err
        );

        await error(
          "Unable to Create Workspace",
          "Please try again."
        );
      } finally {
        setCreating(false);
      }
    };

  return (
    <>
      <main className="min-h-[100dvh] bg-[#eaf0fa] px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4">
            <button
              type="button"
              onClick={
                onSwitchApp
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-[#52617d] shadow-sm transition hover:bg-[#f7f9fd]"
            >
              <ArrowLeft
                size={18}
              />
              Back
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#10245f] via-[#1b378e] to-[#3d63d2] p-6 text-white shadow-[0_20px_50px_rgba(20,42,118,0.18)] sm:p-8">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-extrabold">
                <Sparkles
                  size={14}
                />
                Workspace Hub
              </div>

              <h1 className="mt-4 text-3xl font-black">
                Welcome,{" "}
                {profile?.displayName ||
                  "there"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
                Choose where you want to split expenses. These are only the workspaces you are included in.
              </p>

              {isSuperAdmin && (
                <span className="mt-4 inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-bold">
                  Super Admin access
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="app-card overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setShowWorkspaces(
                    (current) =>
                      !current
                  )
                }
                className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#294aad]">
                    <Server
                      size={22}
                    />
                  </div>

                  <div>
                    <h2 className="font-extrabold text-[#182442]">
                      My Workspaces
                    </h2>

                    <p className="mt-1 text-xs text-[#8995aa]">
                      {servers.length} workspace{servers.length === 1 ? "" : "s"} you can access
                    </p>
                  </div>
                </div>

                {showWorkspaces ? (
                  <ChevronDown
                    size={19}
                  />
                ) : (
                  <ChevronRight
                    size={19}
                  />
                )}
              </button>

              {showWorkspaces && (
                <div className="border-t border-[#e3e8f0] p-4 sm:p-6">
                  <div className="mb-4 rounded-xl bg-[#eef3ff] px-4 py-3 text-xs font-bold leading-5 text-[#52617d]">
                    These are only the servers/workspaces where your email is included as a member.
                  </div>

                  {servers.length ===
                  0 ? (
                    <div className="rounded-2xl bg-[#eef2f8] p-7 text-center">
                      <Server
                        size={30}
                        className="mx-auto text-[#9ba6b9]"
                      />

                      <p className="mt-3 font-extrabold text-[#52617d]">
                        No workspace yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {servers.map(
                        (server) => {
                          const type =
                            server.serverType ||
                            server.workspaceType ||
                            "temporary";

                          return (
                            <div
                              key={
                                server.id
                              }
                              className="rounded-[20px] border border-[#dce3ef] bg-[#f8faff] p-4"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectServer?.(
                                    server
                                  )
                                }
                                className="w-full text-left"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#294aad]">
                                    {type ===
                                    "long-term" ? (
                                      <Users
                                        size={20}
                                      />
                                    ) : (
                                      <Clock3
                                        size={20}
                                      />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-extrabold text-[#182442]">
                                      {
                                        server.name
                                      }
                                    </p>

                                    <p className="mt-1 text-xs capitalize text-[#8995aa]">
                                      {type ===
                                      "long-term"
                                        ? "Long-term workspace"
                                        : "Temporary workspace"}
                                    </p>
                                  </div>
                                </div>
                              </button>

                              <div className="mt-4 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openWorkspaceEntry(
                                      server
                                    )
                                  }
                                  className="min-h-10 flex-1 rounded-xl bg-[#142a76] text-xs font-extrabold text-white"
                                >
                                  Open
                                </button>

                                <button
                                  type="button"
                                  title="Manage workspace"
                                  onClick={() =>
                                    onManageServer?.(
                                      server
                                    )
                                  }
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8edf5] text-[#52617d]"
                                >
                                  <Settings
                                    size={16}
                                  />
                                </button>
                              </div>

                              {canManageWorkspace(
                                server
                              ) && (
                                <div className="mt-3 overflow-hidden rounded-2xl border border-[#dce3ef] bg-white">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTypeEditorServerId(
                                        (
                                          current
                                        ) =>
                                          current ===
                                          server.id
                                            ? null
                                            : server.id
                                      )
                                    }
                                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                                  >
                                    <div>
                                      <p className="text-xs font-extrabold text-[#182442]">
                                        Workspace Type
                                      </p>

                                      <p className="mt-0.5 text-[11px] text-[#8995aa]">
                                        Admin setting · currently{" "}
                                        {type ===
                                        "long-term"
                                          ? "Long-term"
                                          : "Temporary"}
                                      </p>
                                    </div>

                                    {typeEditorServerId ===
                                    server.id ? (
                                      <ChevronDown
                                        size={16}
                                        className="text-[#71809a]"
                                      />
                                    ) : (
                                      <ChevronRight
                                        size={16}
                                        className="text-[#71809a]"
                                      />
                                    )}
                                  </button>

                                  {typeEditorServerId ===
                                    server.id && (
                                    <div className="grid grid-cols-2 gap-2 border-t border-[#e3e8f0] p-3">
                                      <button
                                        type="button"
                                        disabled={
                                          typeSavingId ===
                                          server.id
                                        }
                                        onClick={() =>
                                          changeWorkspaceType(
                                            server,
                                            "temporary"
                                          )
                                        }
                                        className={`rounded-xl border px-3 py-3 text-left transition disabled:opacity-50 ${
                                          type !==
                                          "long-term"
                                            ? "border-[#294aad] bg-[#e4ebff]"
                                            : "border-[#dce3ef] bg-[#f8faff]"
                                        }`}
                                      >
                                        {typeSavingId ===
                                        server.id ? (
                                          <LoaderCircle
                                            size={17}
                                            className="animate-spin text-[#294aad]"
                                          />
                                        ) : (
                                          <Clock3
                                            size={17}
                                            className={
                                              type !==
                                              "long-term"
                                                ? "text-[#294aad]"
                                                : "text-[#8995aa]"
                                            }
                                          />
                                        )}

                                        <p className="mt-2 text-xs font-extrabold text-[#182442]">
                                          Temporary
                                        </p>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          typeSavingId ===
                                          server.id
                                        }
                                        onClick={() =>
                                          changeWorkspaceType(
                                            server,
                                            "long-term"
                                          )
                                        }
                                        className={`rounded-xl border px-3 py-3 text-left transition disabled:opacity-50 ${
                                          type ===
                                          "long-term"
                                            ? "border-[#294aad] bg-[#e4ebff]"
                                            : "border-[#dce3ef] bg-[#f8faff]"
                                        }`}
                                      >
                                        {typeSavingId ===
                                        server.id ? (
                                          <LoaderCircle
                                            size={17}
                                            className="animate-spin text-[#294aad]"
                                          />
                                        ) : (
                                          <Users
                                            size={17}
                                            className={
                                              type ===
                                              "long-term"
                                                ? "text-[#294aad]"
                                                : "text-[#8995aa]"
                                            }
                                          />
                                        )}

                                        <p className="mt-2 text-xs font-extrabold text-[#182442]">
                                          Long-term
                                        </p>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="app-card overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setShowCreate(
                    (current) =>
                      !current
                  )
                }
                className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f6ef] text-[#18845c]">
                    {showCreate ? (
                      <X
                        size={21}
                      />
                    ) : (
                      <Plus
                        size={21}
                      />
                    )}
                  </div>

                  <div>
                    <h2 className="font-extrabold text-[#182442]">
                      Create New Workspace
                    </h2>

                    <p className="mt-1 text-xs text-[#8995aa]">
                      Click first to show the creation panel
                    </p>
                  </div>
                </div>

                {showCreate ? (
                  <ChevronDown
                    size={19}
                  />
                ) : (
                  <ChevronRight
                    size={19}
                  />
                )}
              </button>

              {showCreate && (
                <form
                  onSubmit={
                    createServer
                  }
                  className="space-y-5 border-t border-[#e3e8f0] p-5 sm:p-6"
                >
                  <div>
                    <label className="app-label">
                      Workspace Name
                    </label>

                    <input
                      value={
                        name
                      }
                      onChange={(
                        event
                      ) =>
                        setName(
                          event.target
                            .value
                        )
                      }
                      className="app-input"
                      placeholder="Trip to Palawan, Housemates..."
                    />
                  </div>

                  <div>
                    <label className="app-label">
                      Workspace Type
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          value:
                            "temporary",
                          title:
                            "Temporary",
                          text:
                            "Trips, events, short projects",
                          icon:
                            Clock3,
                        },
                        {
                          value:
                            "long-term",
                          title:
                            "Long-term",
                          text:
                            "Housemates, teams, ongoing groups",
                          icon:
                            Users,
                        },
                      ].map(
                        (option) => {
                          const Icon =
                            option.icon;

                          const selected =
                            serverType ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              onClick={() =>
                                setServerType(
                                  option.value
                                )
                              }
                              className={`rounded-2xl border p-4 text-left transition ${
                                selected
                                  ? "border-[#294aad] bg-[#e4ebff]"
                                  : "border-[#dce3ef] bg-[#f8faff]"
                              }`}
                            >
                              <Icon
                                size={20}
                                className={
                                  selected
                                    ? "text-[#294aad]"
                                    : "text-[#8995aa]"
                                }
                              />

                              <p className="mt-3 font-extrabold text-[#182442]">
                                {
                                  option.title
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                                {
                                  option.text
                                }
                              </p>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      creating
                    }
                    className="app-button-primary flex min-h-12 w-full items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Plus
                        size={17}
                      />
                    )}
                    {creating
                      ? "Creating..."
                      : "Create Workspace"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {entryServer && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#071334]/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_28px_80px_rgba(20,42,118,0.28)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#10245f] via-[#142a76] to-[#294aad] p-6 text-white">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />

              <button
                type="button"
                onClick={() =>
                  setEntryServer(
                    null
                  )
                }
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <X
                  size={17}
                />
              </button>

              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                  <UserRound
                    size={23}
                  />
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-blue-100/60">
                  Before You Enter
                </p>

                <h2 className="mt-1 text-2xl font-extrabold">
                  {lockedWorkspaceUsername
                    ? "Your workspace username"
                    : "Choose your workspace username"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-100/75">
                  {lockedWorkspaceUsername ? (
                    <>
                      Your email is already registered in <span className="font-extrabold text-white">{entryServer.name}</span>.
                    </>
                  ) : (
                    <>
                      This is how members of <span className="font-extrabold text-white">{entryServer.name}</span> will recognize you.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl border border-[#dce5f6] bg-[#eef3ff] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#71809a]">
                  Signed in as
                </p>

                <p className="mt-1 break-all text-sm font-extrabold text-[#182442]">
                  {user?.email}
                </p>
              </div>

              <div>
                <label className="app-label">
                  Username for this workspace
                </label>

                <div className="relative">
                  <AtSign
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
                  />

                  <input
                    value={
                      entryUsername
                    }
                    disabled={
                      checkingWorkspaceUsername ||
                      Boolean(
                        lockedWorkspaceUsername
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      setEntryUsername(
                        normalizeUsername(
                          event.target
                            .value
                        )
                      )
                    }
                    maxLength={20}
                    autoFocus={
                      !lockedWorkspaceUsername
                    }
                    className={`app-input app-input-icon ${
                      lockedWorkspaceUsername
                        ? "cursor-not-allowed bg-[#f1f4f9] text-[#71809a]"
                        : ""
                    }`}
                    placeholder="marl"
                  />
                </div>

                {checkingWorkspaceUsername ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#eef3ff] px-3.5 py-3 text-xs font-extrabold text-[#294aad]">
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />
                    Checking your workspace registration...
                  </div>
                ) : lockedWorkspaceUsername ? (
                  <div className="mt-3 rounded-xl border border-[#d8e2f6] bg-[#eef3ff] p-3.5">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-[#294aad]">
                      Already registered
                    </p>

                    <p className="mt-1.5 text-sm font-bold leading-5 text-[#52617d]">
                      {user?.email} is already registered in this workspace as
                      <span className="font-black text-[#182442]">
                        {" "}@{lockedWorkspaceUsername}
                      </span>.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#71809a]">
                      This workspace username is permanent and cannot be changed. If you want to use a different username in this workspace, you must sign in with a different email address.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-[#8995aa]">
                    Choose carefully. The first username you register in this workspace will be permanently linked to your email and cannot be changed later.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-[#f7f9fd] p-4">
                <p className="text-xs font-extrabold text-[#52617d]">
                  {lockedWorkspaceUsername
                    ? "Permanent workspace username"
                    : "Username rules"}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                  {lockedWorkspaceUsername
                    ? `This email is permanently linked to @${lockedWorkspaceUsername} for ${entryServer?.name || "this workspace"}. To use another username here, use a different email account.`
                    : "One email can have only one username per workspace. Once registered, that workspace username is permanent. You may still use a different username in another workspace."}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  Boolean(
                    enteringServerId
                  ) ||
                  checkingWorkspaceUsername
                }
                onClick={
                  continueIntoWorkspace
                }
                className="app-button-primary flex min-h-12 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enteringServerId ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Entering Workspace...
                  </>
                ) : checkingWorkspaceUsername ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Checking Registration...
                  </>
                ) : lockedWorkspaceUsername ? (
                  "Enter Workspace"
                ) : (
                  "Continue to Workspace"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setEntryServer(
                    null
                  )
                }
                className="min-h-11 w-full rounded-xl bg-[#eef2f8] text-sm font-extrabold text-[#52617d]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog />
    </>
  );
}

export default ServerSelector;
