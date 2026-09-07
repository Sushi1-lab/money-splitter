function SplitHistory({
  savedSplits,
  loading,
  openSplitId,
  onToggle,
  onDelete,
  formatDate,
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-2xl sm:p-5 md:p-7">

      {/* HEADER */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

        <div>

          <p className="text-sm text-slate-400">
            Firestore
          </p>

          <h2 className="text-xl font-bold sm:text-2xl">
            Split History
          </h2>

        </div>

        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
          {savedSplits.length}
        </span>

      </div>

      {/* CONTENT */}

      {loading ? (

        <div className="p-8 text-center text-slate-400">
          Loading...
        </div>

      ) : savedSplits.length ===
        0 ? (

        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">

          <div className="mb-3 text-3xl">
            📁
          </div>

          <p className="text-slate-500">
            No saved splits yet.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {savedSplits.map(
            (split) => {
              const isOpen =
                openSplitId ===
                split.id;

              return (
                <div
                  key={
                    split.id
                  }
                  className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                >

                  {/* FOLDER */}

                  <div className="flex min-w-0 items-center gap-3 p-3 sm:px-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">

                      {isOpen
                        ? "📂"
                        : "📁"}

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate font-semibold">

                        {split.description ||
                          "Untitled Split"}

                      </p>

                      <p className="truncate text-xs text-slate-500">

                        ₱
                        {Number(
                          split.totalAmount ||
                            0
                        ).toFixed(
                          2
                        )}

                        {" • "}

                        Added by{" "}

                        {split.addedBy ||
                          "Unknown"}

                      </p>

                    </div>

                    <div className="hidden shrink-0 text-xs text-slate-400 sm:block">

                      {split.people
                        ?.length ||
                        0}{" "}

                      {split.people
                        ?.length ===
                      1
                        ? "person"
                        : "people"}

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onToggle(
                          split.id
                        )
                      }
                      className="min-h-11 shrink-0 rounded-xl bg-white/10 px-3 text-xs font-semibold sm:px-4"
                    >
                      {isOpen
                        ? "Close"
                        : "View"}
                    </button>

                  </div>

                  {/* DETAILS */}

                  {isOpen && (
                    <div className="border-t border-white/10 p-4 sm:p-5">

                      {/* PURPOSE */}

                      <div className="mb-5">

                        <p className="text-xs text-slate-500">
                          Purpose
                        </p>

                        <p className="mt-1 break-words text-base font-semibold sm:text-lg">

                          {split.description ||
                            "No description"}

                        </p>

                      </div>

                      {/* SUMMARY */}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                        <div className="rounded-xl bg-white/5 p-3">

                          <p className="text-xs text-slate-500">
                            Total
                          </p>

                          <p className="mt-1 break-words font-semibold">

                            ₱
                            {Number(
                              split.totalAmount ||
                                0
                            ).toFixed(
                              2
                            )}

                          </p>

                        </div>

                        <div className="rounded-xl bg-white/5 p-3">

                          <p className="text-xs text-slate-500">
                            Each Person
                          </p>

                          <p className="mt-1 break-words font-semibold">

                            ₱
                            {Number(
                              split.amountPerPerson ||
                                0
                            ).toFixed(
                              2
                            )}

                          </p>

                        </div>

                      </div>

                      {/* PEOPLE */}

                      <div className="mt-5">

                        <p className="mb-2 text-xs text-slate-400">
                          People Included
                        </p>

                        <div className="flex flex-wrap gap-2">

                          {split.people?.map(
                            (
                              person,
                              index
                            ) => (

                              <span
                                key={`${person}-${index}`}
                                className="max-w-full truncate rounded-full bg-white/10 px-3 py-2 text-xs"
                              >
                                {
                                  person
                                }
                              </span>

                            )
                          )}

                        </div>

                      </div>

                      {/* RECEIPT */}

                      {split.receiptBase64 && (
                        <div className="mt-5">

                          <p className="mb-2 text-xs text-slate-400">
                            Receipt
                          </p>

                          <img
                            src={
                              split.receiptBase64
                            }
                            alt="Receipt"
                            className="max-h-96 w-full rounded-2xl border border-white/10 bg-black/20 object-contain"
                          />

                        </div>
                      )}

                      {/* INFORMATION */}

                      <div className="mt-5 border-t border-white/10 pt-4">

                        <p className="text-xs text-slate-500">
                          Added By
                        </p>

                        <p className="mt-1 break-words text-sm font-medium">

                          {split.addedBy ||
                            "Unknown"}

                        </p>

                        <p className="mt-4 text-xs text-slate-500">
                          Created
                        </p>

                        <p className="mt-1 break-words text-sm text-slate-300">

                          {formatDate(
                            split.createdAt
                          )}

                        </p>

                      </div>

                      {/* DELETE */}

                      <div className="mt-5">

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(
                              split.id
                            )
                          }
                          className="min-h-11 w-full rounded-xl bg-red-500/10 px-4 text-xs font-semibold text-red-300 sm:w-auto"
                        >
                          Delete Split
                        </button>

                      </div>

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>
      )}

    </section>
  );
}

export default SplitHistory;