function PersonTotals({
  savedSplits,
  settlements,
  onMarkPaid,
  onRestorePayment,
  paymentLoading,
  getSettlementId,
}) {
  const debts = {};

  // =========================================================
  // CREATE DEBT LIST
  // =========================================================

  savedSplits.forEach(
    (split) => {
      const people =
        split.people || [];

      const amountPerPerson =
        Number(
          split.amountPerPerson
        ) || 0;

      const addedBy =
        split.addedBy?.trim();

      if (!addedBy) return;

      const creditorKey =
        addedBy.toLowerCase();

      people.forEach(
        (person) => {
          if (
            typeof person !==
            "string"
          ) {
            return;
          }

          const personName =
            person.trim();

          if (!personName) {
            return;
          }

          const personKey =
            personName.toLowerCase();

          if (
            personKey ===
            creditorKey
          ) {
            return;
          }

          if (
            !debts[
              personKey
            ]
          ) {
            debts[
              personKey
            ] = {
              name:
                personName,
              creditors: {},
            };
          }

          if (
            !debts[
              personKey
            ].creditors[
              creditorKey
            ]
          ) {
            debts[
              personKey
            ].creditors[
              creditorKey
            ] = {
              name:
                addedBy,

              amount: 0,

              splitCount:
                0,

              splits: [],
            };
          }

          const creditor =
            debts[
              personKey
            ].creditors[
              creditorKey
            ];

          creditor.amount +=
            amountPerPerson;

          creditor.splitCount +=
            1;

          creditor.splits.push({
            id: split.id,

            description:
              split.description ||
              "Untitled Split",

            amount:
              amountPerPerson,
          });
        }
      );
    }
  );

  // =========================================================
  // APPLY PAYMENTS
  // =========================================================

  const peopleDebts =
    Object.values(debts)
      .map((person) => {
        const creditors =
          Object.values(
            person.creditors
          ).map(
            (creditor) => {
              const settlementId =
                getSettlementId(
                  person.name,
                  creditor.name
                );

              const settlement =
                settlements[
                  settlementId
                ];

              const settledAmount =
                Number(
                  settlement
                    ?.settledAmount
                ) || 0;

              const totalDebt =
                creditor.amount;

              const outstandingAmount =
                Math.max(
                  totalDebt -
                    settledAmount,
                  0
                );

              const isPaid =
                totalDebt > 0 &&
                outstandingAmount <=
                  0.009;

              return {
                ...creditor,

                settlementId,
                settledAmount,
                totalDebt,
                outstandingAmount,
                isPaid,

                hasPreviousPayment:
                  settledAmount > 0,
              };
            }
          );

        const totalOwed =
          creditors.reduce(
            (
              total,
              creditor
            ) =>
              total +
              creditor.outstandingAmount,
            0
          );

        return {
          ...person,
          creditors,
          totalOwed,
        };
      })
      .sort(
        (a, b) =>
          b.totalOwed -
          a.totalOwed
      );

  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-2xl sm:p-5 md:p-7">

      <div className="mb-6">

        <p className="text-sm text-slate-400">
          Current server
        </p>

        <h2 className="text-xl font-bold sm:text-2xl">
          Person Totals
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Track who still needs to pay.
        </p>

      </div>

      {peopleDebts.length ===
      0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">

          <div className="mb-3 text-3xl">
            💸
          </div>

          <p className="text-sm text-slate-500">
            No totals yet.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {peopleDebts.map(
            (person) => (
              <div
                key={person.name}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >

                <div className="flex flex-wrap items-center justify-between gap-3 p-4">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 font-bold text-slate-950">
                      {person.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <p className="truncate font-semibold">
                      {person.name}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-xs text-slate-500">
                      Total to pay
                    </p>

                    <p
                      className={`text-xl font-bold ${
                        person.totalOwed <=
                        0
                          ? "text-emerald-300"
                          : ""
                      }`}
                    >
                      ₱
                      {person.totalOwed.toFixed(
                        2
                      )}
                    </p>

                  </div>

                </div>

                <div className="border-t border-white/10 p-3 sm:p-4">

                  <div className="space-y-3">

                    {person.creditors.map(
                      (
                        creditor
                      ) => {
                        const isLoading =
                          paymentLoading ===
                          creditor.settlementId;

                        return (
                          <div
                            key={
                              creditor.name
                            }
                            className={`rounded-2xl border p-3 sm:p-4 ${
                              creditor.isPaid
                                ? "border-emerald-400/20 bg-emerald-400/[0.05]"
                                : "border-white/5 bg-white/5"
                            }`}
                          >

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                              <div>

                                <div className="flex flex-wrap items-center gap-2">

                                  <p className="text-sm">

                                    <span className="text-slate-400">
                                      Pay{" "}
                                    </span>

                                    <span className="font-semibold text-cyan-300">
                                      {creditor.name}
                                    </span>

                                  </p>

                                  {creditor.isPaid && (
                                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                                      ✓ PAID
                                    </span>
                                  )}

                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {creditor.splitCount}{" "}
                                  {creditor.splitCount === 1
                                    ? "split"
                                    : "splits"}
                                </p>

                              </div>

                              <div className="flex items-center justify-between gap-3 sm:justify-end">

                                <div className="text-right">

                                  <p
                                    className={`font-bold ${
                                      creditor.isPaid
                                        ? "text-emerald-300"
                                        : ""
                                    }`}
                                  >
                                    ₱
                                    {(creditor.isPaid
                                      ? creditor.totalDebt
                                      : creditor.outstandingAmount
                                    ).toFixed(
                                      2
                                    )}
                                  </p>

                                </div>

                                {creditor.isPaid ? (
                                  <button
                                    type="button"
                                    disabled={
                                      isLoading
                                    }
                                    onClick={() =>
                                      onRestorePayment(
                                        person.name,
                                        creditor.name
                                      )
                                    }
                                    className="min-h-11 rounded-xl bg-white/10 px-4 text-xs font-semibold disabled:opacity-50"
                                  >
                                    {isLoading
                                      ? "..."
                                      : "Restore"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={
                                      isLoading
                                    }
                                    onClick={() =>
                                      onMarkPaid(
                                        person.name,
                                        creditor.name,
                                        creditor.totalDebt
                                      )
                                    }
                                    className="min-h-11 rounded-xl bg-emerald-400 px-4 text-xs font-bold text-slate-950 disabled:opacity-50"
                                  >
                                    {isLoading
                                      ? "Saving..."
                                      : "Paid"}
                                  </button>
                                )}

                              </div>

                            </div>

                            <div className="mt-3 border-t border-white/5 pt-3">

                              {creditor.splits.map(
                                (
                                  split,
                                  index
                                ) => (
                                  <div
                                    key={`${split.id}-${index}`}
                                    className="flex justify-between gap-3 py-1 text-xs"
                                  >

                                    <span
                                      className={`min-w-0 flex-1 truncate ${
                                        creditor.isPaid
                                          ? "text-slate-600 line-through"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {split.description}
                                    </span>

                                    <span className="shrink-0 text-slate-300">
                                      ₱
                                      {split.amount.toFixed(
                                        2
                                      )}
                                    </span>

                                  </div>
                                )
                              )}

                            </div>

                            {!creditor.isPaid &&
                              creditor.hasPreviousPayment && (
                                <div className="mt-3 rounded-xl bg-white/[0.04] p-3 text-xs">

                                  <p className="text-slate-400">
                                    Previously paid:{" "}
                                    <span className="text-emerald-300">
                                      ₱
                                      {Math.min(
                                        creditor.settledAmount,
                                        creditor.totalDebt
                                      ).toFixed(
                                        2
                                      )}
                                    </span>
                                  </p>

                                  <p className="mt-1 text-slate-500">
                                    Remaining: ₱
                                    {creditor.outstandingAmount.toFixed(
                                      2
                                    )}
                                  </p>

                                </div>
                              )}

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </section>
  );
}

export default PersonTotals;