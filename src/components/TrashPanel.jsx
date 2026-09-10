import {
  Eye,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import { useState } from "react";

function TrashPanel({
  settlements = {},
  onRestoreFromTrash,
  paymentLoading,
}) {
  const [proofToView, setProofToView] =
    useState(null);

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
          {archived.length ===
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
                            onRestoreFromTrash?.(
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
          )}
        </div>
      </div>

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
