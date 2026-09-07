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
} from "firebase/firestore";

import { db } from "./firebase.js";

import SplitCalculator from "./components/SplitCalculator.jsx";
import SplitHistory from "./components/SplitHistory.jsx";
import PersonTotals from "./components/PersonTotals.jsx";

function App() {
  const [savedSplits, setSavedSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSplitId, setOpenSplitId] = useState(null);

  // ============================================
  // LOAD SPLITS
  // ============================================

  const fetchSplits = async () => {
    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplits();
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
        currentSplits.filter((split) => split.id !== id)
      );

      if (openSplitId === id) {
        setOpenSplitId(null);
      }
    } catch (error) {
      console.error("Error deleting split:", error);

      alert("Unable to delete split.");
    }
  };

  // ============================================
  // OPEN / CLOSE HISTORY
  // ============================================

  const toggleSplit = (id) => {
    setOpenSplitId((currentId) =>
      currentId === id ? null : id
    );
  };

  // ============================================
  // FORMAT DATE
  // ============================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Just now";
    }

    if (typeof timestamp.toDate !== "function") {
      return "Unknown date";
    }

    return timestamp.toDate().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 px-4 py-10 text-white">

      {/* BACKGROUND GLOW */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Expense Manager
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Money Splitter
          </h1>

          <p className="mt-3 text-slate-400">
            Split expenses and track who needs to pay whom.
          </p>
        </div>

        {/* CALCULATOR + TOTALS */}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SplitCalculator
            onSave={saveSplit}
            saving={saving}
          />

          <PersonTotals
            savedSplits={savedSplits}
          />
        </div>

        {/* HISTORY */}

        <div className="mt-6">
          <SplitHistory
            savedSplits={savedSplits}
            loading={loading}
            openSplitId={openSplitId}
            onToggle={toggleSplit}
            onDelete={deleteSplit}
            formatDate={formatDate}
          />
        </div>

      </div>
    </div>
  );
}

export default App;