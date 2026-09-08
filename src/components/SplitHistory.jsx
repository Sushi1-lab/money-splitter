import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ReceiptText,
  Trash2,
  UsersRound,
} from "lucide-react";

function SplitHistory({
  savedSplits = [],
  loading,
  openSplitId,
  onToggle,
  onDelete,
  formatDate,
}) {
  return (
    <section className="app-card w-full min-w-0 overflow-hidden">

      <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <ReceiptText
              size={22}
            />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
              Records
            </p>

            <h2 className="text-xl font-extrabold">
              Expense History
            </h2>

          </div>

        </div>

      </div>

      <div className="p-4 sm:p-6">

        {loading ? (
          <p className="text-sm text-[#8995aa]">
            Loading expenses...
          </p>
        ) : savedSplits.length ===
          0 ? (
          <div className="rounded-2xl bg-[#eaf0fa] p-8 text-center">

            <ReceiptText
              size={30}
              className="mx-auto text-[#9da9bb]"
            />

            <p className="mt-3 text-sm text-[#8995aa]">
              No expenses yet.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {savedSplits.map(
              (split) => {
                const open =
                  openSplitId ===
                  split.id;

                const payerName =
  split.payer?.name ||
  split.payer?.displayName ||
  split.addedBy ||
  "Unknown";

const people =
  Array.isArray(
    split.participants
  ) &&
  split.participants.length
    ? split.participants.map(
        (person) =>
          person.name ||
          person.displayName
      )
    : split.people || [];

                return (
                  <div
                    key={
                      split.id
                    }
                    className="overflow-hidden rounded-[20px] border border-[#dce3ef] bg-[#f7f9fd]"
                  >

                    <button
                      type="button"
                      onClick={() =>
                        onToggle(
                          split.id
                        )
                      }
                      className="flex w-full min-w-0 items-center gap-3 p-4 text-left"
                    >

                      <div className="app-icon-box">
                        <ReceiptText
                          size={20}
                        />
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate font-extrabold">
                          {split.description ||
                            "Expense"}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#8995aa]">
                          {split.category ||
                            "Other"}{" "}
                          •{" "}
                          {payerName}
                        </p>

                      </div>

                      <div className="shrink-0 text-right">

                        <p className="font-extrabold text-[#142a76]">
                          ₱
                          {Number(
                            split.totalAmount ||
                              0
                          ).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>

                        {open ? (
                          <ChevronUp
                            size={17}
                            className="ml-auto mt-1 text-[#8995aa]"
                          />
                        ) : (
                          <ChevronDown
                            size={17}
                            className="ml-auto mt-1 text-[#8995aa]"
                          />
                        )}

                      </div>

                    </button>

                    {open && (
                      <div className="border-t border-[#dce3ef] bg-[#edf1f7] p-4">

                        <div className="grid gap-3 sm:grid-cols-2">

                          <div className="rounded-2xl bg-[#f8faff] p-4">

                            <p className="text-xs text-[#8995aa]">
                              Amount per person
                            </p>

                            <p className="mt-1 font-extrabold text-[#142a76]">
                              ₱
                              {Number(
                                split.amountPerPerson ||
                                  0
                              ).toFixed(
                                2
                              )}
                            </p>

                          </div>

                          <div className="rounded-2xl bg-[#f8faff] p-4">

                            <p className="text-xs text-[#8995aa]">
                              Paid by
                            </p>

                            <p className="mt-1 font-extrabold">
                              {
                                payerName
                              }
                            </p>

                          </div>

                        </div>

                        <div className="mt-4">

                          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#8995aa]">

                            <UsersRound
                              size={15}
                            />

                            People

                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">

                            {people.map(
                              (
                                person,
                                index
                              ) => (
                                <span
                                  key={`${person}-${index}`}
                                  className="rounded-full bg-[#e4ebff] px-3 py-2 text-xs font-bold text-[#142a76]"
                                >
                                  {
                                    person
                                  }
                                </span>
                              )
                            )}

                          </div>

                        </div>

                        {split.receiptBase64 && (
                          <div className="mt-4">

                            <img
                              src={
                                split.receiptBase64
                              }
                              alt="Receipt"
                              className="max-h-[500px] w-full rounded-2xl object-contain"
                            />

                          </div>
                        )}

                        <div className="mt-4 flex flex-col gap-3 border-t border-[#d5dde9] pt-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex items-center gap-2 text-xs text-[#8995aa]">

                            <CalendarDays
                              size={15}
                            />

                            {formatDate(
                              split.createdAt
                            )}

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onDelete(
                                split.id
                              )
                            }
                            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ffeded] px-4 text-sm font-bold text-[#cf4646]"
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