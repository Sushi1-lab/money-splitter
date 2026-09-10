import {
  AlertTriangle,
  Eye,
  MessageSquareText,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import { useState } from "react";

function TrashPanel({
  settlements = {},
  onRestoreFromTrash,
  onDeleteAllReverted,
  isServerOwner = false,
  paymentLoading,
}) {
  const [proofToView, setProofToView] =
    useState(null);


  const [viewMode, setViewMode] =
    useState("paid");

  const [revertTarget, setRevertTarget] =
    useState(null);

  const [revertNote, setRevertNote] =
    useState("");


  const [deletingReverted, setDeletingReverted] =
    useState(false);

  const getMillis =
    (value) => {
      if (
        value?.toMillis
      ) {
        return value.toMillis();
      }

      if (
        value?.seconds
      ) {
        return (
          value.seconds *
          1000
        );
      }

      return 0;
    };

  const isMutualReduction =
    (item) =>
      [
        "mutual-reduction",
        "mutual-offset",
      ].includes(
        item?.settlementType
      );

  const rawArchived =
    Object.values(
      settlements
    ).filter(
      (item) =>
        Number(
          item?.settledAmount ||
            0
        ) > 0
    );

  const archived =
    (() => {
      const normalItems = [];
      const mutualGroups =
        new Map();

      rawArchived.forEach(
        (item) => {
          if (
            !isMutualReduction(
              item
            )
          ) {
            normalItems.push(
              item
            );
            return;
          }

          const debtorKey =
            String(
              item.debtorKey ||
                item.debtor ||
                ""
            )
              .trim()
              .toLowerCase();

          const creditorKey =
            String(
              item.creditorKey ||
                item.creditor ||
                ""
            )
              .trim()
              .toLowerCase();

          const pairKey =
            [
              debtorKey,
              creditorKey,
            ]
              .sort()
              .join("__");

          const existing =
            mutualGroups.get(
              pairKey
            );

          if (!existing) {
            mutualGroups.set(
              pairKey,
              {
                ...item,
                displayType:
                  "mutual-reduction",
                pairKey,
                relatedIds: [
                  item.id,
                ].filter(Boolean),
                reducedAmount:
                  Number(
                    item.offsetAmount ??
                      item.netPaymentAmount ??
                      item.settledAmount ??
                      0
                  ),
              }
            );
            return;
          }

          existing.relatedIds =
            [
              ...new Set([
                ...(
                  existing.relatedIds ||
                  []
                ),
                item.id,
              ]),
            ].filter(Boolean);

          existing.reducedAmount =
            Math.max(
              Number(
                existing.reducedAmount ||
                  0
              ),
              Number(
                item.offsetAmount ??
                  item.netPaymentAmount ??
                  item.settledAmount ??
                  0
              )
            );

          const existingTime =
            getMillis(
              existing.trashedAt ||
                existing.reducedAt ||
                existing.updatedAt
            );

          const itemTime =
            getMillis(
              item.trashedAt ||
                item.reducedAt ||
                item.updatedAt
            );

          if (
            itemTime >
            existingTime
          ) {
            existing.trashedAt =
              item.trashedAt;
            existing.reducedAt =
              item.reducedAt;
            existing.updatedAt =
              item.updatedAt;
          }
        }
      );

      return [
        ...normalItems,
        ...mutualGroups.values(),
      ].sort(
        (
          a,
          b
        ) =>
          getMillis(
            b.trashedAt ||
              b.reducedAt ||
              b.updatedAt
          ) -
          getMillis(
            a.trashedAt ||
              a.reducedAt ||
              a.updatedAt
          )
      );
    })();

  const reverted =
    (() => {
      const normalItems = [];
      const mutualGroups =
        new Map();

      Object.values(
        settlements
      )
        .filter(
          (item) =>
            item?.status ===
            "reverted"
        )
        .forEach(
          (item) => {
            if (
              !isMutualReduction(
                item
              )
            ) {
              normalItems.push({
                ...item,
                displayType:
                  "reverted-payment",
              });
              return;
            }

            const debtorKey =
              String(
                item.debtorKey ||
                  item.debtor ||
                  ""
              )
                .trim()
                .toLowerCase();

            const creditorKey =
              String(
                item.creditorKey ||
                  item.creditor ||
                  ""
              )
                .trim()
                .toLowerCase();

            const pairKey =
              [
                debtorKey,
                creditorKey,
              ]
                .sort()
                .join("__");

            const existing =
              mutualGroups.get(
                pairKey
              );

            if (!existing) {
              mutualGroups.set(
                pairKey,
                {
                  ...item,
                  displayType:
                    "reverted-reduction",
                  pairKey,
                  revertedAmount:
                    Number(
                      item.revertedReductionAmount ??
                        item.offsetAmount ??
                        item.netPaymentAmount ??
                        item.revertedFromAmount ??
                        0
                    ),
                }
              );
              return;
            }

            existing.revertedAmount =
              Math.max(
                Number(
                  existing.revertedAmount ||
                    0
                ),
                Number(
                  item.revertedReductionAmount ??
                    item.offsetAmount ??
                    item.netPaymentAmount ??
                    item.revertedFromAmount ??
                    0
                )
              );

            const existingTime =
              getMillis(
                existing.revertedAt ||
                  existing.updatedAt
              );

            const itemTime =
              getMillis(
                item.revertedAt ||
                  item.updatedAt
              );

            if (
              itemTime >
              existingTime
            ) {
              existing.revertedAt =
                item.revertedAt;
              existing.updatedAt =
                item.updatedAt;
              existing.revertedNote =
                item.revertedNote;
              existing.revertedByEmail =
                item.revertedByEmail;
            }
          }
        );

      return [
        ...normalItems,
        ...mutualGroups.values(),
      ].sort(
        (
          a,
          b
        ) =>
          getMillis(
            b.revertedAt ||
              b.updatedAt
          ) -
          getMillis(
            a.revertedAt ||
              a.updatedAt
          )
      );
    })();

  const openRevertModal =
    (item) => {
      setRevertTarget(
        item
      );
      setRevertNote(
        ""
      );
    };

  const closeRevertModal =
    () => {
      if (
        paymentLoading
      ) {
        return;
      }

      setRevertTarget(
        null
      );
      setRevertNote(
        ""
      );
    };

  const submitRevert =
    async () => {
      const cleanNote =
        revertNote
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      if (
        cleanNote.length <
        3
      ) {
        return;
      }

      await onRestoreFromTrash?.(
        revertTarget,
        cleanNote
      );

      setRevertTarget(
        null
      );
      setRevertNote(
        ""
      );

      setViewMode(
        "reverted"
      );
    };

  const deleteAllReverted =
    async () => {
      if (
        !isServerOwner ||
        reverted.length ===
          0 ||
        deletingReverted
      ) {
        return;
      }

      try {
        setDeletingReverted(
          true
        );

        await onDeleteAllReverted?.();
      } finally {
        setDeletingReverted(
          false
        );
      }
    };

  const money = (
    value
  ) =>
    Number(
      value || 0
    ).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits:
          2,
        maximumFractionDigits:
          2,
      }
    );

  return (
    <section className="mt-4">
      <div className="app-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[#e3e8f0] p-5 sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffe8e8] text-[#b94343]">
            <Trash2
              size={21}
            />
          </div>

          <div>
            <h2 className="font-extrabold text-[#182442]">
              Paid Expenses
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#8995aa]">
              Paid balances and mutual balance reductions appear here. Mutual reductions are shown once, even though both sides are updated.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#eef2f8] p-1.5">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "paid"
                )
              }
              className={`min-h-11 rounded-xl px-3 text-sm font-extrabold transition ${
                viewMode ===
                "paid"
                  ? "bg-white text-[#142a76] shadow-sm"
                  : "text-[#71809a]"
              }`}
            >
              Paid / Reduced
              <span className="ml-2 rounded-full bg-[#eef3ff] px-2 py-0.5 text-[10px] font-black text-[#294aad]">
                {
                  archived.length
                }
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "reverted"
                )
              }
              className={`min-h-11 rounded-xl px-3 text-sm font-extrabold transition ${
                viewMode ===
                "reverted"
                  ? "bg-white text-[#142a76] shadow-sm"
                  : "text-[#71809a]"
              }`}
            >
              Reverted
              <span className="ml-2 rounded-full bg-[#fff4d9] px-2 py-0.5 text-[10px] font-black text-[#b78114]">
                {
                  reverted.length
                }
              </span>
            </button>
          </div>

          {viewMode ===
            "reverted" &&
            isServerOwner &&
            reverted.length >
              0 && (
              <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#ffd9d9] bg-[#fff7f7] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#a73f3f]">
                    Reverted history controls
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#8e6a6a]">
                    Only the workspace creator can permanently clear all reverted records. Active expenses will not be deleted.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    deleteAllReverted
                  }
                  disabled={
                    deletingReverted
                  }
                  className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c94b4b] px-4 text-xs font-extrabold text-white transition hover:bg-[#b94343] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2
                    size={15}
                  />

                  {deletingReverted
                    ? "Deleting..."
                    : "Delete All Reverted"}
                </button>
              </div>
            )}

          {viewMode ===
          "paid" ? (
          archived.length ===
          0 ? (
            <div className="rounded-2xl bg-[#f7f9fc] p-6 text-center">
              <Trash2
                size={28}
                className="mx-auto text-[#aab4c4]"
              />

              <p className="mt-3 text-sm font-extrabold text-[#71809a]">
                Trash is empty
              </p>

              <p className="mt-1 text-xs text-[#9aa5b6]">
                No paid balances yet. When you mark a balance as paid, it will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archived.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="rounded-2xl border border-[#e2e7ef] bg-[#fafbfe] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${
                          item.displayType ===
                          "mutual-reduction"
                            ? "bg-[#eef3ff] text-[#294aad]"
                            : "bg-[#e7f7ef] text-[#18845c]"
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            item.displayType ===
                            "mutual-reduction"
                              ? "bg-[#294aad]"
                              : "bg-[#18845c]"
                          }`} />

                          {item.displayType ===
                          "mutual-reduction"
                            ? "Balances Reduced"
                            : "Paid"}
                        </div>

                        <p className="font-extrabold text-[#182442]">
                          {
                            item.debtor ||
                            "Someone"
                          }{" "}
                          {item.displayType ===
                          "mutual-reduction"
                            ? "↔"
                            : "→"}{" "}
                          {
                            item.creditor ||
                            "Someone"
                          }
                        </p>

                        <p className="mt-1 text-xs text-[#8995aa]">
                          {item.displayType ===
                          "mutual-reduction"
                            ? "Amount deducted from both balances"
                            : "Paid amount"}
                        </p>

                        <p className="mt-1 text-lg font-black text-[#294aad]">
                          ₱
                          {money(
                            item.displayType ===
                            "mutual-reduction"
                              ? item.reducedAmount
                              : item.settledAmount
                          )}
                        </p>

                        {item.displayType ===
                          "mutual-reduction" && (
                          <p className="mt-2 max-w-xl text-[11px] leading-5 text-[#71809a]">
                            No money was transferred. This amount was simply deducted from what both people owed each other.
                          </p>
                        )}

                        {item.displayType !==
                          "mutual-reduction" &&
                          item.paymentProofUploadedByEmail && (
                          <p className="mt-2 text-[11px] leading-5 text-[#8995aa]">
                            Proof attached by{" "}
                            <span className="font-extrabold text-[#52617d]">
                              {item.paymentProofUploadedByEmail}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2 sm:shrink-0">
                        {item.displayType !==
                          "mutual-reduction" &&
                          item.paymentProofDataUrl && (
                          <button
                            type="button"
                            onClick={() => setProofToView(item)}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#eef3ff] px-4 text-xs font-extrabold text-[#294aad]"
                          >
                            <Eye size={15} />
                            View Payment Proof
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={
                            paymentLoading ===
                            item.id
                          }
                          onClick={() =>
                            openRevertModal(
                              item
                            )
                          }
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#eef2f8] px-4 text-xs font-extrabold text-[#52617d] disabled:opacity-50"
                        >
                          <RotateCcw size={15} />
                          {item.displayType ===
                          "mutual-reduction"
                            ? "Undo Reduction"
                            : "Restore Expense"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )
          ) : (
            reverted.length ===
            0 ? (
              <div className="rounded-2xl bg-[#f7f9fc] p-7 text-center">
                <RotateCcw
                  size={28}
                  className="mx-auto text-[#aab4c4]"
                />

                <p className="mt-3 text-sm font-extrabold text-[#71809a]">
                  No reverted records
                </p>

                <p className="mt-1 text-xs leading-5 text-[#9aa5b6]">
                  When a paid balance or balance reduction is put back as an expense, it will appear here together with the reason.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reverted.map(
                  (item) => (
                    <div
                      key={
                        item.id ||
                        item.pairKey
                      }
                      className="rounded-2xl border border-[#eadfbf] bg-[#fffdf7] p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4d9] px-3 py-1.5 text-[11px] font-extrabold text-[#b78114]">
                            <RotateCcw
                              size={13}
                            />
                            Reverted
                          </div>

                          <p className="mt-3 font-extrabold text-[#182442]">
                            {
                              item.debtor ||
                              "Someone"
                            }{" "}
                            {item.displayType ===
                            "reverted-reduction"
                              ? "↔"
                              : "→"}{" "}
                            {
                              item.creditor ||
                              "Someone"
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#8995aa]">
                            {item.displayType ===
                            "reverted-reduction"
                              ? "Balance reduction was undone"
                              : "Paid balance was returned to expenses"}
                          </p>

                          <p className="mt-1 text-lg font-black text-[#294aad]">
                            ₱
                            {money(
                              item.displayType ===
                              "reverted-reduction"
                                ? item.revertedAmount
                                : item.revertedFromAmount
                            )}
                          </p>

                          <div className="mt-4 rounded-xl border border-[#eee4c9] bg-white p-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#a37b22]">
                              <MessageSquareText
                                size={14}
                              />
                              Reason for reverting
                            </div>

                            <p className="mt-2 text-sm font-semibold leading-6 text-[#52617d]">
                              {item.revertedNote ||
                                "No note provided."}
                            </p>
                          </div>

                          {item.revertedByEmail && (
                            <p className="mt-2 text-[11px] text-[#8995aa]">
                              Reverted by{" "}
                              <span className="font-bold text-[#52617d]">
                                {
                                  item.revertedByEmail
                                }
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#fff4d9] px-3 py-2 text-xs font-extrabold text-[#b78114]">
                          <RotateCcw
                            size={14}
                          />
                          Back as expense
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )
          )}
        </div>
      </div>

      {revertTarget && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-[#071333]/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-[0_30px_90px_rgba(8,24,70,0.30)]">
            <div className="flex items-start gap-3 border-b border-[#e3e8f0] p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff4d9] text-[#b78114]">
                <AlertTriangle
                  size={21}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Revert record
                </p>

                <h3 className="mt-1 text-lg font-black text-[#182442]">
                  {revertTarget.displayType ===
                  "mutual-reduction"
                    ? "Undo Balance Reduction"
                    : "Put Paid Balance Back as Expense"}
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  closeRevertModal
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2f8] text-[#52617d]"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div className="p-5">
              <div className="rounded-2xl bg-[#eef3ff] p-4">
                <p className="text-sm font-extrabold text-[#142a76]">
                  {
                    revertTarget.debtor
                  }{" "}
                  {revertTarget.displayType ===
                  "mutual-reduction"
                    ? "↔"
                    : "→"}{" "}
                  {
                    revertTarget.creditor
                  }
                </p>

                <p className="mt-1 text-xs leading-5 text-[#71809a]">
                  This will make the balance active in expenses again.
                </p>
              </div>

              <label className="mt-5 block text-xs font-black uppercase tracking-[0.1em] text-[#52617d]">
                Why are you reverting this?
              </label>

              <textarea
                value={
                  revertNote
                }
                onChange={(
                  event
                ) =>
                  setRevertNote(
                    event.target
                      .value
                  )
                }
                rows={4}
                maxLength={300}
                placeholder="Example: Marked as paid by mistake, payment was cancelled, wrong person selected..."
                className="mt-2 w-full resize-none rounded-2xl border border-[#dce3ef] bg-[#f8faff] px-4 py-3 text-sm font-semibold text-[#182442] outline-none transition placeholder:text-[#a7b1c1] focus:border-[#8fa7de] focus:ring-4 focus:ring-[#294aad]/10"
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <p className={`text-xs font-bold ${
                  revertNote
                    .trim()
                    .length >=
                  3
                    ? "text-[#18845c]"
                    : "text-[#b94343]"
                }`}>
                  A note is required before reverting.
                </p>

                <span className="text-[10px] font-bold text-[#8995aa]">
                  {
                    revertNote.length
                  }
                  /300
                </span>
              </div>
            </div>

            <div className="grid gap-2 border-t border-[#e3e8f0] p-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  closeRevertModal
                }
                className="min-h-12 rounded-xl bg-[#eef2f8] px-4 text-sm font-extrabold text-[#52617d]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  revertNote
                    .trim()
                    .length <
                    3 ||
                  Boolean(
                    paymentLoading
                  )
                }
                onClick={
                  submitRevert
                }
                className="min-h-12 rounded-xl bg-[#b78114] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {paymentLoading
                  ? "Reverting..."
                  : revertTarget.displayType ===
                      "mutual-reduction"
                    ? "Undo & Save Note"
                    : "Revert & Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {proofToView && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#071333]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-[0_30px_90px_rgba(8,24,70,0.30)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e8f0] p-4 sm:p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#8995aa]">
                  Payment Proof
                </p>
                <p className="mt-1 font-extrabold text-[#182442]">
                  {proofToView.debtor || "Someone"} → {proofToView.creditor || "Someone"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProofToView(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2f8] text-[#52617d]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <img
                src={proofToView.paymentProofDataUrl}
                alt="Payment proof"
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-2xl object-contain"
              />

              {proofToView.paymentProofUploadedByEmail && (
                <p className="mt-4 text-center text-xs text-[#8995aa]">
                  Attached by {proofToView.paymentProofUploadedByEmail}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default TrashPanel;
