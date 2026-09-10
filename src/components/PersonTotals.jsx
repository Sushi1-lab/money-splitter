import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitCompareArrows,
  ImagePlus,
  QrCode,
  Upload,
  WalletCards,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

function PersonTotals({
  savedSplits = [],
  people = [],
  settlements = {},
  onMarkPaid,
  onMarkNetPaid,
  onOffsetMutualDebt,
  currentUser,
  currentProfile = null,
  currentServerUsername = "",
  onViewWallet,
  paymentLoading,
  getSettlementId,
}) {
  const [expandedPerson, setExpandedPerson] =
    useState(null);

  const [simplifyBalances, setSimplifyBalances] =
    useState(false);


  const [paymentRequest, setPaymentRequest] =
    useState(null);

  const [paymentProof, setPaymentProof] =
    useState(null);

  const [paymentProofPreview, setPaymentProofPreview] =
    useState("");

  const [proofProcessing, setProofProcessing] =
    useState(false);

  const closePaymentProof = () => {
    if (proofProcessing) return;
    setPaymentRequest(null);
    setPaymentProof(null);
    setPaymentProofPreview("");
  };

  const compressPaymentProof = async (file) => {
    if (!file?.type?.startsWith("image/")) {
      throw new Error("Please choose an image screenshot.");
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });

    const maxDimension = 1280;
    const ratio = Math.min(
      1,
      maxDimension / Math.max(image.width, image.height)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.78;
    let compressed = canvas.toDataURL("image/jpeg", quality);

    while (compressed.length > 520000 && quality > 0.42) {
      quality -= 0.08;
      compressed = canvas.toDataURL("image/jpeg", quality);
    }

    if (compressed.length > 700000) {
      throw new Error(
        "The screenshot is still too large. Please crop it and try again."
      );
    }

    return {
      dataUrl: compressed,
      name: file.name || "payment-proof.jpg",
      type: "image/jpeg",
    };
  };

  const handlePaymentProofFile = async (file) => {
    if (!file) return;

    try {
      setProofProcessing(true);
      const compressed = await compressPaymentProof(file);
      setPaymentProof(compressed);
      setPaymentProofPreview(compressed.dataUrl);
    } catch (err) {
      console.error("Payment proof error:", err);
      window.alert(
        err?.message || "Unable to prepare this screenshot."
      );
    } finally {
      setProofProcessing(false);
    }
  };

  const submitPaymentProof = async () => {
    if (!paymentRequest || !paymentProof) return;

    const proof = {
      paymentProofDataUrl: paymentProof.dataUrl,
      paymentProofName: paymentProof.name,
      paymentProofType: paymentProof.type,
      splitIds: paymentRequest.splitIds || [],
      splitDetails: paymentRequest.splitDetails || [],
      creditorUid: paymentRequest.creditorUid || "",
      creditorEmail: paymentRequest.creditorEmail || "",
    };

    if (
      paymentRequest.simplified &&
      onMarkNetPaid
    ) {
      await onMarkNetPaid({
        ...paymentRequest,
        ...proof,
      });
    } else {
      await onMarkPaid?.(
        paymentRequest.debtorKey,
        paymentRequest.creditorKey,
        paymentRequest.amount,
        paymentRequest.debtorName,
        paymentRequest.creditorName,
        proof
      );
    }

    closePaymentProof();
  };

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

  const normalizeEmail =
    (email = "") =>
      String(email)
        .trim()
        .toLowerCase();

  const isCurrentPerson =
    (person) => {
      if (!person) {
        return false;
      }

      const currentUid =
        currentUser?.uid ||
        "";

      const currentEmail =
        normalizeEmail(
          currentUser?.email ||
            ""
        );

      const currentUsername =
        normalizeName(
          currentServerUsername ||
            currentProfile?.username ||
            ""
        );

      const currentDisplayName =
        normalizeName(
          currentProfile?.displayName ||
            currentUser?.displayName ||
            ""
        );

      const personUid =
        person.linkedUid ||
        "";

      const personEmail =
        normalizeEmail(
          person.linkedEmail ||
            ""
        );

      const personUsername =
        normalizeName(
          person.username ||
            ""
        );

      const personName =
        normalizeName(
          person.name ||
            ""
        );

      if (
        currentUid &&
        personUid &&
        currentUid ===
          personUid
      ) {
        return true;
      }

      if (
        currentEmail &&
        personEmail &&
        currentEmail ===
          personEmail
      ) {
        return true;
      }

      if (
        currentUsername &&
        personUsername &&
        currentUsername ===
          personUsername
      ) {
        return true;
      }

      if (
        currentUsername &&
        personName &&
        currentUsername ===
          personName
      ) {
        return true;
      }

      if (
        currentDisplayName &&
        personName &&
        currentDisplayName ===
          personName
      ) {
        return true;
      }

      return false;
    };

  const getReciprocalDebt =
    (
      debtorKey,
      creditorKey
    ) => {
      const reverseEntry =
        rawDebtPeople.find(
          (entry) =>
            entry.key ===
            creditorKey
        );

      return reverseEntry?.creditors?.find(
        (creditor) =>
          creditor.key ===
          debtorKey
      ) || null;
    };

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
              Example: if A owes B ₱1,000 and B owes A ₱300, the smaller ₱300 can reduce both balances, leaving only A → B ₱700. No money is transferred.
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

                            const reciprocalDebt =
                              !creditor.simplified
                                ? getReciprocalDebt(
                                    entry.key,
                                    creditor.key
                                  )
                                : null;

                            const myDebtAmount =
                              Number(
                                creditor.outstanding ||
                                  0
                              );

                            const theirDebtAmount =
                              Number(
                                reciprocalDebt?.outstanding ||
                                  0
                              );

                            const mutualPayAmount =
                              reciprocalDebt
                                ? Math.min(
                                    myDebtAmount,
                                    theirDebtAmount
                                  )
                                : 0;

                            // Only the person who owes the SMALLER amount
                            // gets the Reduce Balances option.
                            const canOffset =
                              !creditor.simplified &&
                              reciprocalDebt &&
                              myDebtAmount >
                                0.009 &&
                              theirDebtAmount >
                                0.009 &&
                              myDebtAmount <
                                theirDebtAmount -
                                  0.009;

                            const offsetRemaining =
                              canOffset
                                ? Math.max(
                                    theirDebtAmount -
                                      myDebtAmount,
                                    0
                                  )
                                : 0;

                            const myRemainingAfterOffset =
                              canOffset
                                ? 0
                                : myDebtAmount;

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

                                {canOffset && (
                                  <div className="mt-4 rounded-xl border border-[#d6e2fb] bg-[#eef3ff] p-3">
                                    <p className="text-xs font-black text-[#142a76]">
                                      You can reduce both balances without sending money.
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-[#71809a]">
                                      This is the smaller mutual balance. Reduce ₱{money(
                                        myDebtAmount
                                      )} from both sides. {entry.person.name}'s balance becomes ₱0.00, and {creditor.person.name}'s balance becomes ₱{money(
                                        offsetRemaining
                                      )}. No money is transferred.
                                    </p>
                                  </div>
                                )}

                                <div className="relative z-20 mt-4 grid w-full gap-2 sm:flex sm:flex-wrap">
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
                                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#eef3ff] px-4 text-sm font-extrabold text-[#294aad] touch-manipulation sm:min-h-10 sm:w-auto sm:px-3 sm:text-xs"
                                    >
                                      <QrCode
                                        size={15}
                                      />
                                      View Wallet
                                    </button>
                                  )}

                                  {canOffset && (
                                    <button
                                      type="button"
                                      disabled={
                                        paymentLoading ===
                                        loadingId
                                      }
                                      onClick={() =>
                                        onOffsetMutualDebt?.({
                                          debtorKey:
                                            entry.key,
                                          creditorKey:
                                            creditor.key,
                                          debtorName:
                                            entry.person.name,
                                          creditorName:
                                            creditor.person.name,
                                          amount:
                                            myDebtAmount,
                                          forwardCurrentSettled:
                                            creditor.settled,
                                          reverseCurrentSettled:
                                            reciprocalDebt.settled,
                                          reciprocalOutstanding:
                                            reciprocalDebt.outstanding,
                                          offsetRemaining,
                                          myRemainingAfterOffset,
                                          creditorUid:
                                            creditor.person?.linkedUid ||
                                            "",
                                          creditorEmail:
                                            creditor.person?.linkedEmail ||
                                            "",
                                          splitIds:
                                            (creditor.splits || [])
                                              .map(
                                                (split) =>
                                                  split.id
                                              )
                                              .filter(
                                                Boolean
                                              ),
                                          splitDetails:
                                            (creditor.splits || []).map(
                                              (split) => ({
                                                id:
                                                  split.id ||
                                                  "",
                                                description:
                                                  split.description ||
                                                  "Expense",
                                                category:
                                                  split.category ||
                                                  "Other",
                                                amount:
                                                  Number(
                                                    split.amount ||
                                                      0
                                                  ),
                                              })
                                            ),
                                        })
                                      }
                                      className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#18845c] px-4 text-sm font-extrabold text-white disabled:pointer-events-none disabled:opacity-50 sm:min-h-10 sm:w-auto sm:px-3 sm:text-xs"
                                    >
                                      <GitCompareArrows
                                        size={15}
                                      />
                                      Reduce Both Balances
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={
                                      paymentLoading ===
                                      loadingId
                                    }
                                    onClick={() =>
                                      setPaymentRequest({
                                        simplified:
                                          Boolean(
                                            creditor.simplified
                                          ),
                                        debtorKey:
                                          entry.key,
                                        creditorKey:
                                          creditor.key,
                                        debtorName:
                                          entry.person.name,
                                        creditorName:
                                          creditor.person.name,
                                        amount:
                                          creditor.outstanding,
                                        forwardRawTotal:
                                          creditor.forwardRawTotal,
                                        reverseRawTotal:
                                          creditor.reverseRawTotal,
                                        creditorUid:
                                          creditor.person?.linkedUid ||
                                          "",
                                        creditorEmail:
                                          creditor.person?.linkedEmail ||
                                          "",
                                        splitIds:
                                          (creditor.splits || [])
                                            .map((split) => split.id)
                                            .filter(Boolean),
                                        splitDetails:
                                          (creditor.splits || []).map(
                                            (split) => ({
                                              id: split.id || "",
                                              description:
                                                split.description ||
                                                "Expense",
                                              category:
                                                split.category ||
                                                "Other",
                                              amount:
                                                Number(split.amount || 0),
                                            })
                                          ),
                                      })
                                    }
                                    className="relative z-30 flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#142a76] px-4 text-sm font-extrabold text-white disabled:pointer-events-none disabled:opacity-50 sm:min-h-10 sm:w-auto sm:px-3 sm:text-xs"
                                  >
                                    <CheckCircle2 size={15} />
                                    Paid
                                  </button>

                                  <p className="text-center text-[11px] leading-5 text-[#8995aa] sm:hidden">
                                    Tap Paid, attach your payment screenshot, then confirm.
                                  </p>

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

      {paymentRequest &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#071333]/60 p-3 backdrop-blur-sm">
            <div className="flex max-h-[calc(100dvh-24px)] w-full max-w-lg flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_30px_90px_rgba(8,24,70,0.32)]">
              <div className="shrink-0 flex items-start justify-between gap-4 bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-100/65">
                    Payment confirmation
                  </p>
                  <h3 className="mt-1 text-xl font-black">
                    Attach payment screenshot
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100/75">
                    {paymentRequest.debtorName} → {paymentRequest.creditorName} · ₱{money(paymentRequest.amount)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePaymentProof}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 transition hover:bg-white/20"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                <div className="rounded-2xl border border-[#dce4f2] bg-[#f7f9fd] p-4">
                  <p className="text-sm font-extrabold text-[#182442]">
                    Proof of payment is required
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                    Upload a screenshot of the QR, e-wallet, or bank payment before this balance can be marked as paid and moved to Paid Expenses.
                  </p>
                </div>

                <label className="mt-4 block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      handlePaymentProofFile(event.target.files?.[0])
                    }
                  />

                  <div className="flex min-h-28 items-center justify-center rounded-2xl border-2 border-dashed border-[#cfd9ea] bg-white p-4 text-center transition hover:border-[#294aad] hover:bg-[#f9fbff]">
                    {proofProcessing ? (
                      <div>
                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#d7dfed] border-t-[#294aad]" />
                        <p className="mt-3 text-xs font-extrabold text-[#52617d]">
                          Preparing screenshot...
                        </p>
                      </div>
                    ) : paymentProofPreview ? (
                      <div className="w-full">
                        <img
                          src={paymentProofPreview}
                          alt="Payment proof preview"
                          className="mx-auto max-h-48 rounded-xl object-contain shadow-sm"
                        />
                        <p className="mt-3 text-xs font-extrabold text-[#294aad]">
                          Tap to replace screenshot
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
                          <ImagePlus size={21} />
                        </div>
                        <p className="mt-3 text-sm font-extrabold text-[#182442]">
                          Upload payment screenshot
                        </p>
                        <p className="mt-1 text-xs text-[#8995aa]">
                          PNG, JPG, or phone screenshot
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="shrink-0 border-t border-[#e6ebf3] bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:p-5">
                <button
                  type="button"
                  disabled={
                    !paymentProof ||
                    proofProcessing ||
                    Boolean(paymentLoading)
                  }
                  onClick={submitPaymentProof}
                  className="flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#142a76] px-5 text-sm font-black text-white shadow-[0_10px_30px_rgba(20,42,118,0.20)] transition hover:bg-[#10245f] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {paymentLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      Marking Paid...
                    </>
                  ) : (
                    <>
                      <Upload size={17} />
                      Mark as Paid & Move to Trash
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}

export default PersonTotals;
