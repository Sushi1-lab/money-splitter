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

  const archived = Object.values(
    settlements
  )
    .filter(
      (item) =>
        Number(
          item?.settledAmount ||
            0
        ) > 0
    )
    .sort((a, b) => {
      const getMillis = (
        value
      ) => {
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

      return (
        getMillis(
          b.trashedAt ||
            b.updatedAt
        ) -
        getMillis(
          a.trashedAt ||
            a.updatedAt
        )
      );
    });

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
              Every balance you mark as paid appears here immediately. Restore one to make its original split balance active again.
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
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#e7f7ef] px-3 py-1.5 text-[11px] font-extrabold text-[#18845c]">
                          <span className="h-2 w-2 rounded-full bg-[#18845c]" />
                          Paid
                        </div>

                        <p className="font-extrabold text-[#182442]">
                          {
                            item.debtor ||
                            "Someone"
                          }{" "}
                          →{" "}
                          {
                            item.creditor ||
                            "Someone"
                          }
                        </p>

                        <p className="mt-1 text-xs text-[#8995aa]">
                          Paid amount
                        </p>

                        <p className="mt-1 text-lg font-black text-[#294aad]">
                          ₱
                          {money(
                            item.settledAmount
                          )}
                        </p>

                        {item.paymentProofUploadedByEmail && (
                          <p className="mt-2 text-[11px] leading-5 text-[#8995aa]">
                            Proof attached by{" "}
                            <span className="font-extrabold text-[#52617d]">
                              {item.paymentProofUploadedByEmail}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2 sm:shrink-0">
                        {item.paymentProofDataUrl && (
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
                          Restore Expense
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
