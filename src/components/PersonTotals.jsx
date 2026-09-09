import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitCompareArrows,
  QrCode,
  WalletCards,
} from "lucide-react";

import { useMemo, useState } from "react";

function PersonTotals({
  savedSplits = [],
  people = [],
  settlements = {},
  onMarkPaid,
  onMarkNetPaid,
  onViewWallet,
  paymentLoading,
  getSettlementId,
}) {
  const [expandedPerson, setExpandedPerson] =
    useState(null);

  const [simplifyBalances, setSimplifyBalances] =
    useState(false);

  const normalizeName = (name = "") =>
    String(name)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  const money = (value) =>
    Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  const findSavedPerson = (name) => {
    const key = normalizeName(name);

    return people.find(
      (person) =>
        normalizeName(person.name) ===
        key
    );
  };

  const getParticipantAmount = (
    split,
    participant
  ) => {
    const explicitAmount =
      Number(
        participant?.amount ??
          participant?.shareAmount
      );

    if (
      Number.isFinite(explicitAmount) &&
      explicitAmount >= 0
    ) {
      return explicitAmount;
    }

    const percentage =
      Number(
        participant?.percentage ??
          participant?.percent
      );

    const totalAmount =
      Number(split.totalAmount) || 0;

    if (
      Number.isFinite(percentage) &&
      percentage >= 0 &&
      totalAmount > 0
    ) {
      return (
        totalAmount *
        (percentage / 100)
      );
    }

    return (
      Number(split.amountPerPerson) || 0
    );
  };

  const rawDebtPeople = useMemo(() => {
    const debts = {};

    savedSplits.forEach((split) => {
      let payer;
      let participants;

      if (
        split.payer?.name &&
        Array.isArray(
          split.participants
        )
      ) {
        payer = split.payer;
        participants =
          split.participants;
      } else {
        payer = {
          id: null,
          name:
            split.addedBy ||
            "Unknown",
          linkedUid: null,
          linkedEmail: null,
          username: "",
        };

        participants = (
          split.people || []
        ).map((name) => ({
          id: null,
          name,
          linkedUid: null,
          linkedEmail: null,
          username: "",
        }));
      }

      if (!payer?.name) return;

      const payerName =
        String(payer.name)
          .trim()
          .replace(/\s+/g, " ");

      const payerKey =
        normalizeName(payerName);

      if (!payerKey) return;

      participants.forEach(
        (participant) => {
          if (!participant?.name) {
            return;
          }

          const participantName =
            String(participant.name)
              .trim()
              .replace(/\s+/g, " ");

          const participantKey =
            normalizeName(
              participantName
            );

          if (
            !participantKey ||
            participantKey === payerKey
          ) {
            return;
          }

          const amount =
            getParticipantAmount(
              split,
              participant
            );

          if (amount <= 0) return;

          if (!debts[participantKey]) {
            const savedDebtor =
              findSavedPerson(
                participantName
              );

            debts[participantKey] = {
              key: participantKey,
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
                photoURL:
                  savedDebtor
                    ?.photoURL ||
                  participant
                    .photoURL ||
                  null,
              },
              creditors: {},
            };
          }

          if (
            !debts[participantKey]
              .creditors[payerKey]
          ) {
            const savedCreditor =
              findSavedPerson(
                payerName
              );

            debts[
              participantKey
            ].creditors[payerKey] = {
              key: payerKey,
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
                  payer.linkedUid ||
                  null,
                linkedEmail:
                  savedCreditor
                    ?.linkedEmail ||
                  payer.linkedEmail ||
                  null,
                username:
                  savedCreditor
                    ?.username ||
                  payer.username ||
                  "",
                photoURL:
                  savedCreditor
                    ?.photoURL ||
                  payer.photoURL ||
                  null,
              },
              amount: 0,
              splits: [],
            };
          }

          const row =
            debts[
              participantKey
            ].creditors[payerKey];

          row.amount += amount;

          row.splits.push({
            id: split.id,
            description:
              split.description ||
              "Expense",
            category:
              split.category ||
              "Other",
            amount,
          });
        }
      );
    });

    return Object.values(debts)
      .map((entry) => {
        const latestDebtor =
          findSavedPerson(
            entry.person.name
          );

        const debtorPerson = {
          ...entry.person,
          ...(latestDebtor || {}),
          photoURL:
            latestDebtor?.photoURL ||
            entry.person.photoURL ||
            null,
        };

        const creditors =
          Object.values(
            entry.creditors
          ).map((creditor) => {
            const latestCreditor =
              findSavedPerson(
                creditor.person.name
              );

            const creditorPerson = {
              ...creditor.person,
              ...(latestCreditor || {}),
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
                total - settled,
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
          })
          .filter(
            (creditor) =>
              creditor.outstanding >
              0.009
          );

        return {
          ...entry,
          person:
            debtorPerson,
          creditors,
          totalOwed:
            creditors.reduce(
              (sum, item) =>
                sum +
                item.outstanding,
              0
            ),
        };
      })
      .filter(
        (entry) =>
          entry.totalOwed >
          0.009
      )
      .sort(
        (a, b) =>
          b.totalOwed -
          a.totalOwed
      );
  }, [
    savedSplits,
    people,
    settlements,
  ]);

  const simplifiedDebtPeople =
    useMemo(() => {
      const directional =
        new Map();

      rawDebtPeople.forEach(
        (entry) => {
          entry.creditors.forEach(
            (creditor) => {
              directional.set(
                `${entry.key}__${creditor.key}`,
                {
                  debtorKey:
                    entry.key,
                  debtorPerson:
                    entry.person,
                  creditorKey:
                    creditor.key,
                  creditorPerson:
                    creditor.person,
                  outstanding:
                    creditor.outstanding,
                  rawTotal:
                    creditor.total,
                  settled:
                    creditor.settled,
                  splits:
                    creditor.splits,
                }
              );
            }
          );
        }
      );

      const handled =
        new Set();

      const grouped = {};

      directional.forEach(
        (row, key) => {
          if (
            handled.has(key)
          ) {
            return;
          }

          const reverseKey =
            `${row.creditorKey}__${row.debtorKey}`;

          const reverse =
            directional.get(
              reverseKey
            );

          handled.add(key);

          if (reverse) {
            handled.add(
              reverseKey
            );
          }

          const a =
            row.outstanding;

          const b =
            reverse
              ?.outstanding ||
            0;

          const difference =
            a - b;

          if (
            Math.abs(difference) <=
            0.009
          ) {
            return;
          }

          const winner =
            difference > 0
              ? row
              : reverse;

          const loser =
            difference > 0
              ? reverse
              : row;

          if (!winner) return;

          const debtorKey =
            winner.debtorKey;

          if (
            !grouped[
              debtorKey
            ]
          ) {
            grouped[
              debtorKey
            ] = {
              key:
                debtorKey,
              person:
                winner.debtorPerson,
              creditors: [],
              totalOwed: 0,
            };
          }

          const amount =
            Math.abs(
              difference
            );

          grouped[
            debtorKey
          ].creditors.push({
            key:
              winner.creditorKey,
            person:
              winner.creditorPerson,
            outstanding:
              amount,
            total:
              amount,
            settled: 0,
            isPaid: false,
            simplified: true,
            splits:
              winner.splits,
            reciprocalOutstanding:
              loser
                ?.outstanding ||
              0,
            forwardRawTotal:
              winner.rawTotal,
            reverseRawTotal:
              loser
                ?.rawTotal ||
              0,
            forwardSettled:
              winner.settled,
            reverseSettled:
              loser
                ?.settled ||
              0,
          });

          grouped[
            debtorKey
          ].totalOwed +=
            amount;
        }
      );

      return Object.values(
        grouped
      ).sort(
        (a, b) =>
          b.totalOwed -
          a.totalOwed
      );
    }, [
      rawDebtPeople,
    ]);

  const debtPeople =
    simplifyBalances
      ? simplifiedDebtPeople
      : rawDebtPeople;

  const togglePerson = (
    key
  ) => {
    setExpandedPerson(
      (current) =>
        current === key
          ? null
          : key
    );
  };

  return (
    <section className="app-card w-full min-w-0 overflow-hidden">
      <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                Tap a person to view the breakdown.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSimplifyBalances(
                (value) =>
                  !value
              )
            }
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold transition ${
              simplifyBalances
                ? "bg-white text-[#142a76]"
                : "bg-white/15 text-white hover:bg-white/20"
            }`}
          >
            <GitCompareArrows
              size={17}
            />

            {simplifyBalances
              ? "Simplified On"
              : "Simplify Debts"}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {simplifyBalances && (
          <div className="mb-4 rounded-2xl border border-[#cfd9f5] bg-[#eef3ff] p-4">
            <p className="text-sm font-extrabold text-[#142a76]">
              Mutual debts are being deducted.
            </p>

            <p className="mt-1 text-xs leading-5 text-[#71809a]">
              Example: if A owes B ₱1,000 and B owes A ₱300, only A → B ₱700 is shown. This is optional and does not change your original expenses.
            </p>
          </div>
        )}

        {debtPeople.length ===
        0 ? (
          <div className="rounded-2xl bg-[#eaf0fa] p-8 text-center">
            <CheckCircle2
              size={30}
              className="mx-auto text-[#4b9a78]"
            />

            <p className="mt-3 text-sm font-bold text-[#71809a]">
              Everyone is settled.
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
                    className="overflow-hidden rounded-[20px] border border-[#dce3ef] bg-[#eef2f8]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        togglePerson(
                          entry.key
                        )
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
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dfe8ff] text-lg font-extrabold uppercase text-[#294aad]">
                          {String(
                            entry.person
                              .name ||
                              "?"
                          )
                            .trim()
                            .charAt(0)}
                        </div>
                      )}

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

                      <div className="text-right">
                        <p className="font-extrabold text-[#142a76]">
                          ₱
                          {money(
                            entry.totalOwed
                          )}
                        </p>

                        <div className="mt-1 flex justify-end text-[#8995aa]">
                          {isExpanded ? (
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

                    {isExpanded && (
                      <div className="space-y-3 border-t border-[#dce3ef] p-4 sm:p-5">
                        {entry.creditors.map(
                          (
                            creditor
                          ) => {
                            const loadingId =
                              getSettlementId(
                                entry.key,
                                creditor.key
                              );

                            return (
                              <div
                                key={
                                  creditor.key
                                }
                                className="rounded-2xl border border-[#e0e6f0] bg-white p-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
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

                                  <span className="font-extrabold text-[#142a76]">
                                    ₱
                                    {money(
                                      creditor.outstanding
                                    )}
                                  </span>
                                </div>

                                {creditor.simplified && (
                                  <div className="mt-3 rounded-xl bg-[#eef3ff] px-3 py-2 text-xs text-[#52617d]">
                                    Mutual debt deducted: ₱
                                    {money(
                                      creditor.reciprocalOutstanding
                                    )}
                                  </div>
                                )}

                                {!creditor.simplified &&
                                  creditor.splits
                                    ?.length >
                                    0 && (
                                    <div className="mt-3 space-y-2">
                                      {creditor.splits.map(
                                        (
                                          split,
                                          index
                                        ) => (
                                          <div
                                            key={`${split.id || "split"}-${index}`}
                                            className="flex items-start justify-between gap-3 text-xs text-[#71809a]"
                                          >
                                            <span className="min-w-0">
                                              <span className="font-bold text-[#52617d]">
                                                {
                                                  split.category
                                                }
                                              </span>
                                              <span className="block">
                                                {
                                                  split.description
                                                }
                                              </span>
                                            </span>

                                            <span className="shrink-0">
                                              ₱
                                              {money(
                                                split.amount
                                              )}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {creditor.person
                                    .linkedUid && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onViewWallet?.(
                                          {
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
                                          }
                                        )
                                      }
                                      className="flex min-h-10 items-center gap-2 rounded-xl bg-[#eef3ff] px-3 text-xs font-extrabold text-[#294aad]"
                                    >
                                      <QrCode
                                        size={15}
                                      />
                                      View Wallet
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={
                                      paymentLoading ===
                                      loadingId
                                    }
                                    onClick={() => {
                                      if (
                                        creditor.simplified &&
                                        onMarkNetPaid
                                      ) {
                                        onMarkNetPaid({
                                          debtorKey:
                                            entry.key,
                                          creditorKey:
                                            creditor.key,
                                          debtorName:
                                            entry.person
                                              .name,
                                          creditorName:
                                            creditor.person
                                              .name,
                                          amount:
                                            creditor.outstanding,
                                          forwardRawTotal:
                                            creditor.forwardRawTotal,
                                          reverseRawTotal:
                                            creditor.reverseRawTotal,
                                        });
                                      } else {
                                        onMarkPaid?.(
                                          entry.key,
                                          creditor.key,
                                          creditor.outstanding,
                                          entry.person
                                            .name,
                                          creditor.person
                                            .name
                                        );
                                      }
                                    }}
                                    className="flex min-h-10 items-center gap-2 rounded-xl bg-[#142a76] px-3 text-xs font-extrabold text-white disabled:opacity-50"
                                  >
                                    <CheckCircle2
                                      size={15}
                                    />
                                    Mark Paid
                                  </button>

                                </div>
                              </div>
                            );
                          }
                        )}
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
