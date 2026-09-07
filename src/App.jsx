import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  db,
  auth,
} from "./firebase.js";

import AuthScreen from "./components/AuthScreen.jsx";
import ServerSelector from "./components/ServerSelector.jsx";
import SplitCalculator from "./components/SplitCalculator.jsx";
import SplitHistory from "./components/SplitHistory.jsx";
import PersonTotals from "./components/PersonTotals.jsx";

function App() {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    servers,
    setServers,
  ] = useState([]);

  const [
    activeServer,
    setActiveServer,
  ] = useState(null);

  const [
    savedSplits,
    setSavedSplits,
  ] = useState([]);

  const [
    settlements,
    setSettlements,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    paymentLoading,
    setPaymentLoading,
  ] = useState(null);

  const [
    openSplitId,
    setOpenSplitId,
  ] = useState(null);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    activeMobilePage,
    setActiveMobilePage,
  ] = useState(
    "calculator"
  );

  // ==========================================
  // AUTH
  // ==========================================

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
            setServers([]);
            setActiveServer(
              null
            );
            setSavedSplits(
              []
            );
            setSettlements(
              {}
            );
          }
        }
      );

    return unsubscribe;
  }, []);

  // ==========================================
  // LOAD USER SERVERS
  // ==========================================

  const fetchServers =
    async (
      selectServerId =
        null
    ) => {
      if (!user?.email) {
        return;
      }

      try {
        const email =
          user.email
            .trim()
            .toLowerCase();

        const serversQuery =
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
          );

        const snapshot =
          await getDocs(
            serversQuery
          );

        const serverData =
          snapshot.docs.map(
            (
              serverDoc
            ) => ({
              id:
                serverDoc.id,
              ...serverDoc.data(),
            })
          );

        setServers(
          serverData
        );

        if (
          selectServerId
        ) {
          const selected =
            serverData.find(
              (server) =>
                server.id ===
                selectServerId
            );

          if (selected) {
            setActiveServer(
              selected
            );
          }
        }
      } catch (error) {
        console.error(
          "Server loading error:",
          error
        );
      }
    };

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user]);

  // ==========================================
  // SETTLEMENT ID
  // ==========================================

  const getSettlementId = (
    debtor,
    creditor
  ) => {
    const debtorKey =
      encodeURIComponent(
        debtor
          .trim()
          .toLowerCase()
      );

    const creditorKey =
      encodeURIComponent(
        creditor
          .trim()
          .toLowerCase()
      );

    return `${debtorKey}__${creditorKey}`;
  };

  // ==========================================
  // LOAD SPLITS
  // ==========================================

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
        const splitsQuery =
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
          );

        const snapshot =
          await getDocs(
            splitsQuery
          );

        const data =
          snapshot.docs.map(
            (splitDoc) => ({
              id:
                splitDoc.id,

              ...splitDoc.data(),
            })
          );

        setSavedSplits(
          data
        );
      } catch (error) {
        console.error(
          "Error loading splits:",
          error
        );
      }
    };

  // ==========================================
  // LOAD SETTLEMENTS
  // ==========================================

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

        const data = {};

        snapshot.docs.forEach(
          (
            settlementDoc
          ) => {
            data[
              settlementDoc.id
            ] = {
              id:
                settlementDoc.id,

              ...settlementDoc.data(),
            };
          }
        );

        setSettlements(
          data
        );
      } catch (error) {
        console.error(
          "Settlement loading error:",
          error
        );
      }
    };

  // ==========================================
  // SERVER DATA
  // ==========================================

  useEffect(() => {
    if (
      !activeServer
    ) {
      return;
    }

    const loadData =
      async () => {
        try {
          setLoading(
            true
          );

          await Promise.all([
            fetchSplits(),
            fetchSettlements(),
          ]);
        } finally {
          setLoading(
            false
          );
        }
      };

    loadData();
  }, [activeServer]);

  // ==========================================
  // SAVE SPLIT
  // ==========================================

  const saveSplit =
    async ({
      totalAmount,
      amountPerPerson,
      people,
      addedBy,
      description,
      receiptBase64,
    }) => {
      if (
        !activeServer?.id
      ) {
        return false;
      }

      try {
        setSaving(true);

        await addDoc(
          collection(
            db,
            "servers",
            activeServer.id,
            "splits"
          ),
          {
            totalAmount,
            amountPerPerson,
            people,
            addedBy,
            description,

            receiptBase64:
              receiptBase64 ||
              null,

            createdBy:
              user.email,

            createdAt:
              serverTimestamp(),
          }
        );

        await fetchSplits();

        alert(
          "Split saved successfully!"
        );

        return true;
      } catch (error) {
        console.error(
          "Save error:",
          error
        );

        alert(
          "Unable to save split."
        );

        return false;
      } finally {
        setSaving(false);
      }
    };

  // ==========================================
  // DELETE SPLIT
  // ==========================================

  const deleteSplit =
    async (id) => {
      if (
        !activeServer?.id
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this split?"
        );

      if (!confirmed) {
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
              (split) =>
                split.id !==
                id
            )
        );

        if (
          openSplitId ===
          id
        ) {
          setOpenSplitId(
            null
          );
        }
      } catch (error) {
        console.error(
          "Delete error:",
          error
        );

        alert(
          "Unable to delete split."
        );
      }
    };

  // ==========================================
  // PAID
  // ==========================================

  const markAsPaid =
    async (
      debtor,
      creditor,
      totalDebt
    ) => {
      if (
        !activeServer?.id
      ) {
        return;
      }

      const settlementId =
        getSettlementId(
          debtor,
          creditor
        );

      const confirmed =
        window.confirm(
          `Mark ₱${Number(
            totalDebt
          ).toFixed(
            2
          )} from ${debtor} to ${creditor} as paid?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setPaymentLoading(
          settlementId
        );

        await setDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "settlements",
            settlementId
          ),
          {
            debtor,
            creditor,

            settledAmount:
              Number(
                totalDebt
              ),

            updatedBy:
              user.email,

            updatedAt:
              serverTimestamp(),
          }
        );

        setSettlements(
          (current) => ({
            ...current,

            [settlementId]:
              {
                debtor,
                creditor,

                settledAmount:
                  Number(
                    totalDebt
                  ),
              },
          })
        );
      } catch (error) {
        console.error(
          "Payment error:",
          error
        );

        alert(
          "Unable to mark this payment as paid."
        );
      } finally {
        setPaymentLoading(
          null
        );
      }
    };

  // ==========================================
  // RESTORE
  // ==========================================

  const restorePayment =
    async (
      debtor,
      creditor
    ) => {
      if (
        !activeServer?.id
      ) {
        return;
      }

      const settlementId =
        getSettlementId(
          debtor,
          creditor
        );

      const confirmed =
        window.confirm(
          `Restore the debt from ${debtor} to ${creditor}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setPaymentLoading(
          settlementId
        );

        await deleteDoc(
          doc(
            db,
            "servers",
            activeServer.id,
            "settlements",
            settlementId
          )
        );

        setSettlements(
          (current) => {
            const updated = {
              ...current,
            };

            delete updated[
              settlementId
            ];

            return updated;
          }
        );
      } catch (error) {
        console.error(
          "Restore error:",
          error
        );

        alert(
          "Unable to restore payment."
        );
      } finally {
        setPaymentLoading(
          null
        );
      }
    };

  // ==========================================
  // OTHER HELPERS
  // ==========================================

  const toggleSplit = (
    id
  ) => {
    setOpenSplitId(
      (currentId) =>
        currentId === id
          ? null
          : id
    );
  };

  const formatDate = (
    timestamp
  ) => {
    if (!timestamp) {
      return "Just now";
    }

    if (
      typeof timestamp.toDate !==
      "function"
    ) {
      return "Unknown date";
    }

    return timestamp
      .toDate()
      .toLocaleString(
        "en-PH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute:
            "2-digit",
        }
      );
  };

  const openMobilePage = (
    page
  ) => {
    setActiveMobilePage(
      page
    );

    setMobileMenuOpen(
      false
    );

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  };

  // ==========================================
  // LOADING AUTH
  // ==========================================

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!user) {
    return (
      <AuthScreen />
    );
  }

  // ==========================================
  // SERVER SELECTION
  // ==========================================

  if (!activeServer) {
    return (
      <ServerSelector
        user={user}
        servers={servers}
        activeServer={
          activeServer
        }
        onSelectServer={
          setActiveServer
        }
        onRefreshServers={
          fetchServers
        }
      />
    );
  }

  // ==========================================
  // MAIN APP
  // ==========================================

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />

      {/* MOBILE HEADER */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl lg:hidden">

        <div className="flex items-center justify-between gap-3">

          <div className="min-w-0">

            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-cyan-300">
              {
                activeServer.name
              }
            </p>

            <h1 className="truncate text-lg font-bold">
              Money Splitter
            </h1>

          </div>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (current) =>
                  !current
              )
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-xl"
          >
            {mobileMenuOpen
              ? "✕"
              : "☰"}
          </button>

        </div>

        {mobileMenuOpen && (

          <nav className="mt-3 space-y-1 rounded-2xl border border-white/10 bg-slate-900 p-2">

            <button
              type="button"
              onClick={() =>
                openMobilePage(
                  "calculator"
                )
              }
              className="min-h-12 w-full rounded-xl bg-white/5 px-4 text-left text-sm"
            >
              🧮 Split Calculator
            </button>

            <button
              type="button"
              onClick={() =>
                openMobilePage(
                  "totals"
                )
              }
              className="min-h-12 w-full rounded-xl bg-white/5 px-4 text-left text-sm"
            >
              💸 Person Totals
            </button>

            <button
              type="button"
              onClick={() =>
                openMobilePage(
                  "history"
                )
              }
              className="min-h-12 w-full rounded-xl bg-white/5 px-4 text-left text-sm"
            >
              📁 Split History
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveServer(
                  null
                );

                setMobileMenuOpen(
                  false
                );
              }}
              className="min-h-12 w-full rounded-xl bg-purple-400/10 px-4 text-left text-sm text-purple-300"
            >
              👥 Change Server
            </button>

            <button
              type="button"
              onClick={() =>
                signOut(auth)
              }
              className="min-h-12 w-full rounded-xl bg-red-500/10 px-4 text-left text-sm text-red-300"
            >
              Sign Out
            </button>

          </nav>
        )}

      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-3 py-5 sm:px-5 lg:px-6 lg:py-10">

        {/* DESKTOP HEADER */}

        <div className="mb-8 hidden items-center justify-between gap-4 lg:flex">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              {
                activeServer.name
              }
            </p>

            <h1 className="mt-1 text-4xl font-bold">
              Money Splitter
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {
                activeServer
                  .members
                  ?.length ||
                0
              }{" "}
              server members
            </p>

          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={() =>
                setActiveServer(
                  null
                )
              }
              className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
            >
              Change Server
            </button>

            <button
              type="button"
              onClick={() =>
                signOut(auth)
              }
              className="min-h-11 rounded-xl bg-red-500/10 px-4 text-sm text-red-300"
            >
              Sign Out
            </button>

          </div>

        </div>

        {/* MOBILE */}

        <div className="lg:hidden">

          {activeMobilePage ===
            "calculator" && (
            <SplitCalculator
              onSave={
                saveSplit
              }
              saving={
                saving
              }
            />
          )}

          {activeMobilePage ===
            "totals" && (
            <PersonTotals
              savedSplits={
                savedSplits
              }
              settlements={
                settlements
              }
              onMarkPaid={
                markAsPaid
              }
              onRestorePayment={
                restorePayment
              }
              paymentLoading={
                paymentLoading
              }
              getSettlementId={
                getSettlementId
              }
            />
          )}

          {activeMobilePage ===
            "history" && (
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
              onToggle={
                toggleSplit
              }
              onDelete={
                deleteSplit
              }
              formatDate={
                formatDate
              }
            />
          )}

        </div>

        {/* DESKTOP */}

        <div className="hidden lg:block">

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

            <SplitCalculator
              onSave={
                saveSplit
              }
              saving={
                saving
              }
            />

            <PersonTotals
              savedSplits={
                savedSplits
              }
              settlements={
                settlements
              }
              onMarkPaid={
                markAsPaid
              }
              onRestorePayment={
                restorePayment
              }
              paymentLoading={
                paymentLoading
              }
              getSettlementId={
                getSettlementId
              }
            />

          </div>

          <div className="mt-6">

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
              onToggle={
                toggleSplit
              }
              onDelete={
                deleteSplit
              }
              formatDate={
                formatDate
              }
            />

          </div>

        </div>

      </main>

    </div>
  );
}

export default App;