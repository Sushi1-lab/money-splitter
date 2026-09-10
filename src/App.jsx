import {
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  ArrowLeftRight,
  CircleDollarSign,
  History,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Server,
  Settings,
  ShieldCheck,
  UserCog,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  auth,
  db,
} from "./firebase.js";

import AuthScreen from "./components/AuthScreen.jsx";
import AppChoice from "./components/AppChoice.jsx";
import Budgeter from "./components/Budgeter.jsx";
import FeedbackCenter from "./components/FeedbackCenter.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ManageMembers from "./components/ManageMembers.jsx";
import NotificationCenter from "./components/NotificationCenter.jsx";
import PersonTotals from "./components/PersonTotals.jsx";
import ProfileSetup from "./components/ProfileSetup.jsx";
import ProfileSettings from "./components/ProfileSettings.jsx";
import ServerSelector from "./components/ServerSelector.jsx";
import SplitCalculator from "./components/SplitCalculator.jsx";
import SplitHistory from "./components/SplitHistory.jsx";
import TrashPanel from "./components/TrashPanel.jsx";
import WalletViewer from "./components/WalletViewer.jsx";

import useAppDialog from "./hooks/useAppDialog.jsx";

function App() {
  const [
    user,
    setUser,
  ] = useState(
    null
  );

  const [
    appMode,
    setAppMode,
  ] = useState(
    null
  );

  const [
    profile,
    setProfile,
  ] = useState(
    null
  );

  const [
    authLoading,
    setAuthLoading,
  ] = useState(
    true
  );

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(
    true
  );

  const [
    isSuperAdmin,
    setIsSuperAdmin,
  ] = useState(
    false
  );

  const [
    adminLoading,
    setAdminLoading,
  ] = useState(
    true
  );

  const [
    servers,
    setServers,
  ] = useState(
    []
  );

  const [
    activeServer,
    setActiveServer,
  ] = useState(
    null
  );

  const [
    serverUsername,
    setServerUsername,
  ] = useState(
    ""
  );

  const [
    pendingServer,
    setPendingServer,
  ] = useState(
    null
  );

  const [
    pendingUsername,
    setPendingUsername,
  ] = useState(
    ""
  );

  const [
    usernameConflictMessage,
    setUsernameConflictMessage,
  ] = useState(
    ""
  );

  const [
    usernameChecking,
    setUsernameChecking,
  ] = useState(
    false
  );

  const [
    serverToManage,
    setServerToManage,
  ] = useState(
    null
  );

  const [
    serverPeople,
    setServerPeople,
  ] = useState(
    []
  );

  const [
    savedSplits,
    setSavedSplits,
  ] = useState(
    []
  );

  const [
    settlements,
    setSettlements,
  ] = useState(
    {}
  );

  const [
    walletPerson,
    setWalletPerson,
  ] = useState(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(
    false
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false
  );

  const [
    paymentLoading,
    setPaymentLoading,
  ] = useState(
    null
  );

  const [
    openSplitId,
    setOpenSplitId,
  ] = useState(
    null
  );

  const [
    editingSplit,
    setEditingSplit,
  ] = useState(
    null
  );

  const [
    page,
    setPage,
  ] = useState(
    "dashboard"
  );

  const {
    Dialog,
    success,
    error,
    confirm,
  } = useAppDialog();

  // =========================================
  // NORMALIZERS
  // =========================================

  const normalizeName = (
    name = ""
  ) =>
    String(name)
      .trim()
      .replace(
        /\s+/g,
        " "
      )
      .toLowerCase();

  const normalizeEmail = (
    email = ""
  ) =>
    String(email)
      .trim()
      .toLowerCase();

  const normalizeUsername = (
    username = ""
  ) =>
    String(
      username
    )
      .trim()
      .replace(
        /^@/,
        ""
      )
      .toLowerCase();

  // =========================================
  // AUTH
  // =========================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (
          firebaseUser
        ) => {
          setUser(
            firebaseUser
          );

          setAuthLoading(
            false
          );

          if (
            !firebaseUser
          ) {
            setProfile(
              null
            );

            setAppMode(
              null
            );

            setProfileLoading(
              false
            );

            setIsSuperAdmin(
              false
            );

            setAdminLoading(
              false
            );

            setServers(
              []
            );

            setActiveServer(
              null
            );

            setServerUsername(
              ""
            );

            setPendingServer(
              null
            );

            setPendingUsername(
              ""
            );

            setServerToManage(
              null
            );

            setServerPeople(
              []
            );

            setSavedSplits(
              []
            );

            setSettlements(
              {}
            );

            setWalletPerson(
              null
            );

            setPage(
              "dashboard"
            );
          }
        }
      );

    return unsubscribe;
  }, []);

  // =========================================
  // PROFILE
  // =========================================

  useEffect(() => {
    const loadProfile =
      async () => {
        if (
          !user
        ) {
          return;
        }

        try {
          setProfileLoading(
            true
          );

          const snapshot =
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if (
            snapshot.exists()
          ) {
            setProfile({
              id:
                snapshot.id,

              ...snapshot.data(),
            });
          } else {
            setProfile(
              null
            );
          }
        } catch (err) {
          console.error(
            "Profile loading error:",
            err
          );

          setProfile(
            null
          );
        } finally {
          setProfileLoading(
            false
          );
        }
      };

    loadProfile();
  }, [
    user,
  ]);

  // =========================================
  // ADMIN
  // =========================================

  useEffect(() => {
    const checkAdmin =
      async () => {
        if (
          !user?.email
        ) {
          setIsSuperAdmin(
            false
          );

          setAdminLoading(
            false
          );

          return;
        }

        try {
          setAdminLoading(
            true
          );

          const email =
            normalizeEmail(
              user.email
            );

          const snapshot =
            await getDoc(
              doc(
                db,
                "admins",
                email
              )
            );

          setIsSuperAdmin(
            snapshot.exists() &&
              snapshot.data()
                ?.role ===
                "superadmin"
          );
        } catch (err) {
          console.error(
            "Admin check error:",
            err
          );

          setIsSuperAdmin(
            false
          );
        } finally {
          setAdminLoading(
            false
          );
        }
      };

    checkAdmin();
  }, [
    user,
  ]);

  // =========================================
  // SERVERS
  // =========================================

  const fetchServers =
    async (
      selectServerId =
        null
    ) => {
      if (
        !user?.email
      ) {
        return;
      }

      try {
        const email =
          normalizeEmail(
            user.email
          );

        let snapshot;

        if (
          isSuperAdmin
        ) {
          snapshot =
            await getDocs(
              collection(
                db,
                "servers"
              )
            );
        } else {
          snapshot =
            await getDocs(
              query(
                collection(
                  db,
                  "servers"
                ),
                where(
                  "members",
                  "array-contains",
                  email
                )
              )
            );
        }

        const data =
          snapshot.docs.map(
            (
              item
            ) => ({
              id:
                item.id,

              ...item.data(),
            })
          );

        data.sort(
          (
            a,
            b
          ) =>
            (b.createdAt
              ?.seconds ||
              0) -
            (a.createdAt
              ?.seconds ||
              0)
        );

        setServers(
          data
        );

        if (
          selectServerId
        ) {
          const selected =
            data.find(
              (
                server
              ) =>
                server.id ===
                selectServerId
            );

          if (
            selected
          ) {
            setActiveServer(
              selected
            );
          }
        }

        if (
          activeServer
        ) {
          const refreshed =
            data.find(
              (
                server
              ) =>
                server.id ===
                activeServer.id
            );

          if (
            refreshed
          ) {
            setActiveServer(
              refreshed
            );
          }
        }
      } catch (err) {
        console.error(
          "Server loading error:",
          err
        );
      }
    };

  useEffect(() => {
    if (
      user &&
      profile &&
      !adminLoading
    ) {
      fetchServers();
    }
  }, [
    user,
    profile,
    isSuperAdmin,
    adminLoading,
  ]);

  // =========================================
  // SERVER-SCOPED USERNAME
  // =========================================

  const reserveServerUsername =
    async (
      server,
      requestedUsername
    ) => {
      if (
        !server?.id ||
        !user?.uid ||
        !user?.email
      ) {
        return {
          ok: false,
          message:
            "Unable to verify your workspace username.",
        };
      }

      const cleanUsername =
        normalizeUsername(
          requestedUsername
        );

      const currentEmail =
        normalizeEmail(
          user.email
        );

      if (
        cleanUsername.length <
        3
      ) {
        return {
          ok: false,
          message:
            "Use at least 3 characters for your workspace username.",
        };
      }

      const usernameRef =
        doc(
          db,
          "servers",
          server.id,
          "usernames",
          cleanUsername
        );

      try {
        // FIRST: enforce one permanent username per email in this workspace.
        // If this email already owns a username, that exact username must be reused.
        const usernamesSnapshot =
          await getDocs(
            collection(
              db,
              "servers",
              server.id,
              "usernames"
            )
          );

        const existingEmailRegistration =
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
          existingEmailRegistration
        ) {
          const existingUsername =
            normalizeUsername(
              existingEmailRegistration.data()
                ?.username ||
                existingEmailRegistration.id ||
                ""
            );

          if (
            existingUsername &&
            existingUsername !==
              cleanUsername
          ) {
            return {
              ok: false,
              emailLocked: true,
              lockedUsername:
                existingUsername,
              message:
                `Your email is already permanently registered as @${existingUsername} in this workspace. You cannot switch to another username.`,
            };
          }
        }

        // Migration-safe check:
        // Existing servers may already have usernames stored
        // on people documents before the per-server username
        // reservation collection existed.
        const peopleSnapshot =
          await getDocs(
            collection(
              db,
              "servers",
              server.id,
              "people"
            )
          );

        const existingPersonConflict =
          peopleSnapshot.docs.find(
            (item) => {
              const data =
                item.data();

              const existingUsername =
                normalizeUsername(
                  data?.username ||
                    ""
                );

              const existingEmail =
                normalizeEmail(
                  data?.linkedEmail ||
                    ""
                );

              return (
                existingUsername ===
                  cleanUsername &&
                existingEmail &&
                existingEmail !==
                  currentEmail
              );
            }
          );

        if (
          existingPersonConflict
        ) {
          return {
            ok: false,
            conflict: true,
            message:
              `@${cleanUsername} is already used by another email in this workspace. Choose another username for this workspace.`,
          };
        }

        const snapshot =
          await getDoc(
            usernameRef
          );

        if (
          snapshot.exists()
        ) {
          const data =
            snapshot.data();

          const reservedEmail =
            normalizeEmail(
              data?.email ||
                ""
            );

          // SAME EMAIL = SAME PERSON.
          // Allow the same username even when Firebase UID changed.
          if (
            reservedEmail &&
            reservedEmail ===
              currentEmail
          ) {
            await setDoc(
              usernameRef,
              {
                username:
                  cleanUsername,
                uid:
                  user.uid,
                email:
                  currentEmail,
                displayName:
                  profile?.displayName ||
                  user?.displayName ||
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

            return {
              ok: true,
              username:
                cleanUsername,
            };
          }

          return {
            ok: false,
            conflict: true,
            message:
              `@${cleanUsername} is already used by another email in this workspace. Choose another username for this workspace.`,
          };
        }

        await setDoc(
          usernameRef,
          {
            username:
              cleanUsername,
            uid:
              user.uid,
            email:
              currentEmail,
            displayName:
              profile?.displayName ||
              user?.displayName ||
              "",
            photoURL:
              profile?.photoURL ||
              user?.photoURL ||
              null,
            createdAt:
              serverTimestamp(),
            updatedAt:
              serverTimestamp(),
          }
        );

        return {
          ok: true,
          username:
            cleanUsername,
        };
      } catch (err) {
        console.error(
          "Workspace username check error:",
          err
        );

        return {
          ok: false,
          message:
            err?.code === "permission-denied"
              ? "Firestore blocked the workspace username check. Publish the updated Firestore rules, then try again."
              : "We couldn't verify your username for this workspace. Please try again.",
        };
      }
    };

  const handleSelectServer =
    async (
      server,
      requestedUsername = ""
    ) => {
      const preferredUsername =
        normalizeUsername(
          requestedUsername ||
            profile?.username ||
            ""
        );

      if (
        !preferredUsername
      ) {
        await error(
          "Username Required",
          "Set a username in your profile before entering a workspace."
        );

        return;
      }

      setUsernameChecking(
        true
      );

      const result =
        await reserveServerUsername(
          server,
          preferredUsername
        );

      setUsernameChecking(
        false
      );

      if (
        result.ok
      ) {
        setServerUsername(
          result.username
        );

        setActiveServer(
          server
        );

        return;
      }

      if (
        result.emailLocked
      ) {
        setServerUsername(
          result.lockedUsername ||
            ""
        );

        await error(
          "Workspace Username Locked",
          result.message
        );

        return;
      }

      if (
        result.conflict
      ) {
        setPendingServer(
          server
        );

        setPendingUsername(
          ""
        );

        setUsernameConflictMessage(
          result.message
        );

        return;
      }

      await error(
        "Unable to Enter Workspace",
        result.message
      );
    };

  const confirmWorkspaceUsername =
    async () => {
      if (
        !pendingServer
      ) {
        return;
      }

      const requested =
        normalizeUsername(
          pendingUsername
        );

      setUsernameChecking(
        true
      );

      const result =
        await reserveServerUsername(
          pendingServer,
          requested
        );

      setUsernameChecking(
        false
      );

      if (
        !result.ok
      ) {
        if (
          result.emailLocked
        ) {
          setPendingUsername(
            result.lockedUsername ||
              ""
          );
        }

        setUsernameConflictMessage(
          result.message
        );

        return;
      }

      setServerUsername(
        result.username
      );

      setActiveServer(
        pendingServer
      );

      setPendingServer(
        null
      );

      setPendingUsername(
        ""
      );

      setUsernameConflictMessage(
        ""
      );
    };

  // =========================================
  // LINK ACCOUNT TO SAVED PERSON
  // =========================================

  const linkLoggedInPerson =
    async (
      people
    ) => {
      if (
        !user?.uid ||
        !user?.email ||
        !activeServer?.id ||
        !profile
      ) {
        return people;
      }

      const currentUid =
        user.uid;

      const currentEmail =
        normalizeEmail(
          user.email
        );

      const currentUsername =
        normalizeUsername(
          serverUsername ||
            profile?.username ||
            ""
        );

      const currentDisplayName =
        normalizeName(
          profile?.displayName ||
            user?.displayName ||
            ""
        );

      let matchingPerson =
        null;

      let matchReason =
        "";

      // =====================================
      // 1. ALREADY LINKED TO CURRENT UID
      // =====================================

      matchingPerson =
        people.find(
          (
            person
          ) =>
            person.linkedUid ===
            currentUid
        );

      if (
        matchingPerson
      ) {
        matchReason =
          "uid";
      }

      // =====================================
      // 2. SAME CURRENT EMAIL
      // =====================================

      if (
        !matchingPerson &&
        currentEmail
      ) {
        matchingPerson =
          people.find(
            (
              person
            ) =>
              person.linkedEmail &&
              normalizeEmail(
                person.linkedEmail
              ) ===
                currentEmail
          );

        if (
          matchingPerson
        ) {
          matchReason =
            "email";
        }
      }

      // =====================================
      // 3. SAME CURRENT USERNAME
      // =====================================

      if (
        !matchingPerson &&
        currentUsername
      ) {
        matchingPerson =
          people.find(
            (
              person
            ) =>
              person.username &&
              normalizeUsername(
                person.username
              ) ===
                currentUsername
          );

        if (
          matchingPerson
        ) {
          matchReason =
            "username";
        }
      }

      // =====================================
      // 4. SAVED PERSON NAME = CURRENT USERNAME
      // =====================================

      if (
        !matchingPerson &&
        currentUsername
      ) {
        matchingPerson =
          people.find(
            (
              person
            ) =>
              normalizeName(
                person.name
              ) ===
                normalizeName(
                  currentUsername
                )
          );

        if (
          matchingPerson
        ) {
          matchReason =
            "person-name-to-username";
        }
      }

      // =====================================
      // 5. SAVED PERSON NAME = CURRENT DISPLAY NAME
      // =====================================

      if (
        !matchingPerson &&
        currentDisplayName
      ) {
        matchingPerson =
          people.find(
            (
              person
            ) =>
              normalizeName(
                person.name
              ) ===
                currentDisplayName
          );

        if (
          matchingPerson
        ) {
          matchReason =
            "person-name-to-display-name";
        }
      }

      if (
        !matchingPerson
      ) {
        console.log(
          "No saved person matched the logged-in profile."
        );

        return people;
      }

      const linkedData =
        {
          linkedUid:
            currentUid,

          linkedEmail:
            currentEmail,

          username:
            serverUsername ||
            profile?.username ||
            "",

          photoURL:
            profile?.photoURL ||
            user?.photoURL ||
            null,
        };

      const alreadyCorrect =
        matchingPerson.linkedUid ===
          linkedData.linkedUid &&
        normalizeEmail(
          matchingPerson.linkedEmail ||
            ""
        ) ===
          linkedData.linkedEmail &&
        normalizeUsername(
          matchingPerson.username ||
            ""
        ) ===
          normalizeUsername(
            linkedData.username
          );

      if (
        alreadyCorrect
      ) {
        return people;
      }

      // IMPORTANT:
      // Older versions of Money Splitter may have stored
      // an outdated linkedUid / linkedEmail / username on
      // the saved person. If the saved person's name or
      // username clearly matches the CURRENT logged-in
      // profile, repair those stale fields instead of
      // refusing because an older UID is present.

      const canRepairStaleLink =
        matchReason ===
          "uid" ||
        matchReason ===
          "email" ||
        matchReason ===
          "username" ||
        matchReason ===
          "person-name-to-username" ||
        matchReason ===
          "person-name-to-display-name";

      if (
        !canRepairStaleLink
      ) {
        return people;
      }

      try {
        console.log(
          "Repairing saved person link:",
          {
            person:
              matchingPerson.name,

            matchReason,

            oldLinkedUid:
              matchingPerson.linkedUid ||
              null,

            newLinkedUid:
              currentUid,

            oldLinkedEmail:
              matchingPerson.linkedEmail ||
              null,

            newLinkedEmail:
              currentEmail,

            oldUsername:
              matchingPerson.username ||
              "",

            newUsername:
              serverUsername ||
              profile?.username ||
              "",
          }
        );

        await updateDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "people",
            matchingPerson.id
          ),
          {
            ...linkedData,

            linkedUpdatedAt:
              serverTimestamp(),
          }
        );

        console.log(
          "Saved person link repaired successfully."
        );

        return people.map(
          (
            person
          ) =>
            person.id ===
            matchingPerson.id
              ? {
                  ...person,
                  ...linkedData,
                }
              : person
        );
      } catch (err) {
        console.error(
          "Person linking / repair error:",
          err
        );

        return people;
      }
    };

  // =========================================
  // PEOPLE
  // =========================================

  const fetchServerPeople =
    async () => {
      if (
        !activeServer?.id
      ) {
        setServerPeople(
          []
        );

        return;
      }

      try {
        const snapshot =
          await getDocs(
            collection(
              db,
              "servers",
              activeServer.id,
              "people"
            )
          );

        const raw =
          snapshot.docs.map(
            (
              item
            ) => ({
              id:
                item.id,

              ...item.data(),
            })
          );

        const map =
          new Map();

        raw.forEach(
          (
            person
          ) => {
            const key =
              normalizeName(
                person.name
              );

            if (
              !key
            ) {
              return;
            }

            const existing =
              map.get(
                key
              );

            if (
              !existing
            ) {
              map.set(
                key,
                person
              );

              return;
            }

            if (
              !existing.linkedUid &&
              person.linkedUid
            ) {
              map.set(
                key,
                person
              );

              return;
            }

            if (
              !existing.linkedEmail &&
              person.linkedEmail
            ) {
              map.set(
                key,
                person
              );
            }
          }
        );

        let unique =
          Array.from(
            map.values()
          );

        unique.sort(
          (
            a,
            b
          ) =>
            String(
              a.name ||
                ""
            ).localeCompare(
              String(
                b.name ||
                  ""
              )
            )
        );

        unique =
          await linkLoggedInPerson(
            unique
          );

        // =====================================
        // LOAD GOOGLE / PROFILE PHOTOS
        // =====================================
        //
        // If a saved person is linked to a
        // Firebase user, read users/{uid} and
        // attach that user's photoURL.
        //
        // Google-authenticated users normally
        // have their Google profile image in
        // photoURL. Email/password users can
        // simply fall back to initials.

        unique =
          await Promise.all(
            unique.map(
              async (
                person
              ) => {
                if (
                  !person.linkedUid
                ) {
                  return {
                    ...person,

                    photoURL:
                      person.photoURL ||
                      null,
                  };
                }

                try {
                  const userSnapshot =
                    await getDoc(
                      doc(
                        db,
                        "users",
                        person.linkedUid
                      )
                    );

                  if (
                    !userSnapshot.exists()
                  ) {
                    return {
                      ...person,

                      photoURL:
                        person.photoURL ||
                        null,
                    };
                  }

                  const linkedProfile =
                    userSnapshot.data();

                  return {
                    ...person,

                    photoURL:
                      linkedProfile?.photoURL ||
                      person.photoURL ||
                      null,
                  };
                } catch (err) {
                  console.error(
                    `Unable to load profile photo for ${person.name}:`,
                    err
                  );

                  return {
                    ...person,

                    photoURL:
                      person.photoURL ||
                      null,
                  };
                }
              }
            )
          );

        setServerPeople(
          unique
        );
      } catch (err) {
        console.error(
          "People loading error:",
          err
        );

        setServerPeople(
          []
        );
      }
    };

  // =========================================
  // ADD PERSON
  // =========================================

  const addServerPerson =
    async (
      name
    ) => {
      if (
        !activeServer?.id
      ) {
        return null;
      }

      const cleanName =
        String(
          name
        )
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      if (
        !cleanName
      ) {
        return null;
      }

      const key =
        normalizeName(
          cleanName
        );

      const existing =
        serverPeople.find(
          (
            person
          ) =>
            normalizeName(
              person.name
            ) ===
            key
        );

      if (
        existing
      ) {
        return existing;
      }

      try {
        const reference =
          await addDoc(
            collection(
              db,
              "servers",
              activeServer.id,
              "people"
            ),
            {
              name:
                cleanName,

              normalizedName:
                key,

              linkedUid:
                null,

              linkedEmail:
                null,

              username:
                "",

              photoURL:
                null,

              createdByUid:
                user.uid,

              createdByEmail:
                user.email ||
                "",

              createdAt:
                serverTimestamp(),
            }
          );

        let newPerson =
          {
            id:
              reference.id,

            name:
              cleanName,

            normalizedName:
              key,

            linkedUid:
              null,

            linkedEmail:
              null,

            username:
              "",

            photoURL:
              null,
          };

        const displayName =
          normalizeName(
            profile?.displayName ||
              user?.displayName ||
              ""
          );

        const username =
          normalizeUsername(
            serverUsername ||
              profile?.username ||
              ""
          );

        const isMe =
          key ===
            displayName ||
          (
            username &&
            key ===
              normalizeName(
                username
              )
          );

        if (
          isMe
        ) {
          const linkedData =
            {
              linkedUid:
                user.uid,

              linkedEmail:
                normalizeEmail(
                  user.email
                ),

              username:
                profile?.username ||
                "",

              photoURL:
                profile?.photoURL ||
                user?.photoURL ||
                null,
            };

          await updateDoc(
            doc(
              db,
              "servers",
              activeServer.id,
              "people",
              reference.id
            ),
            linkedData
          );

          newPerson =
            {
              ...newPerson,
              ...linkedData,
            };
        }

        setServerPeople(
          (
            current
          ) =>
            [
              ...current,
              newPerson,
            ].sort(
              (
                a,
                b
              ) =>
                a.name.localeCompare(
                  b.name
                )
            )
        );

        return newPerson;
      } catch (err) {
        console.error(
          "Add person error:",
          err
        );

        await error(
          "Unable to Add Person",
          `${cleanName} couldn't be saved.`
        );

        return null;
      }
    };

  // =========================================
  // DELETE PERSON
  // =========================================

  const deleteServerPerson =
    async (
      person
    ) => {
      const approved =
        await confirm({
          type:
            "danger",

          title:
            `Remove ${person.name}?`,

          message:
            "Their previous expenses will remain in your history.",

          confirmText:
            "Remove Person",
        });

      if (
        !approved
      ) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "people",
            person.id
          )
        );

        setServerPeople(
          (
            current
          ) =>
            current.filter(
              (
                item
              ) =>
                item.id !==
                person.id
            )
        );
      } catch (err) {
        console.error(
          "Delete person error:",
          err
        );

        await error(
          "Unable to Remove Person",
          "Please try again."
        );
      }
    };

  // =========================================
  // SPLITS
  // =========================================

  const fetchSplits =
    async () => {
      if (
        !activeServer?.id
      ) {
        setSavedSplits(
          []
        );

        return;
      }

      try {
        const snapshot =
          await getDocs(
            query(
              collection(
                db,
                "servers",
                activeServer.id,
                "splits"
              ),
              orderBy(
                "createdAt",
                "desc"
              )
            )
          );

        setSavedSplits(
          snapshot.docs.map(
            (
              item
            ) => ({
              id:
                item.id,

              ...item.data(),
            })
          )
        );
      } catch (err) {
        console.error(
          "Split loading error:",
          err
        );
      }
    };

  // =========================================
  // SETTLEMENTS
  // =========================================

  const fetchSettlements =
    async () => {
      if (
        !activeServer?.id
      ) {
        setSettlements(
          {}
        );

        return;
      }

      try {
        const snapshot =
          await getDocs(
            collection(
              db,
              "servers",
              activeServer.id,
              "settlements"
            )
          );

        const data =
          {};

        snapshot.docs.forEach(
          (
            item
          ) => {
            data[
              item.id
            ] = {
              id:
                item.id,

              ...item.data(),
            };
          }
        );

        setSettlements(
          data
        );
      } catch (err) {
        console.error(
          "Settlement loading error:",
          err
        );
      }
    };

  // =========================================
  // LOAD ACTIVE SERVER
  // =========================================

  useEffect(() => {
    if (
      !activeServer?.id
    ) {
      return;
    }

    const load =
      async () => {
        try {
          setLoading(
            true
          );

          await Promise.all([
            fetchServerPeople(),
            fetchSplits(),
            fetchSettlements(),
          ]);
        } finally {
          setLoading(
            false
          );
        }
      };

    load();

    setPage(
      "dashboard"
    );

    setOpenSplitId(
      null
    );

    setWalletPerson(
      null
    );
  }, [
    activeServer?.id,
  ]);

  // =========================================
  // PROFILE CHANGE
  // =========================================

  useEffect(() => {
    if (
      activeServer?.id &&
      profile
    ) {
      fetchServerPeople();
    }
  }, [
    profile?.displayName,
    profile?.username,
  ]);

  // =========================================
  // SAVE SPLIT
  // =========================================

  const saveSplit =
    async (
      data
    ) => {
      if (
        !activeServer?.id
      ) {
        return false;
      }

      try {
        setSaving(
          true
        );

        await addDoc(
          collection(
            db,
            "servers",
            activeServer.id,
            "splits"
          ),
          {
            ...data,

            createdByUid:
              user.uid,

            createdByEmail:
              user.email ||
              "",

            createdByUsername:
              profile?.username ||
              "",

            createdAt:
              serverTimestamp(),
          }
        );

        await fetchSplits();

        await success(
          "Expense Added!",
          "Your expense was saved successfully and the balances were updated."
        );

        return true;
      } catch (err) {
        console.error(
          "Save split error:",
          err
        );

        await error(
          "Unable to Save Expense",
          "Please try again."
        );

        return false;
      } finally {
        setSaving(
          false
        );
      }
    };

  // =========================================
  // UPDATE SPLIT
  // =========================================

  const updateSplit =
    async (
      id,
      data
    ) => {
      if (
        !activeServer?.id ||
        !id
      ) {
        return false;
      }

      try {
        setSaving(
          true
        );

        await updateDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "splits",
            id
          ),
          {
            ...data,

            updatedByUid:
              user.uid,

            updatedByEmail:
              user.email ||
              "",

            updatedByUsername:
              profile?.username ||
              "",

            updatedAt:
              serverTimestamp(),
          }
        );

        await fetchSplits();

        setEditingSplit(
          null
        );

        await success(
          "Expense Updated!",
          "Your changes were saved successfully and the balances were recalculated."
        );

        return true;
      } catch (err) {
        console.error(
          "Update split error:",
          err
        );

        await error(
          "Unable to Update Expense",
          "Please try again."
        );

        return false;
      } finally {
        setSaving(
          false
        );
      }
    };

  // =========================================
  // DELETE SPLIT
  // =========================================

  const deleteSplit =
    async (
      id
    ) => {
      const approved =
        await confirm({
          type:
            "danger",

          title:
            "Delete Expense?",

          message:
            "This expense will be permanently removed.",

          confirmText:
            "Delete Expense",
        });

      if (
        !approved
      ) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "splits",
            id
          )
        );

        setSavedSplits(
          (
            current
          ) =>
            current.filter(
              (
                item
              ) =>
                item.id !==
                id
            )
        );
      } catch (err) {
        console.error(
          "Delete split error:",
          err
        );

        await error(
          "Delete Failed",
          "We couldn't delete this expense."
        );
      }
    };

  // =========================================
  // SETTLEMENT ID
  // =========================================

  const getSettlementId =
    (
      debtor,
      creditor
    ) =>
      `${encodeURIComponent(
        normalizeName(
          debtor
        )
      )}__${encodeURIComponent(
        normalizeName(
          creditor
        )
      )}`;

  // =========================================
  // MARK PAID
  // =========================================

  const markPaid =
    async (
      debtorKey,
      creditorKey,
      amount,
      debtorName,
      creditorName,
      paymentProof = {}
    ) => {
      const id =
        getSettlementId(
          debtorKey,
          creditorKey
        );

      try {
        setPaymentLoading(
          id
        );

        await setDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "settlements",
            id
          ),
          {
            debtorKey:
              normalizeName(
                debtorKey
              ),

            creditorKey:
              normalizeName(
                creditorKey
              ),

            debtor:
              debtorName,

            creditor:
              creditorName,

            settledAmount:
              Number(
                amount
              ),

            updatedByUid:
              user.uid,

            updatedByEmail:
              user.email ||
              "",


            paymentProofDataUrl:
              paymentProof?.paymentProofDataUrl || "",

            paymentProofName:
              paymentProof?.paymentProofName || "",

            paymentProofType:
              paymentProof?.paymentProofType || "",

            paymentProofUploadedByUid:
              user.uid,

            paymentProofUploadedByEmail:
              user.email || "",

            splitIds:
              paymentProof?.splitIds || [],

            splitDetails:
              paymentProof?.splitDetails || [],

            paidAt:
              serverTimestamp(),

            trashedAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        if (
          paymentProof?.creditorUid
        ) {
          try {
            await addDoc(
              collection(
                db,
                "users",
                paymentProof.creditorUid,
                "notifications"
              ),
              {
                type:
                  "payment_received",
                title:
                  "Payment received",
                message:
                  `${debtorName} paid you ₱${Number(
                    amount
                  ).toLocaleString(
                    "en-PH",
                    {
                      minimumFractionDigits:
                        2,
                      maximumFractionDigits:
                        2,
                    }
                  )}.`,
                senderUid:
                  user.uid,
                senderEmail:
                  user.email || "",
                senderName:
                  debtorName,
                recipientUid:
                  paymentProof.creditorUid,
                recipientEmail:
                  paymentProof.creditorEmail || "",
                visibility:
                  "recipient-only",
                recipientName:
                  creditorName,
                serverId:
                  activeServer.id,
                serverName:
                  activeServer.name || "",
                settlementId:
                  id,
                amount:
                  Number(amount) || 0,
                paymentProofDataUrl:
                  paymentProof.paymentProofDataUrl || "",
                splitIds:
                  paymentProof.splitIds || [],
                splitDetails:
                  paymentProof.splitDetails || [],
                read:
                  false,
                createdAt:
                  serverTimestamp(),
              }
            );
          } catch (notificationError) {
            console.error(
              "Payment notification error:",
              notificationError
            );
          }
        }

        await fetchSettlements();
      } catch (err) {
        console.error(
          "Mark paid error:",
          err
        );

        await error(
          "Payment Update Failed",
          "We couldn't update this payment."
        );
      } finally {
        setPaymentLoading(
          null
        );
      }
    };

  // =========================================
  // MARK SIMPLIFIED / NET BALANCE PAID
  // =========================================

  const markNetPaid =
    async ({
      debtorKey,
      creditorKey,
      debtorName,
      creditorName,
      amount,
      forwardRawTotal,
      reverseRawTotal,
      splitIds = [],
      splitDetails = [],
      creditorUid = "",
      creditorEmail = "",
    }) => {
      const forwardId =
        getSettlementId(
          debtorKey,
          creditorKey
        );

      const reverseId =
        getSettlementId(
          creditorKey,
          debtorKey
        );

      try {
        setPaymentLoading(
          forwardId
        );

        const writes = [
          setDoc(
            doc(
              db,
              "servers",
              activeServer.id,
              "settlements",
              forwardId
            ),
            {
              debtorKey:
                normalizeName(
                  debtorKey
                ),

              creditorKey:
                normalizeName(
                  creditorKey
                ),

              debtor:
                debtorName,

              creditor:
                creditorName,

              settledAmount:
                Number(
                  forwardRawTotal
                ) || 0,

              settlementType:
                "netted",

              netPaymentAmount:
                Number(
                  amount
                ) || 0,

              updatedByUid:
                user.uid,

              updatedByEmail:
                user.email ||
                "",

              paymentProofDataUrl,
              paymentProofName,
              paymentProofType,

              paymentProofUploadedByUid:
                user.uid,

              paymentProofUploadedByEmail:
                user.email || "",

              splitIds,
              splitDetails,

              paidAt:
                serverTimestamp(),

              trashedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          ),
        ];

        if (
          Number(
            reverseRawTotal
          ) > 0
        ) {
          writes.push(
            setDoc(
              doc(
                db,
                "servers",
                activeServer.id,
                "settlements",
                reverseId
              ),
              {
                debtorKey:
                  normalizeName(
                    creditorKey
                  ),

                creditorKey:
                  normalizeName(
                    debtorKey
                  ),

                debtor:
                  creditorName,

                creditor:
                  debtorName,

                settledAmount:
                  Number(
                    reverseRawTotal
                  ) || 0,

                settlementType:
                  "netted",

                netPaymentAmount:
                  Number(
                    amount
                  ) || 0,

                updatedByUid:
                  user.uid,

                updatedByEmail:
                  user.email ||
                  "",

                paymentProofDataUrl,
                paymentProofName,
                paymentProofType,

                paymentProofUploadedByUid:
                  user.uid,

                paymentProofUploadedByEmail:
                  user.email || "",

                splitIds,

                paidAt:
                  serverTimestamp(),

                trashedAt:
                  serverTimestamp(),

                updatedAt:
                  serverTimestamp(),
              }
            )
          );
        }

        await Promise.all(
          writes
        );

        if (
          creditorUid
        ) {
          try {
            await addDoc(
              collection(
                db,
                "users",
                creditorUid,
                "notifications"
              ),
              {
                type:
                  "payment_received",
                title:
                  "Payment received",
                message:
                  `${debtorName} paid you ₱${Number(
                    amount
                  ).toLocaleString(
                    "en-PH",
                    {
                      minimumFractionDigits:
                        2,
                      maximumFractionDigits:
                        2,
                    }
                  )}.`,
                senderUid:
                  user.uid,
                senderEmail:
                  user.email || "",
                senderName:
                  debtorName,
                recipientUid:
                  creditorUid,
                recipientEmail:
                  creditorEmail || "",
                visibility:
                  "recipient-only",
                recipientName:
                  creditorName,
                serverId:
                  activeServer.id,
                serverName:
                  activeServer.name || "",
                settlementId:
                  forwardId,
                amount:
                  Number(amount) || 0,
                paymentProofDataUrl,
                splitIds,
                splitDetails,
                read:
                  false,
                createdAt:
                  serverTimestamp(),
              }
            );
          } catch (notificationError) {
            console.error(
              "Payment notification error:",
              notificationError
            );
          }
        }

        await fetchSettlements();
      } catch (err) {
        console.error(
          "Net payment error:",
          err
        );

        await error(
          "Payment Update Failed",
          "We couldn't settle the simplified balance."
        );
      } finally {
        setPaymentLoading(
          null
        );
      }
    };

  // =========================================
  // REDUCE MUTUAL BALANCES
  // =========================================

  const offsetMutualDebt =
    async ({
      debtorKey,
      creditorKey,
      debtorName,
      creditorName,
      amount,
      forwardCurrentSettled = 0,
      reverseCurrentSettled = 0,
      reciprocalOutstanding = 0,
      offsetRemaining = 0,
      paymentProofDataUrl = "",
      paymentProofName = "",
      paymentProofType = "",
      splitIds = [],
      splitDetails = [],
      creditorUid = "",
      creditorEmail = "",
    }) => {
      const offsetAmount =
        Number(amount) || 0;

      if (
        offsetAmount <=
        0
      ) {
        return;
      }

      const forwardId =
        getSettlementId(
          debtorKey,
          creditorKey
        );

      const reverseId =
        getSettlementId(
          creditorKey,
          debtorKey
        );

      try {
        setPaymentLoading(
          forwardId
        );

        const nextForwardSettled =
          Number(
            forwardCurrentSettled
          ) +
          offsetAmount;

        const nextReverseSettled =
          Number(
            reverseCurrentSettled
          ) +
          offsetAmount;

        await Promise.all([
          setDoc(
            doc(
              db,
              "servers",
              activeServer.id,
              "settlements",
              forwardId
            ),
            {
              debtorKey:
                normalizeName(
                  debtorKey
                ),
              creditorKey:
                normalizeName(
                  creditorKey
                ),
              debtor:
                debtorName,
              creditor:
                creditorName,
              settledAmount:
                nextForwardSettled,
              settlementType:
                "mutual-reduction",
              offsetAmount,
              reciprocalBefore:
                Number(
                  reciprocalOutstanding
                ) || 0,
              reciprocalAfter:
                Number(
                  offsetRemaining
                ) || 0,
              updatedByUid:
                user.uid,
              updatedByEmail:
                user.email || "",
              splitIds,
              splitDetails,
              reducedAt:
                serverTimestamp(),
              trashedAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp(),
            },
            {
              merge:
                true,
            }
          ),

          setDoc(
            doc(
              db,
              "servers",
              activeServer.id,
              "settlements",
              reverseId
            ),
            {
              debtorKey:
                normalizeName(
                  creditorKey
                ),
              creditorKey:
                normalizeName(
                  debtorKey
                ),
              debtor:
                creditorName,
              creditor:
                debtorName,
              settledAmount:
                nextReverseSettled,
              settlementType:
                "mutual-reduction",
              offsetAmount,
              reciprocalBefore:
                Number(
                  reciprocalOutstanding
                ) || 0,
              reciprocalAfter:
                Number(
                  offsetRemaining
                ) || 0,
              updatedByUid:
                user.uid,
              updatedByEmail:
                user.email || "",
              splitIds,
              splitDetails,
              reducedAt:
                serverTimestamp(),
              trashedAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp(),
            },
            {
              merge:
                true,
            }
          ),
        ]);

        if (
          creditorUid
        ) {
          try {
            await addDoc(
              collection(
                db,
                "users",
                creditorUid,
                "notifications"
              ),
              {
                type:
                  "mutual_balance_reduction",
                title:
                  "Balances reduced",
                message:
                  `${debtorName} used ₱${offsetAmount.toLocaleString(
                    "en-PH",
                    {
                      minimumFractionDigits:
                        2,
                      maximumFractionDigits:
                        2,
                    }
                  )} of the amount you owe each other to reduce both balances. Your remaining balance to ${debtorName} is ₱${Number(
                    offsetRemaining
                  ).toLocaleString(
                    "en-PH",
                    {
                      minimumFractionDigits:
                        2,
                      maximumFractionDigits:
                        2,
                    }
                  )}. No money was transferred.`,
                senderUid:
                  user.uid,
                senderEmail:
                  user.email || "",
                senderName:
                  debtorName,
                recipientUid:
                  creditorUid,
                recipientEmail:
                  creditorEmail || "",
                visibility:
                  "recipient-only",
                recipientName:
                  creditorName,
                serverId:
                  activeServer.id,
                serverName:
                  activeServer.name || "",
                settlementId:
                  forwardId,
                relatedSettlementId:
                  reverseId,
                amount:
                  offsetAmount,
                remainingMutualDebt:
                  Number(
                    offsetRemaining
                  ) || 0,
                splitIds,
                splitDetails,
                read:
                  false,
                createdAt:
                  serverTimestamp(),
              }
            );
          } catch (
            notificationError
          ) {
            console.error(
              "Offset notification error:",
              notificationError
            );
          }
        }

        await fetchSettlements();
      } catch (err) {
        console.error(
          "Mutual balance reduction error:",
          err
        );

        await error(
          "Balance Reduction Failed",
          "We couldn't reduce the mutual balances."
        );
      } finally {
        setPaymentLoading(
          null
        );
      }
    };

  // =========================================
  // RESTORE PAYMENT
  // =========================================

  const restorePayment =
    async (
      debtor,
      creditor
    ) => {
      const id =
        getSettlementId(
          debtor,
          creditor
        );

      const approved =
        await confirm({
          type:
            "warning",

          title:
            "Restore Balance?",

          message:
            "This payment will become unpaid again.",

          confirmText:
            "Restore Balance",
        });

      if (
        !approved
      ) {
        return;
      }

      try {
        setPaymentLoading(
          id
        );

        await deleteDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "settlements",
            id
          )
        );

        await fetchSettlements();
      } catch (err) {
        console.error(
          "Restore error:",
          err
        );

        await error(
          "Unable to Restore Balance",
          "Please try again."
        );
      } finally {
        setPaymentLoading(
          null
        );
      }
    };

  // =========================================
  // RESTORE FROM TRASH
  // =========================================

  const restoreFromTrash =
    async (
      settlement
    ) => {
      if (
        !settlement?.id
      ) {
        return;
      }

      const restoringMutualReduction =
        [
          "mutual-reduction",
          "mutual-offset",
        ].includes(
          settlement
            .settlementType
        ) ||
        settlement
          .displayType ===
          "mutual-reduction";

      const approved =
        await confirm({
          type:
            "warning",

          title:
            restoringMutualReduction
              ? "Undo Balance Reduction?"
              : "Restore Expense?",

          message:
            restoringMutualReduction
              ? "This will undo the mutual balance reduction and restore both original balances."
              : `This will restore the split balance. ${settlement.debtor || "This person"} will owe ${settlement.creditor || "the other person"} again and the expense will appear in Balances.`,

          confirmText:
            restoringMutualReduction
              ? "Undo Reduction"
              : "Restore Expense",
        });

      if (!approved) {
        return;
      }

      try {
        setPaymentLoading(
          settlement.id
        );

        const isMutualReduction =
          [
            "mutual-reduction",
            "mutual-offset",
          ].includes(
            settlement
              .settlementType
          ) ||
          settlement
            .displayType ===
            "mutual-reduction";

        if (
          isMutualReduction
        ) {
          const idsToDelete =
            settlement.relatedIds?.length
              ? settlement.relatedIds
              : [
                  settlement.id,
                  getSettlementId(
                    settlement.creditorKey ||
                      settlement.creditor,
                    settlement.debtorKey ||
                      settlement.debtor
                  ),
                ].filter(Boolean);

          await Promise.all(
            [
              ...new Set(
                idsToDelete
              ),
            ].map(
              (id) =>
                deleteDoc(
                  doc(
                    db,
                    "servers",
                    activeServer.id,
                    "settlements",
                    id
                  )
                )
            )
          );
        } else {
          await deleteDoc(
            doc(
              db,
              "servers",
              activeServer.id,
              "settlements",
              settlement.id
            )
          );
        }

        await fetchSettlements();

        await success(
          isMutualReduction
            ? "Reduction Undone"
            : "Expense Restored",
          isMutualReduction
            ? "Both original balances are active again."
            : "The paid record was removed from Trash. The original split balance is active again."
        );
      } catch (err) {
        console.error(
          "Trash restore error:",
          err
        );

        await error(
          "Unable to Restore",
          "Please try again."
        );
      } finally {
        setPaymentLoading(
          null
        );
      }
    };

  // =========================================
  // SERVER MANAGEMENT
  // =========================================

  const updateServer =
    (
      updated
    ) => {
      setServers(
        (
          current
        ) =>
          current.map(
            (
              server
            ) =>
              server.id ===
              updated.id
                ? updated
                : server
          )
      );

      if (
        activeServer?.id ===
        updated.id
      ) {
        setActiveServer(
          updated
        );
      }

      setServerToManage(
        updated
      );
    };

  const serverDeleted =
    (
      id
    ) => {
      setServers(
        (
          current
        ) =>
          current.filter(
            (
              server
            ) =>
              server.id !==
              id
          )
      );

      setActiveServer(
        null
      );

      setServerUsername(
        ""
      );

      setServerToManage(
        null
      );

      setServerPeople(
        []
      );

      setSavedSplits(
        []
      );

      setSettlements(
        {}
      );

      setWalletPerson(
        null
      );

      setPage(
        "dashboard"
      );
    };

  // =========================================
  // DATE
  // =========================================

  const formatDate =
    (
      timestamp
    ) => {
      if (
        !timestamp ||
        typeof timestamp.toDate !==
          "function"
      ) {
        return "Just now";
      }

      return timestamp
        .toDate()
        .toLocaleString(
          "en-PH",
          {
            year:
              "numeric",

            month:
              "long",

            day:
              "numeric",

            hour:
              "numeric",

            minute:
              "2-digit",
          }
        );
    };

  // =========================================
  // PAGE
  // =========================================

  const changePage =
    (
      nextPage
    ) => {
      if (
        nextPage !==
        "split"
      ) {
        setEditingSplit(
          null
        );
      }

      setPage(
        nextPage
      );

      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });
    };

  // =========================================
  // SWITCH APP
  // =========================================

  const switchApp =
    () => {
      setAppMode(
        null
      );

      setActiveServer(
        null
      );

      setServerUsername(
        ""
      );

      setPendingServer(
        null
      );

      setPendingUsername(
        ""
      );

      setServerToManage(
        null
      );

      setServerPeople(
        []
      );

      setSavedSplits(
        []
      );

      setSettlements(
        {}
      );

      setWalletPerson(
        null
      );

      setOpenSplitId(
        null
      );

      setEditingSplit(
        null
      );

      setPage(
        "dashboard"
      );

      window.scrollTo({
        top:
          0,
        behavior:
          "smooth",
      });
    };

  // =========================================
  // CHANGE SERVER
  // =========================================

  const changeServer =
    async () => {
      const approved =
        await confirm({
          type:
            "warning",

          title:
            "Leave Workspace?",

          message:
            `Are you sure you want to leave "${activeServer?.name || "this workspace"}"? Your expenses and workspace data will remain saved.`,

          confirmText:
            "Leave Workspace",
        });

      if (
        !approved
      ) {
        return;
      }

      setActiveServer(
        null
      );

      setServerUsername(
        ""
      );

      setServerPeople(
        []
      );

      setSavedSplits(
        []
      );

      setSettlements(
        {}
      );

      setWalletPerson(
        null
      );

      setOpenSplitId(
        null
      );

      setPage(
        "dashboard"
      );
    };

  // =========================================
  // SIGN OUT
  // =========================================

  const handleSignOut =
    async () => {
      const approved =
        await confirm({
          type:
            "info",

          title:
            "Sign Out?",

          message:
            "You can sign back in anytime.",

          confirmText:
            "Sign Out",
        });

      if (
        !approved
      ) {
        return;
      }

      try {
        await signOut(
          auth
        );
      } catch (err) {
        console.error(
          "Sign out error:",
          err
        );

        await error(
          "Unable to Sign Out",
          "Please try again."
        );
      }
    };

  // =========================================
  // LOADING
  // =========================================

  if (
    authLoading ||
    (
      user &&
      (
        profileLoading ||
        adminLoading
      )
    )
  ) {
    const loadingPercent =
      authLoading
        ? 28
        : profileLoading
        ? 68
        : adminLoading
        ? 88
        : 100;

    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-[#eaf0fa] via-[#f8faff] to-[#e4ebff] px-6">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#294aad]/10 blur-2xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#3d63d2]/10 blur-2xl" />

        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-[#10245f] to-[#3d63d2] text-white shadow-[0_18px_45px_rgba(20,42,118,0.25)]">
            <CircleDollarSign
              size={38}
            />
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#182442]">
            Money Splitter
          </h1>

          <p className="mt-2 text-sm font-medium text-[#8995aa]">
            Preparing your workspace...
          </p>

          <div className="mt-7 overflow-hidden rounded-full bg-[#dfe6f2] p-1">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-[#142a76] to-[#3d63d2] transition-all duration-500"
              style={{
                width:
                  `${loadingPercent}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-[#71809a]">
            <span>
              Loading
            </span>

            <span>
              {loadingPercent}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // LOGIN
  // =========================================

  if (
    !user
  ) {
    return (
      <AuthScreen />
    );
  }

  // =========================================
  // PROFILE SETUP
  // =========================================

  if (
    !profile?.username
  ) {
    return (
      <ProfileSetup
        user={
          user
        }
        existingProfile={
          profile
        }
        onProfileCreated={
          setProfile
        }
      />
    );
  }

  // =========================================
  // CHOOSE APP
  // =========================================

  if (
    !appMode
  ) {
    return (
      <>
        <AppChoice
          user={
            user
          }
          profile={
            profile
          }
          onChooseSplitter={() =>
            setAppMode(
              "splitter"
            )
          }
          onChooseBudgeter={() =>
            setAppMode(
              "budgeter"
            )
          }
          onChooseFeedback={() =>
            setAppMode(
              "feedback"
            )
          }
          isSuperAdmin={
            isSuperAdmin
          }
          onSignOut={
            handleSignOut
          }
        />

        <Dialog />
      </>
    );
  }

  // =========================================
  // FEEDBACK CENTER
  // =========================================

  if (
    appMode ===
    "feedback"
  ) {
    return (
      <>
        <FeedbackCenter
          user={
            user
          }
          profile={
            profile
          }
          isSuperAdmin={
            isSuperAdmin
          }
          onBack={
            switchApp
          }
        />

        <Dialog />
      </>
    );
  }

  // =========================================
  // BUDGETER
  // =========================================

  if (
    appMode ===
    "budgeter"
  ) {
    return (
      <>
        <Budgeter
          user={
            user
          }
          profile={
            profile
          }
          onSwitchApp={
            switchApp
          }
          onSignOut={
            handleSignOut
          }
        />

        <Dialog />
      </>
    );
  }

  // =========================================
  // MANAGE SERVER
  // =========================================

  if (
    serverToManage
  ) {
    return (
      <>
        <ManageMembers
          user={
            user
          }
          server={
            serverToManage
          }
          isSuperAdmin={
            isSuperAdmin
          }
          onClose={() =>
            setServerToManage(
              null
            )
          }
          onServerUpdated={
            updateServer
          }
          onServerDeleted={
            serverDeleted
          }
        />

        <Dialog />
      </>
    );
  }

  // =========================================
  // SERVER SELECTOR
  // =========================================

  if (
    !activeServer
  ) {
    return (
      <>
        <ServerSelector
          user={
            user
          }
          profile={
            profile
          }
          servers={
            servers
          }
          isSuperAdmin={
            isSuperAdmin
          }
          onSelectServer={
            handleSelectServer
          }
          onRefreshServers={
            fetchServers
          }
          onManageServer={
            setServerToManage
          }
          onSwitchApp={
            switchApp
          }
        />

        <Dialog />
      </>
    );
  }

  if (
    pendingServer
  ) {
    return (
      <>
        <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#eaf0fa] px-4 py-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#cfdcff]/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#b9c9ff]/55 blur-3xl" />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_70px_rgba(31,53,108,0.15)]">
            <div className="bg-gradient-to-br from-[#10245f] via-[#142a76] to-[#294aad] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100/60">
                Workspace Username
              </p>

              <h2 className="mt-1 text-2xl font-extrabold">
                Choose another username
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100/75">
                Your preferred username is already used by a different email inside {pendingServer.name}.
              </p>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-2xl bg-[#fff3df] px-4 py-3 text-xs font-bold leading-5 text-[#9a6717]">
                {usernameConflictMessage}
              </div>

              <div>
                <label className="app-label">
                  Username for {pendingServer.name}
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-[#8995aa]">
                    @
                  </span>

                  <input
                    value={
                      pendingUsername
                    }
                    onChange={(event) => {
                      setPendingUsername(
                        normalizeUsername(
                          event.target.value
                        )
                      );

                      setUsernameConflictMessage(
                        ""
                      );
                    }}
                    maxLength={20}
                    autoFocus
                    className="app-input pl-8"
                    placeholder="choose_another_name"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-[#8995aa]">
                  This username applies only inside this workspace. Your preferred profile username stays unchanged.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  usernameChecking ||
                  pendingUsername.length < 3
                }
                onClick={
                  confirmWorkspaceUsername
                }
                className="app-button-primary min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {usernameChecking
                  ? "Checking..."
                  : "Use This Username"}
              </button>

              <button
                type="button"
                disabled={
                  usernameChecking
                }
                onClick={() => {
                  setPendingServer(
                    null
                  );

                  setPendingUsername(
                    ""
                  );

                  setUsernameConflictMessage(
                    ""
                  );
                }}
                className="min-h-11 w-full rounded-xl bg-[#eef2f8] text-sm font-extrabold text-[#52617d]"
              >
                Back to Workspaces
              </button>
            </div>
          </div>
        </div>

        <Dialog />
      </>
    );
  }

  const userEmail =
    normalizeEmail(
      user.email
    );

  const ownerEmail =
    normalizeEmail(
      activeServer.ownerEmail
    );

  const canManage =
    userEmail ===
      ownerEmail ||
    isSuperAdmin;

  // =========================================
  // NAV
  //
  // WALLET REMOVED.
  // IT NOW LIVES INSIDE PROFILE.
  // =========================================

  const navItems =
    [
      {
        id:
          "dashboard",

        mobile:
          "Home",

        desktop:
          "Dashboard",

        icon:
          LayoutDashboard,
      },

      {
        id:
          "split",

        mobile:
          "Split",

        desktop:
          "New Expense",

        icon:
          PlusCircle,
      },

      {
        id:
          "balances",

        mobile:
          "Balances",

        desktop:
          "Balances",

        icon:
          WalletCards,
      },

      {
        id:
          "history",

        mobile:
          "History",

        desktop:
          "History",

        icon:
          History,
      },
    ];

  // =========================================
  // RENDER PAGE
  // =========================================

  const renderPage =
    () => {
      if (
        page ===
        "dashboard"
      ) {
        return (
          <Dashboard
            user={
              user
            }
            profile={
              profile
            }
            activeServer={
              activeServer
            }
            savedSplits={
              savedSplits
            }
            serverPeople={
              serverPeople
            }
            onNavigate={
              setPage
            }
          />
        );
      }

      if (
        page ===
        "split"
      ) {
        return (
          <SplitCalculator
            people={
              serverPeople
            }
            onAddPerson={
              addServerPerson
            }
            onDeletePerson={
              deleteServerPerson
            }
            onSave={
              saveSplit
            }
            onUpdate={
              updateSplit
            }
            editingSplit={
              editingSplit
            }
            onCancelEdit={() =>
              setEditingSplit(
                null
              )
            }
            saving={
              saving
            }
          />
        );
      }

      if (
        page ===
        "balances"
      ) {
        return (
          <>
            <PersonTotals
              people={
                serverPeople
              }
              savedSplits={
                savedSplits
              }
              settlements={
                settlements
              }
              onMarkPaid={
                markPaid
              }
              onMarkNetPaid={
                markNetPaid
              }
              onOffsetMutualDebt={
                offsetMutualDebt
              }
              currentUser={
                user
              }
              currentProfile={
                profile
              }
              currentServerUsername={
                serverUsername
              }
              onRestorePayment={
                restorePayment
              }
              onViewWallet={
                setWalletPerson
              }
              paymentLoading={
                paymentLoading
              }
              getSettlementId={
                getSettlementId
              }
            />

            <TrashPanel
              settlements={
                settlements
              }
              onRestoreFromTrash={
                restoreFromTrash
              }
              paymentLoading={
                paymentLoading
              }
            />
          </>
        );
      }

      if (
        page ===
        "history"
      ) {
        return (
          <SplitHistory
            savedSplits={
              savedSplits
            }
            loading={
              loading
            }
            openSplitId={
              openSplitId
            }
            onToggle={(
              id
            ) =>
              setOpenSplitId(
                (
                  current
                ) =>
                  current ===
                  id
                    ? null
                    : id
              )
            }
            onDelete={
              deleteSplit
            }
            onEdit={(split) => {
              setEditingSplit(
                split
              );
              setPage(
                "split"
              );
              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              });
            }}
            formatDate={
              formatDate
            }
          />
        );
      }

      if (
        page ===
        "profile"
      ) {
        return (
          <ProfileSettings
            user={
              user
            }
            profile={
              profile
            }
            activeServer={
              activeServer
            }
            serverUsername={
              serverUsername
            }
            onProfileUpdated={
              setProfile
            }
            onSignOut={
              handleSignOut
            }
          />
        );
      }

      return null;
    };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 bg-[#eaf0fa]">
      {/* =====================================
          DESKTOP SIDEBAR
      ====================================== */}

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] bg-gradient-to-b from-[#10245f] via-[#142a76] to-[#0c1e5b] p-5 text-white lg:flex lg:flex-col">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-white/12">
            <CircleDollarSign
              size={27}
            />
          </div>

          <h1 className="mt-4 text-xl font-extrabold">
            Money Splitter
          </h1>

          <p className="mt-1 text-xs text-blue-100/60">
            Shared expenses
            simplified
          </p>

          {isSuperAdmin && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase">
              <ShieldCheck
                size={13}
              />

              Super Admin
            </div>
          )}
        </div>

        {/* SERVER */}

        <div className="mt-7 rounded-[18px] bg-white/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-blue-100/60">
            Current Server
          </p>

          <p className="mt-1 break-words font-extrabold">
            {
              activeServer.name
            }
          </p>

          <p className="mt-2 text-xs text-blue-100/60">
            {
              serverPeople.length
            }{" "}
            saved people
          </p>
        </div>

        {/* NAV */}

        <nav className="mt-6 space-y-1">
          {navItems.map(
            ({
              id,
              desktop,
              icon:
                Icon,
            }) => (
              <button
                key={
                  id
                }
                type="button"
                onClick={() =>
                  changePage(
                    id
                  )
                }
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-bold transition ${
                  page ===
                  id
                    ? "bg-white text-[#142a76]"
                    : "text-blue-100/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  size={19}
                />

                {
                  desktop
                }
              </button>
            )
          )}
        </nav>

        {/* BOTTOM */}

        <div className="mt-auto space-y-2">
          {canManage && (
            <button
              type="button"
              onClick={() =>
                setServerToManage(
                  activeServer
                )
              }
              className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-white/10 px-4 text-sm font-bold transition hover:bg-white/15"
            >
              <Settings
                size={18}
              />

              Manage Server
            </button>
          )}

          <button
            type="button"
            onClick={
              switchApp
            }
            className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-white/10 px-4 text-sm font-bold transition hover:bg-white/15"
          >
            <ArrowLeftRight
              size={18}
            />

            Switch App
          </button>

          <button
            type="button"
            onClick={
              changeServer
            }
            className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-white/10 px-4 text-sm font-bold transition hover:bg-white/15"
          >
            <Server
              size={18}
            />

            Change Server
          </button>

          {/* PROFILE + WALLET */}

          <button
            type="button"
            onClick={() =>
              changePage(
                "profile"
              )
            }
            className={`flex min-h-[64px] w-full min-w-0 items-center gap-3 rounded-2xl p-3 text-left transition ${
              page ===
              "profile"
                ? "bg-white text-[#142a76]"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {profile.photoURL ? (
              <img
                src={
                  profile.photoURL
                }
                alt=""
                referrerPolicy="no-referrer"
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                <UserRound
                  size={19}
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">
                {profile.displayName ||
                  "Profile"}
              </p>

              <p className="truncate text-[11px] opacity-60">
                Profile & Wallet
              </p>
            </div>

            <UserCog
              size={17}
              className="shrink-0 opacity-70"
            />
          </button>

          <button
            type="button"
            onClick={
              handleSignOut
            }
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-blue-100 transition hover:bg-white/10"
          >
            <LogOut
              size={18}
            />

            Sign Out
          </button>
        </div>
      </aside>

      <NotificationCenter
        user={
          user
        }
        activeServer={
          activeServer
        }
      />

      {/* =====================================
          MOBILE HEADER
      ====================================== */}

      <header className="relative z-30 bg-gradient-to-r from-[#10245f] to-[#294aad] px-4 py-4 text-white lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100/60">
              {
                activeServer.name
              }
            </p>

            <h1 className="truncate text-xl font-extrabold">
              Money Splitter
            </h1>
          </div>

          <div className="flex gap-2">
            {/* PROFILE + WALLET */}

            <button
              type="button"
              title="Profile & Wallet"
              onClick={() =>
                changePage(
                  "profile"
                )
              }
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/15"
            >
              {profile.photoURL ? (
                <img
                  src={
                    profile.photoURL
                  }
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCog
                  size={20}
                />
              )}
            </button>

            <button
              type="button"
              title="Switch app"
              onClick={
                switchApp
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"
            >
              <ArrowLeftRight
                size={20}
              />
            </button>

            <button
              type="button"
              title="Change server"
              onClick={
                changeServer
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"
            >
              <Server
                size={20}
              />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================
          MAIN
      ====================================== */}

      <main className="relative z-10 w-full min-w-0 px-3 py-4 pb-28 sm:px-5 lg:ml-[260px] lg:w-[calc(100%-260px)] lg:px-8 lg:py-8 lg:pb-10">
        <div className="mx-auto w-full min-w-0 max-w-6xl">
          {
            renderPage()
          }
        </div>
      </main>

      {/* =====================================
          MOBILE NAV
          4 ITEMS NOW
      ====================================== */}

      <nav className="fixed bottom-[max(env(safe-area-inset-bottom),12px)] left-3 right-3 z-50 rounded-[24px] border border-white/70 bg-[#f7f9fd]/92 px-2 py-2 shadow-[0_18px_50px_rgba(20,42,118,0.20)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
          {navItems.map(
            ({
              id,
              mobile,
              icon:
                Icon,
            }) => (
              <button
                key={
                  id
                }
                type="button"
                onClick={() =>
                  changePage(
                    id
                  )
                }
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold ${
                  page ===
                  id
                    ? "text-[#142a76]"
                    : "text-[#9ca7b8]"
                }`}
              >
                <div
                  className={`flex h-8 w-10 items-center justify-center rounded-xl ${
                    page ===
                    id
                      ? "bg-[#dfe7ff]"
                      : ""
                  }`}
                >
                  <Icon
                    size={19}
                  />
                </div>

                {
                  mobile
                }
              </button>
            )
          )}
        </div>
      </nav>

      {/* =====================================
          OTHER PERSON'S WALLET
      ====================================== */}

      {walletPerson && (
        <WalletViewer
          person={
            walletPerson
          }
          onClose={() =>
            setWalletPerson(
              null
            )
          }
        />
      )}

      <Dialog />
    </div>
  );
}

export default App;