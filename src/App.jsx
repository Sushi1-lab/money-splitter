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
import Dashboard from "./components/Dashboard.jsx";
import ManageMembers from "./components/ManageMembers.jsx";
import PersonTotals from "./components/PersonTotals.jsx";
import ProfileSetup from "./components/ProfileSetup.jsx";
import ProfileSettings from "./components/ProfileSettings.jsx";
import ServerSelector from "./components/ServerSelector.jsx";
import SplitCalculator from "./components/SplitCalculator.jsx";
import SplitHistory from "./components/SplitHistory.jsx";
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
    page,
    setPage,
  ] = useState(
    "dashboard"
  );

  const {
    Dialog,
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
  // LINK ACCOUNT TO SAVED PERSON
  // =========================================

  const linkLoggedInPerson =
    async (
      people
    ) => {
      if (
        !user?.uid ||
        !user?.email ||
        !activeServer?.id
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

      // UID
      matchingPerson =
        people.find(
          (
            person
          ) =>
            person.linkedUid ===
            currentUid
        );

      // EMAIL
      if (
        !matchingPerson
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
      }

      // USERNAME
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
      }

      // PERSON NAME = USERNAME
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
      }

      // PERSON NAME = DISPLAY NAME
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
      }

      if (
        !matchingPerson
      ) {
        return people;
      }

      if (
        matchingPerson.linkedUid &&
        matchingPerson.linkedUid !==
          currentUid
      ) {
        return people;
      }

      const linkedData =
        {
          linkedUid:
            currentUid,

          linkedEmail:
            currentEmail,

          username:
            profile?.username ||
            "",
        };

      try {
        await updateDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "people",
            matchingPerson.id
          ),
          linkedData
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
          "Person linking error:",
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
          };

        const displayName =
          normalizeName(
            profile?.displayName ||
              user?.displayName ||
              ""
          );

        const username =
          normalizeUsername(
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
      creditorName
    ) => {
      const id =
        getSettlementId(
          debtorKey,
          creditorKey
        );

      const approved =
        await confirm({
          type:
            "info",

          title:
            "Mark as Paid?",

          message:
            `${debtorName} paid ${creditorName} ₱${Number(
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

          confirmText:
            "Mark Paid",
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

            updatedAt:
              serverTimestamp(),
          }
        );

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
  // CHANGE SERVER
  // =========================================

  const changeServer =
    () => {
      setActiveServer(
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
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#eaf0fa]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#cfd9ed] border-t-[#142a76]" />

          <p className="mt-4 text-sm font-bold text-[#8995aa]">
            Loading Money
            Splitter...
          </p>
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
    !profile
  ) {
    return (
      <ProfileSetup
        user={
          user
        }
        onProfileCreated={
          setProfile
        }
      />
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
            setActiveServer
          }
          onRefreshServers={
            fetchServers
          }
          onManageServer={
            setServerToManage
          }
        />

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
            profile={
              profile
            }
            activeServer={
              activeServer
            }
            savedSplits={
              savedSplits
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
            onProfileUpdated={
              setProfile
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d8e0ed] bg-[#f7f9fd]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_30px_rgba(20,42,118,0.08)] backdrop-blur-xl lg:hidden">
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