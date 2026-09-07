function PersonTotals({
  savedSplits,
  settlements,
  onMarkPaid,
  onRestorePayment,
  paymentLoading,
  getSettlementId,
}) {
  const debts = {};

  // ============================================
  // BUILD ALL DEBTS FROM SPLIT HISTORY
  // ============================================

  savedSplits.forEach((split) => {
    const people = split.people || [];

    const amountPerPerson =
      Number(split.amountPerPerson) || 0;

    const addedBy =
      split.addedBy?.trim();

    if (!addedBy) return;

    const creditorKey =
      addedBy.toLowerCase();

    people.forEach((person) => {
      if (typeof person !== "string") {
        return;
      }

      const personName =
        person.trim();

      if (!personName) return;

      const personKey =
        personName.toLowerCase();

      // The person who paid does not owe themselves
      if (
        personKey ===
        creditorKey
      ) {
        return;
      }

      if (!debts[personKey]) {
        debts[personKey] = {
          name: personName,
          creditors: {},
        };
      }

      if (
        !debts[personKey]
          .creditors[
          creditorKey
        ]
      ) {
        debts[
          personKey
        ].creditors[
          creditorKey
        ] = {
          name: addedBy,
          amount: 0,
          splitCount: 0,
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

      creditor.splitCount += 1;

      creditor.splits.push({
        id: split.id,

        description:
          split.description ||
          "Untitled Split",

        amount:
          amountPerPerson,
      });
    });
  });

  // ============================================
  // CALCULATE PAID + OUTSTANDING
  // ============================================

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

              /*
                Historical amount owed.
              */
              const totalDebt =
                creditor.amount;

              /*
                Remaining amount.
                Cannot become negative.
              */
              const outstandingAmount =
                Math.max(
                  totalDebt -
                    settledAmount,
                  0
                );

              /*
                Fully paid only when
                all current debt has
                been settled.
              */
              const isPaid =
                totalDebt > 0 &&
                outstandingAmount <=
                  0.009;

              /*
                If they previously paid,
                but a NEW split was
                later added, this becomes
                true.
              */
              const hasPreviousPayment =
                settledAmount > 0;

              return {
                ...creditor,

                settlementId,
                settledAmount,
                totalDebt,
                outstandingAmount,
                isPaid,
                hasPreviousPayment,
              };
            }
          )
          .sort(
            (a, b) =>
              b.outstandingAmount -
              a.outstandingAmount
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

        const totalHistorical =
          creditors.reduce(
            (
              total,
              creditor
            ) =>
              total +
              creditor.totalDebt,
            0
          );

        const unpaidSplitCount =
          creditors.reduce(
            (
              total,
              creditor
            ) =>
              total +
              (creditor.isPaid
                ? 0
                : creditor
                    .splitCount),
            0
          );

        return {
          ...person,
          creditors,
          totalOwed,
          totalHistorical,
          unpaidSplitCount,
        };
      })
      .sort(
        (a, b) =>
          b.totalOwed -
          a.totalOwed
      );

  // ============================================
  // UI
  // ============================================

  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-2xl sm:p-5 md:p-7">

      {/* HEADER */}

      <div className="mb-6">

        <p className="text-sm text-slate-400">
          Based on all split history
        </p>

        <h2 className="text-xl font-bold sm:text-2xl">
          Person Totals
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          See who needs to pay whom and mark completed payments as paid.
        </p>

      </div>

      {/* EMPTY */}

      {peopleDebts.length ===
      0 ? (

        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">

          <div className="mb-3 text-3xl">
            💸
          </div>

          <p className="text-sm text-slate-500">
            No outstanding totals yet.
          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {peopleDebts.map(
            (person) => (

              <div
                key={
                  person.name
                }
                className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >

                {/* ==========================
                    PERSON HEADER
                ========================== */}

                <div className="flex flex-wrap items-center justify-between gap-3 p-4">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 font-bold text-slate-950">

                      {person.name
                        .charAt(0)
                        .toUpperCase()}

                    </div>

                    <div className="min-w-0">

                      <p className="truncate font-semibold">
                        {person.name}
                      </p>

                      <p className="text-xs text-slate-500">

                        {
                          person.unpaidSplitCount
                        }{" "}

                        {person.unpaidSplitCount ===
                        1
                          ? "split to pay"
                          : "splits to pay"}

                      </p>

                    </div>

                  </div>

                  <div className="ml-auto text-right">

                    <p className="text-xs text-slate-500">
                      Total to pay
                    </p>

                    <p
                      className={`text-xl font-bold ${
                        person.totalOwed <=
                        0
                          ? "text-emerald-300"
                          : "text-white"
                      }`}
                    >
                      ₱
                      {person.totalOwed.toFixed(
                        2
                      )}
                    </p>

                    {person.totalOwed <=
                      0 && (
                      <p className="mt-1 text-xs font-medium text-emerald-300">
                        ✓ Fully Paid
                      </p>
                    )}

                  </div>

                </div>

                {/* ==========================
                    WHO THEY NEED TO PAY
                ========================== */}

                <div className="border-t border-white/10 p-3 sm:p-4">

                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Needs to pay
                  </p>

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
                                ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                                : "border-white/5 bg-white/5"
                            }`}
                          >

                            {/* PAY ROW */}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                              {/* CREDITOR */}

                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <p className="text-sm">

                                    <span className="text-slate-400">
                                      Pay{" "}
                                    </span>

                                    <span className="font-semibold text-cyan-300">
                                      {
                                        creditor.name
                                      }
                                    </span>

                                  </p>

                                  {creditor.isPaid && (
                                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                      ✓ Paid
                                    </span>
                                  )}

                                </div>

                                <p className="mt-1 text-xs text-slate-500">

                                  {
                                    creditor.splitCount
                                  }{" "}

                                  {creditor.splitCount ===
                                  1
                                    ? "split"
                                    : "splits"}

                                </p>

                              </div>

                              {/* AMOUNT + BUTTON */}

                              <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">

                                <div className="text-left sm:text-right">

                                  {creditor.isPaid ? (

                                    <>
                                      <p className="font-bold text-emerald-300">
                                        ₱
                                        {creditor.totalDebt.toFixed(
                                          2
                                        )}
                                      </p>

                                      <p className="text-[10px] uppercase tracking-wide text-emerald-400/70">
                                        Paid
                                      </p>
                                    </>

                                  ) : (

                                    <>
                                      <p className="font-bold">
                                        ₱
                                        {creditor.outstandingAmount.toFixed(
                                          2
                                        )}
                                      </p>

                                      {creditor.hasPreviousPayment && (
                                        <p className="text-[10px] text-slate-500">
                                          of ₱
                                          {creditor.totalDebt.toFixed(
                                            2
                                          )}
                                        </p>
                                      )}
                                    </>

                                  )}

                                </div>

                                {/* PAID / RESTORE */}

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
                                    className="min-h-11 rounded-xl border border-white/10 bg-white/10 px-4 text-xs font-semibold text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isLoading
                                      ? "..."
                                      : "Restore"}
                                  </button>

                                ) : (

                                  <button
                                    type="button"
                                    disabled={
                                      isLoading ||
                                      creditor.outstandingAmount <=
                                        0
                                    }
                                    onClick={() =>
                                      onMarkPaid(
                                        person.name,
                                        creditor.name,
                                        creditor.totalDebt
                                      )
                                    }
                                    className="min-h-11 rounded-xl bg-emerald-400 px-4 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isLoading
                                      ? "Saving..."
                                      : "Paid"}
                                  </button>

                                )}

                              </div>

                            </div>

                            {/* ======================
                                SPLIT BREAKDOWN
                            ====================== */}

                            <div className="mt-3 border-t border-white/5 pt-3">

                              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                                Split breakdown
                              </p>

                              <div className="space-y-1">

                                {creditor.splits.map(
                                  (
                                    split,
                                    index
                                  ) => (

                                    <div
                                      key={`${split.id}-${index}`}
                                      className="flex min-w-0 items-center justify-between gap-3 py-1 text-xs"
                                    >

                                      <span
                                        className={`min-w-0 flex-1 truncate ${
                                          creditor.isPaid
                                            ? "text-slate-600 line-through"
                                            : "text-slate-500"
                                        }`}
                                      >
                                        {
                                          split.description
                                        }
                                      </span>

                                      <span
                                        className={`shrink-0 ${
                                          creditor.isPaid
                                            ? "text-emerald-400/60"
                                            : "text-slate-300"
                                        }`}
                                      >
                                        ₱
                                        {split.amount.toFixed(
                                          2
                                        )}
                                      </span>

                                    </div>

                                  )
                                )}

                              </div>

                            </div>

                            {/* PAYMENT INFO */}

                            {creditor.isPaid && (
                              <div className="mt-3 rounded-xl bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300">

                                ✓ {person.name} has paid{" "}
                                {creditor.name} ₱
                                {creditor.totalDebt.toFixed(
                                  2
                                )}

                              </div>
                            )}

                            {/* PREVIOUSLY PAID BUT NEW DEBT */}

                            {!creditor.isPaid &&
                              creditor.hasPreviousPayment && (
                                <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2">

                                  <p className="text-xs text-slate-400">

                                    Previously paid:{" "}

                                    <span className="font-medium text-emerald-300">
                                      ₱
                                      {Math.min(
                                        creditor.settledAmount,
                                        creditor.totalDebt
                                      ).toFixed(
                                        2
                                      )}
                                    </span>

                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    New unpaid amount: ₱
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