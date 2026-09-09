import {
  Bus,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Edit3,
  HeartPulse,
  House,
  Plane,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Utensils,
} from "lucide-react";

const categoryIcons = {
  Food: Utensils,
  Groceries: ShoppingCart,
  Transport: Bus,
  Shopping: ShoppingBag,
  Bills: House,
  Travel: Plane,
  Entertainment: Clapperboard,
  Health: HeartPulse,
  Other: CircleDollarSign,
};

function SplitHistory({
  savedSplits = [],
  loading = false,
  openSplitId,
  onToggle,
  onDelete,
  onEdit,
  formatDate,
}) {
  const money = (value) =>
    Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  if (loading) {
    return (
      <section className="app-card p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#d7deeb] border-t-[#142a76]" />
        <p className="mt-3 text-sm font-bold text-[#8995aa]">
          Loading history...
        </p>
      </section>
    );
  }

  return (
    <section className="app-card overflow-hidden">
      <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <ReceiptText
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
              History
            </p>

            <h2 className="text-xl font-extrabold">
              Expense History
            </h2>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {savedSplits.length ===
        0 ? (
          <div className="rounded-2xl bg-[#eef2f8] p-8 text-center text-sm font-bold text-[#8995aa]">
            No expenses yet.
          </div>
        ) : (
          <div className="space-y-3">
            {savedSplits.map(
              (split) => {
                const category =
                  split.category ||
                  "Other";

                const CategoryIcon =
                  categoryIcons[
                    category
                  ] ||
                  CircleDollarSign;

                const expanded =
                  openSplitId ===
                  split.id;

                const participants =
                  Array.isArray(
                    split.participants
                  )
                    ? split.participants
                    : (
                        split.people ||
                        []
                      ).map(
                        (name) => ({
                          name,
                        })
                      );

                return (
                  <div
                    key={
                      split.id
                    }
                    className="overflow-hidden rounded-[20px] border border-[#dce3ef] bg-white"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onToggle?.(
                          split.id
                        )
                      }
                      className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-[#f8faff] sm:p-5"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#294aad]">
                        <CategoryIcon
                          size={20}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-[#182442]">
                          {
                            category
                          }
                        </p>

                        <p className="mt-0.5 truncate text-xs text-[#8995aa]">
                          {split.description ||
                            "Shared expense"}
                        </p>

                        <p className="mt-1 text-[11px] text-[#a0aabd]">
                          {formatDate?.(
                            split.createdAt
                          ) ||
                            "Just now"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-extrabold text-[#142a76]">
                          ₱
                          {money(
                            split.totalAmount
                          )}
                        </p>

                        <div className="mt-1 flex justify-end text-[#8995aa]">
                          {expanded ? (
                            <ChevronDown
                              size={17}
                            />
                          ) : (
                            <ChevronRight
                              size={17}
                            />
                          )}
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-[#e3e8f0] p-4 sm:p-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-[#f7f9fd] p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8995aa]">
                              Covered By
                            </p>

                            <p className="mt-1 font-extrabold text-[#182442]">
                              {split.payer
                                ?.name ||
                                split.addedBy ||
                                "Unknown"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#f7f9fd] p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8995aa]">
                              Split Method
                            </p>

                            <p className="mt-1 font-extrabold capitalize text-[#182442]">
                              {split.splitMode ===
                              "percentage"
                                ? "Percentage"
                                : "Equal"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#71809a]">
                            Participants
                          </p>

                          <div className="mt-2 space-y-2">
                            {participants.map(
                              (
                                person,
                                index
                              ) => (
                                <div
                                  key={`${person.name}-${index}`}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-[#f8faff] px-3 py-2"
                                >
                                  <span className="font-bold text-[#52617d]">
                                    {
                                      person.name
                                    }
                                  </span>

                                  <span className="text-xs font-extrabold text-[#294aad]">
                                    {Number.isFinite(
                                      Number(
                                        person.percentage
                                      )
                                    ) &&
                                      `${Number(
                                        person.percentage
                                      ).toFixed(
                                        2
                                      )}% · `}
                                    ₱
                                    {money(
                                      person.amount ??
                                        split.amountPerPerson
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {split.receiptBase64 && (
                          <img
                            src={
                              split.receiptBase64
                            }
                            alt="Receipt"
                            className="mt-4 max-h-72 w-full rounded-2xl border border-[#e3e8f0] object-contain"
                          />
                        )}

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              onEdit?.(
                                split
                              )
                            }
                            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#eef3ff] text-sm font-extrabold text-[#294aad]"
                          >
                            <Edit3
                              size={16}
                            />
                            Edit Expense
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onDelete?.(
                                split.id
                              )
                            }
                            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#ffeded] text-sm font-extrabold text-[#c85353]"
                          >
                            <Trash2
                              size={16}
                            />
                            Delete
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
      </div>
    </section>
  );
}

export default SplitHistory;
