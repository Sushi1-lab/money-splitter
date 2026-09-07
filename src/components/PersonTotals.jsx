function PersonTotals({ savedSplits }) {
  const debts = {};

  // ============================================
  // BUILD DEBT TOTALS
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

      // Person does not owe themselves
      if (personKey === creditorKey) {
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
          .creditors[creditorKey]
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

      debts[
        personKey
      ].creditors[
        creditorKey
      ].amount +=
        amountPerPerson;

      debts[
        personKey
      ].creditors[
        creditorKey
      ].splitCount += 1;

      debts[
        personKey
      ].creditors[
        creditorKey
      ].splits.push({
        description:
          split.description ||
          "Untitled Split",

        amount:
          amountPerPerson,
      });
    });
  });

  // ============================================
  // CONVERT TO ARRAY
  // ============================================

  const peopleDebts =
    Object.values(debts)
      .map((person) => {
        const creditors =
          Object.values(
            person.creditors
          ).sort(
            (a, b) =>
              b.amount - a.amount
          );

        const totalOwed =
          creditors.reduce(
            (total, creditor) =>
              total +
              creditor.amount,
            0
          );

        const totalSplits =
          creditors.reduce(
            (total, creditor) =>
              total +
              creditor.splitCount,
            0
          );

        return {
          ...person,
          creditors,
          totalOwed,
          totalSplits,
        };
      })
      .sort(
        (a, b) =>
          b.totalOwed - a.totalOwed
      );

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-2xl md:p-7">

      {/* HEADER */}

      <div className="mb-6">

        <p className="text-sm text-slate-400">
          Based on all split history
        </p>

        <h2 className="text-2xl font-bold">
          Person Totals
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Shows how much each person needs to pay and who they need to pay.
        </p>

      </div>

      {/* EMPTY */}

      {peopleDebts.length === 0 ? (
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

          {peopleDebts.map((person) => (
            <div
              key={person.name}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
            >

              {/* PERSON */}

              <div className="flex items-center justify-between gap-4 p-4">

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
                      {person.totalSplits}{" "}
                      {person.totalSplits === 1
                        ? "split"
                        : "splits"}
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-xs text-slate-500">
                    Total to pay
                  </p>

                  <p className="text-lg font-bold">
                    ₱
                    {person.totalOwed.toFixed(
                      2
                    )}
                  </p>

                </div>

              </div>

              {/* WHO TO PAY */}

              <div className="border-t border-white/10 p-4">

                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Needs to pay
                </p>

                <div className="space-y-3">

                  {person.creditors.map(
                    (creditor) => (
                      <div
                        key={creditor.name}
                        className="rounded-xl bg-white/5 p-4"
                      >

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <p className="text-sm">

                              <span className="text-slate-400">
                                Pay{" "}
                              </span>

                              <span className="font-semibold text-cyan-300">
                                {creditor.name}
                              </span>

                            </p>

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

                          <p className="font-bold">
                            ₱
                            {creditor.amount.toFixed(
                              2
                            )}
                          </p>

                        </div>

                        {/* SPLIT BREAKDOWN */}

                        <div className="mt-3 border-t border-white/5 pt-3">

                          {creditor.splits.map(
                            (
                              split,
                              index
                            ) => (
                              <div
                                key={index}
                                className="flex justify-between gap-3 py-1 text-xs"
                              >

                                <span className="truncate text-slate-500">
                                  {
                                    split.description
                                  }
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

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>
          ))}

        </div>
      )}

    </section>
  );
}

export default PersonTotals;