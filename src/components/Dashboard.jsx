import {
  Award,
  ChartNoAxesCombined,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  db,
} from "../firebase.js";

import useAppDialog from "../hooks/useAppDialog.jsx";

function Dashboard({
  profile,
  activeServer,
  savedSplits = [],
  serverPeople = [],
  user,
}) {
  const {
    Dialog,
    success,
    error,
  } = useAppDialog();


  const [showFeedback, setShowFeedback] =
    useState(false);




  const [rating, setRating] =
    useState(0);

  const [feedbackText, setFeedbackText] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const money = (value) =>
    Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  const normalizeName = (
    value = ""
  ) =>
    String(value)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  const normalizeEmail = (
    value = ""
  ) =>
    String(value)
      .trim()
      .toLowerCase();

  const findCurrentPerson = (
    payer,
    fallbackName
  ) => {
    const payerUid =
      payer?.linkedUid ||
      payer?.uid ||
      null;

    const payerEmail =
      normalizeEmail(
        payer?.linkedEmail ||
          payer?.email ||
          ""
      );

    const payerUsername =
      String(
        payer?.username || ""
      )
        .trim()
        .toLowerCase();

    const payerName =
      normalizeName(
        payer?.name ||
          fallbackName ||
          ""
      );

    return (
      serverPeople.find(
        (person) =>
          payerUid &&
          person.linkedUid ===
            payerUid
      ) ||
      serverPeople.find(
        (person) =>
          payerEmail &&
          normalizeEmail(
            person.linkedEmail
          ) === payerEmail
      ) ||
      serverPeople.find(
        (person) =>
          payerUsername &&
          String(
            person.username ||
              ""
          )
            .trim()
            .toLowerCase() ===
            payerUsername
      ) ||
      serverPeople.find(
        (person) =>
          payerName &&
          normalizeName(
            person.name
          ) === payerName
      ) ||
      null
    );
  };

  const getDate = (timestamp) => {
    if (
      timestamp?.toDate
    ) {
      return timestamp.toDate();
    }

    if (
      timestamp?.seconds
    ) {
      return new Date(
        timestamp.seconds *
          1000
      );
    }

    return null;
  };

  const stats =
    useMemo(() => {
      const now =
        new Date();

      const thisMonth =
        savedSplits.filter(
          (split) => {
            const date =
              getDate(
                split.createdAt
              );

            return (
              date &&
              date.getMonth() ===
                now.getMonth() &&
              date.getFullYear() ===
                now.getFullYear()
            );
          }
        );

      const total =
        savedSplits.reduce(
          (sum, item) =>
            sum +
            Number(
              item.totalAmount ||
                0
            ),
          0
        );

      const monthTotal =
        thisMonth.reduce(
          (sum, item) =>
            sum +
            Number(
              item.totalAmount ||
                0
            ),
          0
        );

      const people =
        new Set();

      savedSplits.forEach(
        (split) => {
          (
            split.participants ||
            []
          ).forEach(
            (person) =>
              people.add(
                person.name
              )
          );

          if (
            split.payer?.name
          ) {
            people.add(
              split.payer.name
            );
          }
        }
      );

      return {
        total,
        monthTotal,
        count:
          savedSplits.length,
        people:
          people.size,
      };
    }, [
      savedSplits,
    ]);

  const categoryData =
    useMemo(() => {
      const map = {};

      savedSplits.forEach(
        (split) => {
          const category =
            split.category ||
            "Other";

          map[category] =
            (map[category] ||
              0) +
            Number(
              split.totalAmount ||
                0
            );
        }
      );

      return Object.entries(
        map
      )
        .map(
          ([
            name,
            amount,
          ]) => ({
            name,
            amount,
          })
        )
        .sort(
          (a, b) =>
            b.amount -
            a.amount
        );
    }, [
      savedSplits,
    ]);

  const topCoverers =
    useMemo(() => {
      const map = {};

      savedSplits.forEach(
        (split) => {
          const payer =
            split.payer;

          const name =
            payer?.name ||
            split.addedBy ||
            "Unknown";

          const key =
            normalizeName(name);

          if (!key) {
            return;
          }

          const currentPerson =
            findCurrentPerson(
              payer,
              name
            );

          if (!map[key]) {
            map[key] = {
              key,
              name:
                currentPerson?.name ||
                payer?.name ||
                split.addedBy ||
                "Unknown",
              totalCovered: 0,
              expenseCount: 0,
              photoURL:
                currentPerson?.photoURL ||
                payer?.photoURL ||
                null,
              username:
                currentPerson?.username ||
                payer?.username ||
                "",
            };
          }

          map[key].totalCovered +=
            Number(
              split.totalAmount ||
                0
            );

          map[key].expenseCount +=
            1;

          if (
            currentPerson?.photoURL
          ) {
            map[key].photoURL =
              currentPerson.photoURL;
          }

          if (
            currentPerson?.username
          ) {
            map[key].username =
              currentPerson.username;
          }

          if (
            currentPerson?.name
          ) {
            map[key].name =
              currentPerson.name;
          }
        }
      );

      return Object.values(
        map
      ).sort(
        (a, b) =>
          b.totalCovered -
          a.totalCovered
      );
    }, [
      savedSplits,
      serverPeople,
    ]);

  const monthlyData =
    useMemo(() => {
      const now =
        new Date();

      const rows = [];

      for (
        let offset = 3;
        offset >= 0;
        offset -= 1
      ) {
        const date =
          new Date(
            now.getFullYear(),
            now.getMonth() -
              offset,
            1
          );

        rows.push({
          key: `${date.getFullYear()}-${date.getMonth()}`,
          label:
            date.toLocaleString(
              "en-PH",
              {
                month:
                  "short",
              }
            ),
          amount: 0,
        });
      }

      savedSplits.forEach(
        (split) => {
          const date =
            getDate(
              split.createdAt
            );

          if (!date) return;

          const key =
            `${date.getFullYear()}-${date.getMonth()}`;

          const row =
            rows.find(
              (item) =>
                item.key === key
            );

          if (row) {
            row.amount +=
              Number(
                split.totalAmount ||
                  0
              );
          }
        }
      );

      return rows;
    }, [
      savedSplits,
    ]);

  const maxMonthly =
    Math.max(
      ...monthlyData.map(
        (item) =>
          item.amount
      ),
      1
    );

  const serverType =
    activeServer?.serverType ||
    activeServer?.workspaceType ||
    "temporary";

  const isLongTerm =
    serverType ===
      "long-term" ||
    serverType ===
      "longterm";

  const submitFeedback =
    async () => {
      if (
        rating < 1 ||
        rating > 5
      ) {
        await error(
          "Choose a Rating",
          "Tap 1 to 5 stars first."
        );
        return;
      }

      try {
        setSending(true);

        await addDoc(
          collection(
            db,
            "feedback"
          ),
          {
            rating,
            message:
              feedbackText.trim(),
            userUid:
              user?.uid ||
              "",
            userEmail:
              user?.email ||
              "",
            username:
              profile?.username ||
              "",
            serverId:
              activeServer?.id ||
              null,
            serverName:
              activeServer?.name ||
              "",
            createdAt:
              serverTimestamp(),
          }
        );

        setRating(0);
        setFeedbackText("");

        await success(
          "Thanks for the Feedback!",
          "Your rating was submitted."
        );
      } catch (err) {
        console.error(
          "Feedback error:",
          err
        );

        await error(
          "Unable to Submit Feedback",
          "Please check your Firestore rules and try again."
        );
      } finally {
        setSending(false);
      }
    };

  return (
    <>
      <section className="space-y-5">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#10245f] via-[#1b378e] to-[#3d63d2] p-6 text-white shadow-[0_20px_50px_rgba(20,42,118,0.18)] sm:p-8">
          <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-20 h-48 w-48 rounded-full border-[28px] border-white/5" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-extrabold">
              <Sparkles
                size={14}
              />
              {isLongTerm
                ? "Long-term workspace"
                : "Temporary workspace"}
            </div>

            <h1 className="mt-4 text-3xl font-black sm:text-4xl">
              Hi,{" "}
              {profile?.displayName ||
                "there"}!
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">
              Here is a useful snapshot of{" "}
              <span className="font-extrabold text-white">
                {activeServer?.name ||
                  "your workspace"}
              </span>
              . Track spending, understand patterns, and keep everyone settled.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label:
                "All-time Expenses",
              value:
                `₱${money(
                  stats.total
                )}`,
              icon:
                CircleDollarSign,
            },
            {
              label:
                "This Month",
              value:
                `₱${money(
                  stats.monthTotal
                )}`,
              icon:
                CalendarDays,
            },
            {
              label:
                "Expenses Added",
              value:
                stats.count,
              icon:
                TrendingUp,
            },
            {
              label:
                "People Involved",
              value:
                stats.people,
              icon:
                Users,
            },
          ].map(
            (card) => {
              const Icon =
                card.icon;

              return (
                <div
                  key={
                    card.label
                  }
                  className="rounded-[22px] border border-[#dce3ef] bg-white p-5 shadow-[0_8px_25px_rgba(20,42,118,0.05)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e4ebff] text-[#294aad]">
                    <Icon
                      size={19}
                    />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-[#8995aa]">
                    {card.label}
                  </p>

                  <p className="mt-1 text-2xl font-black text-[#182442]">
                    {card.value}
                  </p>
                </div>
              );
            }
          )}
        </div>

        {isLongTerm ? (
          <div className="app-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#294aad]">
                <ChartNoAxesCombined
                  size={21}
                />
              </div>

              <div>
                <h2 className="font-extrabold text-[#182442]">
                  Monthly Expense Comparison
                </h2>

                <p className="mt-1 text-xs text-[#8995aa]">
                  Last 4 months · available for long-term workspaces
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#dfe6f3] bg-[#f8faff] p-4">
              <div className="relative h-56 w-full">
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-[#d8e1f0]" />
                <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-[#e2e8f2]" />
                <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-[#e2e8f2]" />
                <div className="absolute inset-x-0 bottom-0 border-t border-[#d8e1f0]" />

                <svg
                  viewBox="0 0 100 70"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-[180px] w-full overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="monthlyLineFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#3d63d2"
                        stopOpacity="0.22"
                      />
                      <stop
                        offset="100%"
                        stopColor="#3d63d2"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  {monthlyData.length > 1 && (
                    <>
                      <path
                        d={`M ${monthlyData
                          .map((item, index) => {
                            const x =
                              monthlyData.length === 1
                                ? 50
                                : (index / (monthlyData.length - 1)) * 100;

                            const y =
                              65 -
                              (Number(item.amount || 0) /
                                Math.max(maxMonthly, 1)) *
                                55;

                            return `${x} ${y}`;
                          })
                          .join(" L ")} L 100 70 L 0 70 Z`}
                        fill="url(#monthlyLineFill)"
                      />

                      <polyline
                        points={monthlyData
                          .map((item, index) => {
                            const x =
                              monthlyData.length === 1
                                ? 50
                                : (index / (monthlyData.length - 1)) * 100;

                            const y =
                              65 -
                              (Number(item.amount || 0) /
                                Math.max(maxMonthly, 1)) *
                                55;

                            return `${x},${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#294aad"
                        strokeWidth="2.8"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {monthlyData.map((item, index) => {
                    const x =
                      monthlyData.length === 1
                        ? 50
                        : (index / (monthlyData.length - 1)) * 100;

                    const y =
                      65 -
                      (Number(item.amount || 0) /
                        Math.max(maxMonthly, 1)) *
                        55;

                    return (
                      <circle
                        key={item.key}
                        cx={x}
                        cy={y}
                        r="2.4"
                        fill="#ffffff"
                        stroke="#294aad"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-x-0 top-[185px] grid grid-cols-4 gap-2">
                  {monthlyData.map((item) => (
                    <div
                      key={item.key}
                      className="text-center"
                    >
                      <p className="text-[10px] font-black text-[#294aad] sm:text-xs">
                        ₱
                        {Number(item.amount || 0).toLocaleString(
                          "en-PH",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </p>

                      <p className="mt-1 text-[10px] font-extrabold text-[#71809a] sm:text-xs">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#bfcbea] bg-[#f5f8ff] p-5">
            <p className="font-extrabold text-[#294aad]">
              Monthly analytics is hidden for temporary workspaces.
            </p>

            <p className="mt-1 text-xs leading-5 text-[#71809a]">
              Create or use a long-term workspace when you want month-to-month spending comparisons.
            </p>
          </div>
        )}

        <div className="app-card overflow-hidden">
          <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Award
                  size={21}
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100/70">
                  Top Coverers
                </p>

                <h2 className="text-xl font-extrabold">
                  Who Covered the Most
                </h2>

                <p className="mt-1 text-xs text-blue-100/70">
                  Total amount each person has covered in this workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {topCoverers.length ===
            0 ? (
              <div className="rounded-2xl bg-[#eef2f8] p-7 text-center">
                <UserRound
                  size={30}
                  className="mx-auto text-[#9ba6b9]"
                />

                <p className="mt-3 text-sm font-bold text-[#71809a]">
                  No covered expenses yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* TOP PERSON */}
                <div className="relative overflow-hidden rounded-[24px] border border-[#c9d6fb] bg-gradient-to-br from-[#eef3ff] via-white to-[#e7edff] p-5 shadow-[0_14px_35px_rgba(20,42,118,0.08)] sm:p-6">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#294aad]/10" />
                  <div className="pointer-events-none absolute -bottom-14 right-16 h-28 w-28 rounded-full bg-[#3d63d2]/10" />

                  <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative shrink-0">
                      {topCoverers[0]
                        .photoURL ? (
                        <img
                          src={
                            topCoverers[0]
                              .photoURL
                          }
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-20 w-20 rounded-[24px] object-cover ring-4 ring-white shadow-md sm:h-24 sm:w-24"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#294aad] text-3xl font-black uppercase text-white ring-4 ring-white shadow-md sm:h-24 sm:w-24">
                          {String(
                            topCoverers[0]
                              .name ||
                              "?"
                          )
                            .trim()
                            .charAt(0)}
                        </div>
                      )}

                      <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#f4c24f] text-[#6b4a00] shadow">
                        <Award
                          size={16}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="inline-flex rounded-full bg-[#142a76] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">
                        #1 Top Coverer
                      </div>

                      <p className="mt-2 truncate text-2xl font-black text-[#182442] sm:text-3xl">
                        {
                          topCoverers[0]
                            .name
                        }
                      </p>

                      {topCoverers[0]
                        .username && (
                        <p className="mt-1 text-xs font-bold text-[#71809a]">
                          @
                          {
                            topCoverers[0]
                              .username
                          }
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8995aa]">
                            Total Covered
                          </p>

                          <p className="mt-1 text-xl font-black text-[#142a76]">
                            ₱
                            {money(
                              topCoverers[0]
                                .totalCovered
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8995aa]">
                            Expenses
                          </p>

                          <p className="mt-1 text-xl font-black text-[#182442]">
                            {
                              topCoverers[0]
                                .expenseCount
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EVERYONE ELSE */}
                {topCoverers.length >
                  1 && (
                  <div>
                    <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#8995aa]">
                      Other Coverers
                    </p>

                    <div className="space-y-2">
                      {topCoverers
                        .slice(1)
                        .map(
                          (
                            person,
                            index
                          ) => (
                            <div
                              key={
                                person.key
                              }
                              className="flex items-center gap-3 rounded-2xl border border-[#e0e6ef] bg-[#f8faff] p-3 sm:p-4"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e4ebff] text-xs font-black text-[#294aad]">
                                #
                                {
                                  index +
                                  2
                                }
                              </div>

                              {person.photoURL ? (
                                <img
                                  src={
                                    person.photoURL
                                  }
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="h-11 w-11 shrink-0 rounded-2xl object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dfe8ff] font-extrabold uppercase text-[#294aad]">
                                  {String(
                                    person.name ||
                                      "?"
                                  )
                                    .trim()
                                    .charAt(
                                      0
                                    )}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-extrabold text-[#182442]">
                                  {
                                    person.name
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-[#8995aa]">
                                  {
                                    person.expenseCount
                                  }{" "}
                                  {person.expenseCount ===
                                  1
                                    ? "expense"
                                    : "expenses"}{" "}
                                  covered
                                </p>
                              </div>

                              <p className="shrink-0 text-right font-black text-[#142a76]">
                                ₱
                                {money(
                                  person.totalCovered
                                )}
                              </p>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="app-card p-5 sm:p-6">
          <h2 className="font-extrabold text-[#182442]">
            Spending by Category
          </h2>

          <p className="mt-1 text-xs text-[#8995aa]">
            See which categories take the largest share.
          </p>

          <div className="mt-5 space-y-3">
            {categoryData.length ===
            0 ? (
              <p className="rounded-xl bg-[#eef2f8] p-4 text-sm font-bold text-[#8995aa]">
                Add expenses to see category insights.
              </p>
            ) : (
              categoryData
                .slice(0, 6)
                .map(
                  (item) => {
                    const max =
                      categoryData[0]
                        ?.amount ||
                      1;

                    return (
                      <div
                        key={
                          item.name
                        }
                      >
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-bold text-[#52617d]">
                            {item.name}
                          </span>

                          <span className="font-extrabold text-[#182442]">
                            ₱
                            {money(
                              item.amount
                            )}
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf1f7]">
                          <div
                            className="h-full rounded-full bg-[#294aad]"
                            style={{
                              width: `${Math.max(
                                (
                                  item.amount /
                                  max
                                ) *
                                  100,
                                4
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )
            )}
          </div>
        </div>

        <div className="app-card overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setShowFeedback(
                (current) =>
                  !current
              )
            }
            className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4d9] text-[#b78114]">
                <Star
                  size={21}
                />
              </div>

              <div>
                <h3 className="font-extrabold text-[#182442]">
                  Rate Money Splitter
                </h3>

                <p className="mt-1 text-xs text-[#8995aa]">
                  Click 1–5 stars and leave feedback
                </p>
              </div>
            </div>

            {showFeedback ? (
              <ChevronDown
                size={18}
              />
            ) : (
              <ChevronRight
                size={18}
              />
            )}
          </button>

          {showFeedback && (
            <div className="border-t border-[#e3e8f0] p-5 sm:p-6">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={
                        star
                      }
                      type="button"
                      onClick={() =>
                        setRating(
                          star
                        )
                      }
                      className={`rounded-xl p-2 transition ${
                        rating >=
                        star
                          ? "bg-[#fff4d9] text-[#e2a51e]"
                          : "text-[#c6ceda] hover:bg-[#f5f7fb]"
                      }`}
                    >
                      <Star
                        size={28}
                        fill={
                          rating >=
                          star
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  )
                )}
              </div>

              <textarea
                value={
                  feedbackText
                }
                onChange={(
                  event
                ) =>
                  setFeedbackText(
                    event.target
                      .value
                  )
                }
                className="mt-4 min-h-28 w-full rounded-2xl border border-[#dce3ef] bg-[#f8faff] p-4 text-sm outline-none focus:border-[#294aad]"
                placeholder="Tell us what you like or what should improve..."
              />

              <button
                type="button"
                disabled={
                  sending
                }
                onClick={
                  submitFeedback
                }
                className="mt-3 min-h-11 w-full rounded-xl bg-[#142a76] text-sm font-extrabold text-white disabled:opacity-50"
              >
                {sending
                  ? "Submitting..."
                  : "Submit Feedback"}
              </button>
            </div>
          )}
        </div>
      </section>

      <Dialog />
    </>
  );
}

export default Dashboard;
