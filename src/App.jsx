import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase.js";

import SplitCalculator from "./components/SplitCalculator.jsx";
import SplitHistory from "./components/SplitHistory.jsx";
import PersonTotals from "./components/PersonTotals.jsx";

function App() {
  const [savedSplits, setSavedSplits] = useState([]);
  const [settlements, setSettlements] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(null);

  const [openSplitId, setOpenSplitId] = useState(null);

  // MOBILE
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobilePage, setActiveMobilePage] =
    useState("calculator");

  // ============================================
  // CREATE SETTLEMENT ID
  // ============================================

  const getSettlementId = (debtor, creditor) => {
    const debtorKey = encodeURIComponent(
      debtor.trim().toLowerCase()
    );

    const creditorKey = encodeURIComponent(
      creditor.trim().toLowerCase()
    );

    return `${debtorKey}__${creditorKey}`;
  };

  // ============================================
  // LOAD SPLITS
  // ============================================

  const fetchSplits = async () => {
    try {
      const splitsQuery = query(
        collection(db, "splits"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(splitsQuery);

      const data = snapshot.docs.map((splitDoc) => ({
        id: splitDoc.id,
        ...splitDoc.data(),
      }));

      setSavedSplits(data);
    } catch (error) {
      console.error("Error loading splits:", error);
    }
  };

  // ============================================
  // LOAD PAID / SETTLEMENT DATA
  // ============================================

  const fetchSettlements = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, "settlements")
      );

      const data = {};

      snapshot.docs.forEach((settlementDoc) => {
        data[settlementDoc.id] = {
          id: settlementDoc.id,
          ...settlementDoc.data(),
        };
      });

      setSettlements(data);
    } catch (error) {
      console.error(
        "Error loading settlements:",
        error
      );
    }
  };

  // ============================================
  // INITIAL LOAD
  // ============================================

  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchSplits(),
        fetchSettlements(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================
  // SAVE SPLIT
  // ============================================

  const saveSplit = async ({
    totalAmount,
    amountPerPerson,
    people,
    addedBy,
    description,
    receiptBase64,
  }) => {
    try {
      setSaving(true);

      await addDoc(collection(db, "splits"), {
        totalAmount,
        amountPerPerson,
        people,
        addedBy,
        description,
        receiptBase64: receiptBase64 || null,
        createdAt: serverTimestamp(),
      });

      await fetchSplits();

      alert("Split saved successfully!");

      return true;
    } catch (error) {
      console.error("Error saving split:", error);

      alert("Unable to save split.");

      return false;
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // DELETE SPLIT
  // ============================================

  const deleteSplit = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this split?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "splits", id));

      setSavedSplits((currentSplits) =>
        currentSplits.filter(
          (split) => split.id !== id
        )
      );

      if (openSplitId === id) {
        setOpenSplitId(null);
      }
    } catch (error) {
      console.error(
        "Error deleting split:",
        error
      );

      alert("Unable to delete split.");
    }
  };

  // ============================================
  // MARK DEBT AS PAID
  // ============================================

  const markAsPaid = async (
    debtor,
    creditor,
    totalDebt
  ) => {
    const settlementId =
      getSettlementId(debtor, creditor);

    const confirmed = window.confirm(
      `Mark ₱${Number(totalDebt).toFixed(
        2
      )} from ${debtor} to ${creditor} as paid?`
    );

    if (!confirmed) return;

    try {
      setPaymentLoading(settlementId);

      await setDoc(
        doc(
          db,
          "settlements",
          settlementId
        ),
        {
          debtor,
          creditor,

          // This remembers how much historical
          // debt has already been paid.
          settledAmount:
            Number(totalDebt),

          updatedAt:
            serverTimestamp(),
        }
      );

      setSettlements(
        (currentSettlements) => ({
          ...currentSettlements,

          [settlementId]: {
            debtor,
            creditor,
            settledAmount:
              Number(totalDebt),
          },
        })
      );
    } catch (error) {
      console.error(
        "Error marking payment:",
        error
      );

      alert(
        "Unable to mark this payment as paid."
      );
    } finally {
      setPaymentLoading(null);
    }
  };

  // ============================================
  // RESTORE PAYMENT
  // ============================================

  const restorePayment = async (
    debtor,
    creditor
  ) => {
    const settlementId =
      getSettlementId(debtor, creditor);

    const confirmed = window.confirm(
      `Restore the debt from ${debtor} to ${creditor}?`
    );

    if (!confirmed) return;

    try {
      setPaymentLoading(settlementId);

      await deleteDoc(
        doc(
          db,
          "settlements",
          settlementId
        )
      );

      setSettlements(
        (currentSettlements) => {
          const updated = {
            ...currentSettlements,
          };

          delete updated[settlementId];

          return updated;
        }
      );
    } catch (error) {
      console.error(
        "Error restoring payment:",
        error
      );

      alert(
        "Unable to restore this payment."
      );
    } finally {
      setPaymentLoading(null);
    }
  };

  // ============================================
  // OPEN / CLOSE HISTORY
  // ============================================

  const toggleSplit = (id) => {
    setOpenSplitId((currentId) =>
      currentId === id
        ? null
        : id
    );
  };

  // ============================================
  // FORMAT DATE
  // ============================================

  const formatDate = (timestamp) => {
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
          minute: "2-digit",
        }
      );
  };

  // ============================================
  // MOBILE NAVIGATION
  // ============================================

  const openMobilePage = (page) => {
    setActiveMobilePage(page);
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">

      {/* BACKGROUND */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />

      {/* ========================================
          MOBILE HEADER
      ======================================== */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl lg:hidden">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">

          <div className="min-w-0">

            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Expense Manager
            </p>

            <h1 className="truncate text-lg font-bold">
              Money Splitter
            </h1>

          </div>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current
              )
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-xl transition active:scale-95"
            aria-label="Open menu"
          >
            {mobileMenuOpen
              ? "✕"
              : "☰"}
          </button>

        </div>

        {/* MOBILE BURGER */}

        {mobileMenuOpen && (
          <nav className="mx-auto mt-3 max-w-7xl rounded-2xl border border-white/10 bg-slate-900 p-2">

            <button
              type="button"
              onClick={() =>
                openMobilePage(
                  "calculator"
                )
              }
              className={`mb-1 min-h-12 w-full rounded-xl px-4 py-3 text-left text-sm font-medium ${
                activeMobilePage ===
                "calculator"
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-white/5 text-white"
              }`}
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
              className={`mb-1 min-h-12 w-full rounded-xl px-4 py-3 text-left text-sm font-medium ${
                activeMobilePage ===
                "totals"
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-white/5 text-white"
              }`}
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
              className={`min-h-12 w-full rounded-xl px-4 py-3 text-left text-sm font-medium ${
                activeMobilePage ===
                "history"
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-white/5 text-white"
              }`}
            >
              📁 Split History
            </button>

          </nav>
        )}

      </header>

      {/* ========================================
          MAIN
      ======================================== */}

      <main className="relative z-10 mx-auto max-w-7xl px-3 py-5 sm:px-5 sm:py-7 lg:px-6 lg:py-10">

        {/* DESKTOP HEADER */}

        <div className="mb-10 hidden text-center lg:block">

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Expense Manager
          </p>

          <h1 className="text-5xl font-bold">
            Money Splitter
          </h1>

          <p className="mt-3 text-slate-400">
            Split expenses and track who needs to pay whom.
          </p>

        </div>

        {/* ====================================
            MOBILE CONTENT
        ==================================== */}

        <div className="lg:hidden">

          {activeMobilePage ===
            "calculator" && (
            <SplitCalculator
              onSave={saveSplit}
              saving={saving}
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
              loading={loading}
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

        {/* ====================================
            DESKTOP CONTENT
        ==================================== */}

        <div className="hidden lg:block">

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

            <SplitCalculator
              onSave={saveSplit}
              saving={saving}
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
              loading={loading}
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