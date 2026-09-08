import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  QrCode,
  RotateCcw,
  WalletCards,
} from "lucide-react";

import {
  useState,
} from "react";

function PersonTotals({
  savedSplits = [],
  people = [],
  settlements = {},
  onMarkPaid,
  onRestorePayment,
  onViewWallet,
  paymentLoading,
  getSettlementId,
}) {

  const [
    expandedPerson,
    setExpandedPerson,
  ] = useState(null);

  const togglePerson = (
    personKey
  ) => {
    setExpandedPerson(
      (current) =>
        current === personKey
          ? null
          : personKey
    );
  };

  // =========================================
  // NORMALIZE
  // =========================================

  const normalizeName = (
    name = ""
  ) =>
    String(name)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  // =========================================
  // FIND SAVED PERSON
  // =========================================

  const findSavedPerson = (
    name
  ) => {
    const key =
      normalizeName(name);

    return people.find(
      (person) =>
        normalizeName(
          person.name
        ) === key
    );
  };

  // =========================================
  // BUILD DEBTS
  // =========================================

  const debts = {};

  savedSplits.forEach(
    (split) => {
      let payer;
      let participants;

      // NEW FORMAT
      if (
        split.payer?.name &&
        Array.isArray(
          split.participants
        )
      ) {
        payer =
          split.payer;

        participants =
          split.participants;
      }

      // OLD FORMAT
      else {
        payer = {
          id: null,

          name:
            split.addedBy ||
            "Unknown",

          linkedUid:
            null,

          linkedEmail:
            null,

          username:
            "",
        };

        participants = (
          split.people || []
        ).map((name) => ({
          id: null,

          name,

          linkedUid:
            null,

          linkedEmail:
            null,

          username:
            "",
        }));
      }

      if (!payer?.name) {
        return;
      }

      const payerName =
        String(
          payer.name
        )
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const payerKey =
        normalizeName(
          payerName
        );

      if (!payerKey) {
        return;
      }

      const amountPerPerson =
        Number(
          split.amountPerPerson
        ) || 0;

      participants.forEach(
        (participant) => {
          if (
            !participant?.name
          ) {
            return;
          }

          const participantName =
            String(
              participant.name
            )
              .trim()
              .replace(
                /\s+/g,
                " "
              );

          const participantKey =
            normalizeName(
              participantName
            );

          if (
            !participantKey
          ) {
            return;
          }

          // Don't owe yourself.
          if (
            participantKey ===
            payerKey
          ) {
            return;
          }

          // ===================================
          // DEBTOR
          // ===================================

          if (
            !debts[
              participantKey
            ]
          ) {
            const savedDebtor =
              findSavedPerson(
                participantName
              );

            debts[
              participantKey
            ] = {
              key:
                participantKey,

              person: {
                id:
                  savedDebtor?.id ||
                  participant.id ||
                  null,

                name:
                  savedDebtor?.name ||
                  participantName,

                linkedUid:
                  savedDebtor
                    ?.linkedUid ||
                  participant
                    .linkedUid ||
                  null,

                linkedEmail:
                  savedDebtor
                    ?.linkedEmail ||
                  participant
                    .linkedEmail ||
                  null,

                username:
                  savedDebtor
                    ?.username ||
                  participant
                    .username ||
                  "",
              },

              creditors: {},
            };
          }

          // ===================================
          // CREDITOR / PERSON WHO COVERED
          // ===================================

          if (
            !debts[
              participantKey
            ].creditors[
              payerKey
            ]
          ) {
            const savedCreditor =
              findSavedPerson(
                payerName
              );

            debts[
              participantKey
            ].creditors[
              payerKey
            ] = {
              key:
                payerKey,

              person: {
                id:
                  savedCreditor?.id ||
                  payer.id ||
                  null,

                name:
                  savedCreditor?.name ||
                  payerName,

                linkedUid:
                  savedCreditor
                    ?.linkedUid ||
                  payer
                    .linkedUid ||
                  null,

                linkedEmail:
                  savedCreditor
                    ?.linkedEmail ||
                  payer
                    .linkedEmail ||
                  null,

                username:
                  savedCreditor
                    ?.username ||
                  payer
                    .username ||
                  "",
              },

              amount: 0,

              splits: [],
            };
          }

          const row =
            debts[
              participantKey
            ].creditors[
              payerKey
            ];

          row.amount +=
            amountPerPerson;

          row.splits.push({
            id:
              split.id,

            description:
              split.description ||
              "Expense",

            amount:
              amountPerPerson,
          });
        }
      );
    }
  );

  // =========================================
  // FINAL DATA
  // =========================================

  const debtPeople =
    Object.values(debts)
      .map((entry) => {
        // Always refresh debtor
        // from current Saved People.
        const latestDebtor =
          findSavedPerson(
            entry.person.name
          );

        const debtorPerson = {
          ...entry.person,

          id:
            latestDebtor?.id ||
            entry.person.id ||
            null,

          name:
            latestDebtor?.name ||
            entry.person.name,

          linkedUid:
            latestDebtor
              ?.linkedUid ||
            entry.person
              .linkedUid ||
            null,

          linkedEmail:
            latestDebtor
              ?.linkedEmail ||
            entry.person
              .linkedEmail ||
            null,

          username:
            latestDebtor
              ?.username ||
            entry.person
              .username ||
            "",

          photoURL:
            latestDebtor
              ?.photoURL ||
            entry.person
              .photoURL ||
            null,
        };

        const creditors =
          Object.values(
            entry.creditors
          ).map(
            (creditor) => {
              // IMPORTANT:
              // Refresh the creditor from
              // current Saved People.
              //
              // This makes the Wallet button
              // receive the latest linkedUid.
              const latestCreditor =
                findSavedPerson(
                  creditor.person
                    .name
                );

              const creditorPerson =
                {
                  ...creditor.person,

                  id:
                    latestCreditor
                      ?.id ||
                    creditor.person
                      .id ||
                    null,

                  name:
                    latestCreditor
                      ?.name ||
                    creditor.person
                      .name,

                  linkedUid:
                    latestCreditor
                      ?.linkedUid ||
                    creditor.person
                      .linkedUid ||
                    null,

                  linkedEmail:
                    latestCreditor
                      ?.linkedEmail ||
                    creditor.person
                      .linkedEmail ||
                    null,

                  username:
                    latestCreditor
                      ?.username ||
                    creditor.person
                      .username ||
                    "",

                  photoURL:
                    latestCreditor
                      ?.photoURL ||
                    creditor.person
                      .photoURL ||
                    null,
                };

              const settlementId =
                getSettlementId(
                  entry.key,
                  creditor.key
                );

              const settlement =
                settlements[
                  settlementId
                ];

              const total =
                Number(
                  creditor.amount
                ) || 0;

              const settled =
                Number(
                  settlement
                    ?.settledAmount
                ) || 0;

              const outstanding =
                Math.max(
                  total -
                    settled,
                  0
                );

              return {
                ...creditor,

                person:
                  creditorPerson,

                total,
                settled,
                outstanding,

                settlementId,

                isPaid:
                  total > 0 &&
                  outstanding <=
                    0.009,
              };
            }
          );

        return {
          ...entry,

          person:
            debtorPerson,

          creditors,

          totalOwed:
            creditors.reduce(
              (
                total,
                creditor
              ) =>
                total +
                creditor.outstanding,
              0
            ),
        };
      })
      .sort(
        (a, b) =>
          b.totalOwed -
          a.totalOwed
      );

  // =========================================
  // UI
  // =========================================

  return (
    <section className="app-card w-full min-w-0 overflow-hidden">
      {/* HEADER */}

      <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <WalletCards
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
              Balances
            </p>

            <h2 className="text-xl font-extrabold">
              Person Totals
            </h2>

            <p className="mt-1 text-xs text-blue-100/70">
              Click a person's name or icon to view the breakdown.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {debtPeople.length ===
        0 ? (
          <div className="rounded-2xl bg-[#eaf0fa] p-8 text-center">
            <WalletCards
              size={30}
              className="mx-auto text-[#9da9bb]"
            />

            <p className="mt-3 text-sm font-bold text-[#71809a]">
              No balances yet.
            </p>

            <p className="mt-1 text-xs text-[#9ba6b9]">
              Add an expense to start calculating balances.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {debtPeople.map(
              (entry) => {
                const isExpanded =
                  expandedPerson ===
                  entry.key;

                return (
                  <div
                    key={entry.key}
                    className="overflow-hidden rounded-[20px] border border-[#dce3ef] bg-[#eef2f8] transition"
                  >
                    {/* CLICKABLE PERSON SUMMARY */}

                    <button
                      type="button"
                      onClick={() =>
                        togglePerson(
                          entry.key
                        )
                      }
                      aria-expanded={
                        isExpanded
                      }
                      className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-[#e7edf7] sm:p-5"
                    >
                      {entry.person
                        .photoURL ? (
                        <img
                          src={
                            entry.person
                              .photoURL
                          }
                          alt={`${entry.person.name || "Person"} profile`}
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 shrink-0 rounded-2xl border border-white/80 object-cover shadow-sm"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              "none";

                            const fallback =
                              event.currentTarget
                                .nextElementSibling;

                            if (
                              fallback
                            ) {
                              fallback.style.display =
                                "flex";
                            }
                          }}
                        />
                      ) : null}

                      <div
                        className="h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dfe8ff] text-lg font-extrabold uppercase text-[#294aad]"
                        style={{
                          display:
                            entry.person
                              .photoURL
                              ? "none"
                              : "flex",
                        }}
                      >
                        {String(
                          entry.person
                            .name ||
                            "?"
                        )
                          .trim()
                          .charAt(0) ||
                          "?"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-[#182442]">
                          {
                            entry.person
                              .name
                          }
                        </p>

                        <p className="mt-1 text-xs text-[#8995aa]">
                          {isExpanded
                            ? "Hide balance breakdown"
                            : "Tap to view balance breakdown"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-extrabold text-[#142a76] sm:text-xl">
                            ₱
                            {entry.totalOwed.toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>

                          <p className="text-[11px] font-bold text-[#8995aa]">
                            Total unpaid
                          </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#294aad] shadow-sm">
                          {isExpanded ? (
                            <ChevronDown
                              size={19}
                            />
                          ) : (
                            <ChevronRight
                              size={19}
                            />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* EXPANDED BREAKDOWN */}

                    {isExpanded && (
                      <div className="border-t border-[#dce3ef] p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8995aa]">
                            Amount Breakdown
                          </p>

                          <p className="text-xs font-bold text-[#71809a]">
                            {
                              entry.creditors
                                .length
                            }{" "}
                            {entry.creditors
                              .length ===
                            1
                              ? "person"
                              : "people"}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {entry.creditors.map(
                            (
                              creditor
                            ) => (
                              <div
                                key={
                                  creditor.key
                                }
                                className="rounded-2xl border border-[#e0e6f0] bg-[#f8faff] p-4"
                              >
                                {/* WHO OWES WHO */}

                                <div className="flex min-w-0 items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="truncate font-bold text-[#52617d]">
                                      {
                                        entry
                                          .person
                                          .name
                                      }
                                    </span>

                                    <ArrowRight
                                      size={16}
                                      className="shrink-0 text-[#8995aa]"
                                    />

                                    <span className="truncate font-extrabold text-[#142a76]">
                                      {
                                        creditor
                                          .person
                                          .name
                                      }
                                    </span>
                                  </div>

                                  {creditor.isPaid ? (
                                    <span className="shrink-0 text-sm font-extrabold text-[#18845c]">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="shrink-0 font-extrabold text-[#142a76]">
                                      ₱
                                      {creditor.outstanding.toLocaleString(
                                        "en-PH",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                    </span>
                                  )}
                                </div>

                                {/* EXPENSE COUNT */}

                                <p className="mt-2 text-xs text-[#8995aa]">
                                  {
                                    creditor
                                      .splits
                                      .length
                                  }{" "}
                                  {creditor
                                    .splits
                                    .length ===
                                  1
                                    ? "expense"
                                    : "expenses"}
                                </p>

                                {/* EXPENSE LIST */}

                                <div className="mt-3 space-y-2">
                                  {creditor.splits.map(
                                    (
                                      split,
                                      index
                                    ) => (
                                      <div
                                        key={`${split.id || "split"}-${index}`}
                                        className="flex justify-between gap-3 text-xs text-[#71809a]"
                                      >
                                        <span className="min-w-0 break-words">
                                          {
                                            split.description
                                          }
                                        </span>

                                        <span className="shrink-0">
                                          ₱
                                          {Number(
                                            split.amount
                                          ).toLocaleString(
                                            "en-PH",
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>

                                {/* PREVIOUSLY PAID */}

                                {creditor.settled >
                                  0 &&
                                  !creditor.isPaid && (
                                    <div className="mt-3 rounded-xl bg-[#e7f6ef] px-3 py-2 text-xs font-bold text-[#18845c]">
                                      Previously
                                      paid: ₱
                                      {creditor.settled.toLocaleString(
                                        "en-PH",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                    </div>
                                  )}

                                {/* WALLET BUTTON */}

                                {creditor
                                  .person
                                  .linkedUid ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      console.log(
                                        "Opening wallet for:",
                                        creditor.person
                                      );

                                      onViewWallet({
                                        id:
                                          creditor
                                            .person
                                            .id ||
                                          null,

                                        name:
                                          creditor
                                            .person
                                            .name,

                                        linkedUid:
                                          creditor
                                            .person
                                            .linkedUid,

                                        linkedEmail:
                                          creditor
                                            .person
                                            .linkedEmail ||
                                          null,

                                        username:
                                          creditor
                                            .person
                                            .username ||
                                          "",
                                      });
                                    }}
                                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#142a76] text-sm font-bold text-white transition hover:bg-[#10245f]"
                                  >
                                    <QrCode
                                      size={17}
                                    />

                                    View{" "}
                                    {
                                      creditor
                                        .person
                                        .name
                                    }
                                    's Wallet
                                  </button>
                                ) : (
                                  <div className="mt-4 rounded-xl bg-[#eef2f8] px-3 py-3 text-center text-xs font-bold text-[#8995aa]">
                                    {
                                      creditor
                                        .person
                                        .name
                                    }
                                    's account is not linked yet
                                  </div>
                                )}

                                {/* PAYMENT */}

                                {creditor.isPaid ? (
                                  <button
                                    type="button"
                                    disabled={
                                      paymentLoading ===
                                      creditor.settlementId
                                    }
                                    onClick={() =>
                                      onRestorePayment(
                                        entry.key,
                                        creditor.key
                                      )
                                    }
                                    className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e7ebf2] text-sm font-bold text-[#52617d] disabled:opacity-50"
                                  >
                                    <RotateCcw
                                      size={16}
                                    />

                                    Restore Payment
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={
                                      paymentLoading ===
                                      creditor.settlementId
                                    }
                                    onClick={() =>
                                      onMarkPaid(
                                        entry.key,
                                        creditor.key,
                                        creditor.total,
                                        entry.person
                                          .name,
                                        creditor.person
                                          .name
                                      )
                                    }
                                    className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e4ebff] text-sm font-bold text-[#142a76] disabled:opacity-50"
                                  >
                                    <CheckCircle2
                                      size={17}
                                    />

                                    Mark Paid
                                  </button>
                                )}
                              </div>
                            )
                          )}
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

export default PersonTotals;