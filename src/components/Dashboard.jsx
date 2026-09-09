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

  const topCategoryNames =
    useMemo(
      () =>
        categoryData
          .slice(0, 3)
          .map(
            (item) =>
              item.name
          ),
      [
        categoryData,
      ]
    );

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

  const weeklyData =
    useMemo(() => {
      const now = new Date();
      const rows = [];

      for (
        let monthOffset = 1;
        monthOffset >= 0;
        monthOffset -= 1
      ) {
        const monthDate = new Date(
          now.getFullYear(),
          now.getMonth() - monthOffset,
          1
        );

        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const daysInMonth = new Date(
          year,
          month + 1,
          0
        ).getDate();

        const weekCount = Math.ceil(
          daysInMonth / 7
        );

        for (
          let weekIndex = 0;
          weekIndex < weekCount;
          weekIndex += 1
        ) {
          const startDay =
            weekIndex * 7 + 1;

          const endDay = Math.min(
            startDay + 6,
            daysInMonth
          );

          const categoryAmounts = {};

          topCategoryNames.forEach(
            (category) => {
              categoryAmounts[
                category
              ] = 0;
            }
          );

          const monthLabel =
            monthDate.toLocaleString(
              "en-PH",
              {
                month: "short",
              }
            );

          rows.push({
            key:
              `${year}-${month}-${weekIndex}`,
            year,
            month,
            weekIndex,
            weekNumber:
              weekIndex + 1,
            weekLabel:
              `W${weekIndex + 1}`,
            monthLabel,
            label:
              `W${weekIndex + 1}`,
            rangeLabel:
              `${startDay}-${endDay}`,
            amount: 0,
            categoryAmounts,
          });
        }
      }

      savedSplits.forEach((split) => {
        const date =
          getDate(split.createdAt);

        if (!date) return;

        const weekIndex =
          Math.floor(
            (date.getDate() - 1) /
              7
          );

        const key =
          `${date.getFullYear()}-${date.getMonth()}-${weekIndex}`;

        const row = rows.find(
          (item) =>
            item.key === key
        );

        if (!row) return;

        const amount = Number(
          split.totalAmount || 0
        );

        row.amount += amount;

        const category =
          split.category || "Other";

        if (
          topCategoryNames.includes(
            category
          )
        ) {
          row.categoryAmounts[
            category
          ] += amount;
        }
      });

      return rows;
    }, [savedSplits, topCategoryNames]);

  const maxWeekly = Math.max(
    ...weeklyData.map(
      (item) => item.amount
    ),
    1
  );

  const currentWeekIndex =
    Math.floor(
      (new Date().getDate() - 1) /
        7
    );

  const currentWeekData =
    weeklyData.find(
      (item) =>
        item.year ===
          new Date().getFullYear() &&
        item.month ===
          new Date().getMonth() &&
        item.weekIndex ===
          currentWeekIndex
    ) ||
    weeklyData[
      weeklyData.length - 1
    ] ||
    null;

  const twoMonthTotal =
    weeklyData.reduce(
      (sum, item) =>
        sum +
        Number(item.amount || 0),
      0
    );

  const twoMonthCategoryTotals =
    topCategoryNames.map(
      (category) => ({
        name: category,
        amount: weeklyData.reduce(
          (sum, item) =>
            sum +
            Number(
              item.categoryAmounts?.[
                category
              ] || 0
            ),
          0
        ),
      })
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
                  Spending Trends & Categories
                </h2>

                <p className="mt-1 text-xs text-[#8995aa]">
                  Weekly spending plus your top categories across the last 2 months
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-[#dbe4f4] bg-gradient-to-b from-white to-[#f7f9ff] p-4 shadow-[0_12px_30px_rgba(20,42,118,0.06)] sm:p-5">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8995aa]">
                    Weekly spending trend
                  </p>

                  <p className="mt-1 text-2xl font-black text-[#182442]">
                    ₱
                    {Number(
                      currentWeekData?.amount ||
                        0
                    ).toLocaleString(
                      "en-PH",
                      {
                        maximumFractionDigits:
                          0,
                      }
                    )}
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#71809a]">
                    Current week · {currentWeekData?.label || ""}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#eef3ff] px-4 py-3 text-right">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#71809a]">
                    2-month total
                  </p>

                  <p className="mt-1 text-sm font-black text-[#294aad]">
                    ₱
                    {twoMonthTotal.toLocaleString(
                      "en-PH",
                      {
                        maximumFractionDigits:
                          0,
                      }
                    )}
                  </p>
                </div>
              </div>

              <div className="w-full overflow-x-auto pb-2">
                <div className="mx-auto min-w-[900px] max-w-[1100px]">
                <div className="mb-4 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-1.5 text-[11px] font-extrabold text-[#294aad]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#294aad]" />
                    Total
                  </div>

                  {topCategoryNames.map(
                    (
                      category,
                      index
                    ) => {
                      const swatches =
                        [
                          "#18845c",
                          "#c47a16",
                          "#8b5cf6",
                        ];

                      return (
                        <div
                          key={
                            category
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-[#f7f9fc] px-3 py-1.5 text-[11px] font-extrabold text-[#52617d]"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                swatches[
                                  index %
                                    swatches.length
                                ],
                            }}
                          />

                          {
                            category
                          }
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="relative h-[325px] w-full">
                  <div className="absolute inset-x-0 top-[18px] border-t border-dashed border-[#dce4f1]" />
                  <div className="absolute inset-x-0 top-[78px] border-t border-dashed border-[#e6ebf4]" />
                  <div className="absolute inset-x-0 top-[138px] border-t border-dashed border-[#e6ebf4]" />
                  <div className="absolute inset-x-0 top-[198px] border-t border-dashed border-[#e6ebf4]" />

                  {(() => {
                    const chartTop =
                      18;
                    const chartBottom =
                      198;
                    const chartHeight =
                      chartBottom -
                      chartTop;

                    const getXPercent =
                      (index) =>
                        weeklyData.length <=
                        1
                          ? 50
                          : ((index +
                              0.5) /
                              weeklyData.length) *
                            100;

                    const getY =
                      (value) =>
                        chartBottom -
                        (Number(
                          value ||
                            0
                        ) /
                          Math.max(
                            maxWeekly,
                            1
                          )) *
                          chartHeight;

                    const totalPoints =
                      weeklyData.map(
                        (
                          item,
                          index
                        ) => ({
                          x:
                            getXPercent(
                              index
                            ),
                          y:
                            getY(
                              item.amount
                            ),
                          value:
                            item.amount,
                          item,
                        })
                      );

                    const categorySeries =
                      topCategoryNames.map(
                        (
                          category,
                          categoryIndex
                        ) => ({
                          category,
                          categoryIndex,
                          points:
                            weeklyData.map(
                              (
                                item,
                                index
                              ) => ({
                                x:
                                  getXPercent(
                                    index
                                  ),
                                y:
                                  getY(
                                    item
                                      .categoryAmounts?.[
                                      category
                                    ] ||
                                      0
                                  ),
                                value:
                                  item
                                    .categoryAmounts?.[
                                    category
                                  ] ||
                                  0,
                                item,
                              })
                            ),
                        })
                      );

                    const toSvg =
                      (points) =>
                        points.map(
                          (
                            point
                          ) => ({
                            x:
                              point.x,
                            y:
                              (point.y /
                                210) *
                              100,
                          })
                        );

                    const buildSmoothPath =
                      (
                        rows
                      ) => {
                        if (
                          rows.length ===
                          0
                        ) {
                          return "";
                        }

                        if (
                          rows.length ===
                          1
                        ) {
                          return `M ${rows[0].x} ${rows[0].y}`;
                        }

                        let path =
                          `M ${rows[0].x} ${rows[0].y}`;

                        for (
                          let index =
                            0;
                          index <
                          rows.length -
                            1;
                          index +=
                          1
                        ) {
                          const current =
                            rows[index];
                          const next =
                            rows[
                              index +
                                1
                            ];

                          const midpoint =
                            (current.x +
                              next.x) /
                            2;

                          path +=
                            ` C ${midpoint} ${current.y}, ${midpoint} ${next.y}, ${next.x} ${next.y}`;
                        }

                        return path;
                      };

                    const totalSvg =
                      toSvg(
                        totalPoints
                      );

                    const totalPath =
                      buildSmoothPath(
                        totalSvg
                      );

                    const bottomY =
                      (chartBottom /
                        210) *
                      100;

                    const areaPath =
                      totalSvg.length >
                      0
                        ? `${totalPath} L ${totalSvg[totalSvg.length - 1].x} ${bottomY} L ${totalSvg[0].x} ${bottomY} Z`
                        : "";

                    const categoryColors =
                      [
                        "#18845c",
                        "#c47a16",
                        "#8b5cf6",
                      ];

                    return (
                      <>
                        <svg
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="absolute inset-x-0 top-0 h-[210px] w-full overflow-visible"
                          role="img"
                          aria-label="Weekly total spending and category spending chart for the last 2 months"
                        >
                          <defs>
                            <linearGradient
                              id="monthlyAreaFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#3d63d2"
                                stopOpacity="0.20"
                              />
                              <stop
                                offset="100%"
                                stopColor="#3d63d2"
                                stopOpacity="0"
                              />
                            </linearGradient>
                          </defs>

                          <path
                            d={
                              areaPath
                            }
                            fill="url(#monthlyAreaFill)"
                          />

                          {categorySeries.map(
                            (
                              series
                            ) => (
                              <path
                                key={
                                  series.category
                                }
                                d={
                                  buildSmoothPath(
                                    toSvg(
                                      series.points
                                    )
                                  )
                                }
                                fill="none"
                                stroke={
                                  categoryColors[
                                    series.categoryIndex %
                                      categoryColors.length
                                  ]
                                }
                                strokeWidth="0.65"
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="3 3"
                              />
                            )
                          )}

                          <path
                            d={
                              totalPath
                            }
                            fill="none"
                            stroke="#294aad"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        {totalPoints.map(
                          (
                            point
                          ) => (
                            <div
                              key={
                                point.item
                                  .key
                              }
                              className="absolute z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#294aad] bg-white shadow-[0_3px_10px_rgba(20,42,118,0.18)]"
                              style={{
                                left:
                                  `${point.x}%`,
                                top:
                                  `${point.y}px`,
                              }}
                            >
                              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#294aad]" />
                            </div>
                          )
                        )}

                        {categorySeries.map(
                          (
                            series
                          ) =>
                            series.points.map(
                              (
                                point
                              ) => (
                                <div
                                  key={`${series.category}-${point.item.key}`}
                                  className="absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
                                  style={{
                                    left:
                                      `${point.x}%`,
                                    top:
                                      `${point.y}px`,
                                    borderColor:
                                      categoryColors[
                                        series.categoryIndex %
                                          categoryColors.length
                                      ],
                                  }}
                                  title={`${series.category}: ₱${Number(
                                    point.value ||
                                      0
                                  ).toLocaleString(
                                    "en-PH",
                                    {
                                      maximumFractionDigits:
                                        0,
                                    }
                                  )}`}
                                />
                              )
                            )
                        )}

                        {totalPoints.map(
                          (
                            point,
                            index
                          ) => (
                            <div
                              key={`${point.item.key}-label`}
                              className="absolute top-[218px] w-[70px] -translate-x-1/2 text-center"
                              style={{
                                left:
                                  `${point.x}%`,
                              }}
                            >
                              <p
                                className={`text-[11px] font-black sm:text-xs ${
                                  index ===
                                  totalPoints.length -
                                    1
                                    ? "text-[#294aad]"
                                    : "text-[#52617d]"
                                }`}
                              >
                                ₱
                                {Number(
                                  point.value ||
                                    0
                                ).toLocaleString(
                                  "en-PH",
                                  {
                                    maximumFractionDigits:
                                      0,
                                  }
                                )}
                              </p>

                              <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-[#c9d5ec]" />

                              <p
                                className={`mt-1 text-[11px] font-black uppercase tracking-[0.08em] sm:text-xs ${
                                  index ===
                                  totalPoints.length -
                                    1
                                    ? "text-[#294aad]"
                                    : "text-[#52617d]"
                                }`}
                              >
                                {point.item.weekLabel}
                              </p>

                            </div>
                          )
                        )}

                        {(() => {
                          const monthGroups = [];

                          totalPoints.forEach(
                            (
                              point,
                              index
                            ) => {
                              const lastGroup =
                                monthGroups[
                                  monthGroups.length -
                                    1
                                ];

                              if (
                                lastGroup &&
                                lastGroup.month ===
                                  point.item
                                    .month &&
                                lastGroup.year ===
                                  point.item
                                    .year
                              ) {
                                lastGroup.endIndex =
                                  index;
                              } else {
                                monthGroups.push(
                                  {
                                    month:
                                      point
                                        .item
                                        .month,
                                    year:
                                      point
                                        .item
                                        .year,
                                    label:
                                      point
                                        .item
                                        .monthLabel,
                                    startIndex:
                                      index,
                                    endIndex:
                                      index,
                                  }
                                );
                              }
                            }
                          );

                          return monthGroups.map(
                            (
                              group
                            ) => {
                              const firstPoint =
                                totalPoints[
                                  group
                                    .startIndex
                                ];

                              const lastPoint =
                                totalPoints[
                                  group
                                    .endIndex
                                ];

                              const firstX =
                                firstPoint?.x ||
                                0;

                              const lastX =
                                lastPoint?.x ||
                                firstX;

                              const centerX =
                                (firstX +
                                  lastX) /
                                2;

                              const groupWidth =
                                Math.max(
                                  lastX -
                                    firstX +
                                    8,
                                  18
                                );

                              return (
                                <div
                                  key={`${group.year}-${group.month}-group`}
                                  className="absolute top-[262px] -translate-x-1/2 text-center"
                                  style={{
                                    left:
                                      `${centerX}%`,
                                    width:
                                      `${groupWidth}%`,
                                  }}
                                >
                                  <div className="relative mb-1 h-3">
                                    <div className="absolute left-0 right-0 top-1.5 h-px bg-[#d7e0ef]" />
                                    <div className="absolute left-0 top-0 h-3 w-px bg-[#d7e0ef]" />
                                    <div className="absolute right-0 top-0 h-3 w-px bg-[#d7e0ef]" />
                                  </div>

                                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7d8ba5] sm:text-xs">
                                    {
                                      group.label
                                    }
                                  </p>
                                </div>
                              );
                            }
                          );
                        })()}
                      </>
                    );
                  })()}
                </div>

                </div>

                {topCategoryNames.length >
                  0 && (
                  <div className="mt-3 rounded-2xl bg-[#f7f9fc] p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8995aa]">
                      Category totals
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {twoMonthCategoryTotals
                        .map(
                          (
                            item,
                            index
                          ) => {
                            const colors =
                              [
                                "#18845c",
                                "#c47a16",
                                "#8b5cf6",
                              ];

                            return (
                              <div
                                key={
                                  item.name
                                }
                                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor:
                                        colors[
                                          index %
                                            colors.length
                                        ],
                                    }}
                                  />

                                  <span className="truncate text-xs font-bold text-[#52617d]">
                                    {
                                      item.name
                                    }
                                  </span>
                                </div>

                                <span className="shrink-0 text-xs font-black text-[#182442]">
                                  ₱
                                  {Number(
                                    item.amount ||
                                      0
                                  ).toLocaleString(
                                    "en-PH",
                                    {
                                      maximumFractionDigits:
                                        0,
                                    }
                                  )}
                                </span>
                              </div>
                            );
                          }
                        )}
                    </div>
                  </div>
                )}
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
