import {
  ArrowRight,
  CircleDollarSign,
  CreditCard,
  LogOut,
  PiggyBank,
  MessageSquareText,
  ReceiptText,
  ShieldCheck,
  Star,
  UsersRound,
  Wrench,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import {
  db,
} from "../firebase.js";

function AppChoice({
  user,
  profile,
  onChooseSplitter,
  onChooseBudgeter,
  onChooseFeedback,
  isSuperAdmin = false,
  maintenanceMode = false,
  maintenanceSaving = false,
  onToggleMaintenance,
  onSignOut,
}) {
  const name =
    profile?.displayName ||
    user?.displayName ||
    "there";

  const [
    feedback,
    setFeedback,
  ] = useState([]);

  const [
    ratingsLoading,
    setRatingsLoading,
  ] = useState(false);

  const [
    feedbackSeenAt,
    setFeedbackSeenAt,
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        "superadmin_feedback_seen_at"
      );

    return saved
      ? Number(saved)
      : 0;
  });

  useEffect(() => {
    if (
      !isSuperAdmin
    ) {
      setFeedback([]);
      return undefined;
    }

    setRatingsLoading(
      true
    );

    const feedbackQuery =
      query(
        collection(
          db,
          "feedback"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        feedbackQuery,
        (snapshot) => {
          setFeedback(
            snapshot.docs.map(
              (item) => ({
                id:
                  item.id,
                ...item.data(),
              })
            )
          );

          setRatingsLoading(
            false
          );
        },
        (err) => {
          console.error(
            "Feedback badge loading error:",
            err
          );

          setFeedback([]);
          setRatingsLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, [
    isSuperAdmin,
  ]);

  const newFeedbackCount =
    useMemo(
      () =>
        feedback.filter(
          (item) => {
            const createdAt =
              item.createdAt;

            const createdMillis =
              typeof createdAt?.toMillis ===
              "function"
                ? createdAt.toMillis()
                : createdAt?.seconds
                  ? createdAt.seconds *
                    1000
                  : 0;

            return (
              createdMillis >
              feedbackSeenAt
            );
          }
        ).length,
      [
        feedback,
        feedbackSeenAt,
      ]
    );

  const openFeedbackCenter =
    () => {
      const now =
        Date.now();

      localStorage.setItem(
        "superadmin_feedback_seen_at",
        String(now)
      );

      setFeedbackSeenAt(
        now
      );

      onChooseFeedback?.();
    };

  const ratingStats =
    useMemo(() => {
      const normalizeSource =
        (item) => {
          const raw =
            String(
              item?.appSource ||
                item?.source ||
                item?.appName ||
                ""
            )
              .trim()
              .toLowerCase();

          if (
            raw.includes(
              "personal"
            ) ||
            raw.includes(
              "budget"
            )
          ) {
            return "personal-finance";
          }

          return "splitter";
        };

      const calculate =
        (source) => {
          const rows =
            feedback.filter(
              (item) =>
                normalizeSource(
                  item
                ) === source &&
                Number(
                  item.rating ||
                    0
                ) > 0
            );

          if (
            rows.length ===
            0
          ) {
            return {
              average:
                null,
              count:
                0,
            };
          }

          const average =
            rows.reduce(
              (
                sum,
                item
              ) =>
                sum +
                Number(
                  item.rating ||
                    0
                ),
              0
            ) /
            rows.length;

          return {
            average,
            count:
              rows.length,
          };
        };

      return {
        splitter:
          calculate(
            "splitter"
          ),
        personalFinance:
          calculate(
            "personal-finance"
          ),
      };
    }, [
      feedback,
    ]);

  const RatingBadge =
    ({
      stats,
      dark = false,
    }) => (
      <div
        className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-extrabold sm:text-xs ${
          dark
            ? "bg-white/12 text-white"
            : "bg-[#fff8e8] text-[#9a6a0a]"
        }`}
      >
        <Star
          size={14}
          fill="currentColor"
        />

        {ratingsLoading
          ? "Loading rating..."
          : stats.average !==
              null
            ? `${stats.average.toFixed(
                1
              )} / 5 · ${stats.count} rating${
                stats.count ===
                1
                  ? ""
                  : "s"
              }`
            : "No ratings yet"}
      </div>
    );

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#eaf0fa] px-3 py-5 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#294aad]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#3d63d2]/10 blur-3xl" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#142a76 1px, transparent 1px), linear-gradient(90deg, #142a76 1px, transparent 1px)",
          backgroundSize:
            "32px 32px",
        }}
      />

      <style>{`
        @keyframes moneyFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        @keyframes moneyPulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50% { opacity: .9; transform: scale(1.08); }
        }

        @keyframes moneyBars {
          0%, 100% { transform: scaleY(.72); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="mb-7 flex items-center justify-between gap-3 sm:mb-8 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10245f] to-[#3d63d2] text-white shadow-[0_14px_35px_rgba(20,42,118,0.24)]">
              <CircleDollarSign size={25} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#71809a]">
                Money Manager
              </p>
              <h1 className="truncate text-xl font-black text-[#182442]">
                Hi, {name}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-sm font-extrabold sm:min-h-11 sm:px-4 text-[#52617d] shadow-sm transition hover:bg-[#f7f9fd]"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </header>

        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#71809a]">
            Choose your space
          </p>
          <h2 className="mt-2 text-[28px] font-black leading-tight text-[#182442] sm:text-4xl">
            What would you like to manage?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71809a] sm:text-base">
            Use Splitter for shared expenses, or Personal Finance to manage your own money.
          </p>
        </div>

        <div className={`grid gap-5 ${isSuperAdmin ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}>
          <button
            type="button"
            onClick={onChooseSplitter}
            className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-[26px] bg-gradient-to-br from-[#10245f] via-[#142a76] to-[#294aad] p-5 text-left text-white shadow-[0_22px_60px_rgba(20,42,118,0.20)] transition hover:-translate-y-1 sm:min-h-[420px] sm:rounded-[28px] sm:p-8 sm:pb-9"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 right-16 h-44 w-44 rounded-full border-[24px] border-white/5" />

            <div
              className="pointer-events-none absolute right-5 top-5 hidden w-32 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur sm:block"
              style={{
                animation:
                  "moneyFloat 5s ease-in-out infinite",
              }}
            >
              <div className="flex items-center gap-2">
                <ReceiptText
                  size={15}
                  className="text-blue-100"
                />
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-100/70">
                  Shared bill
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full rounded-full bg-white/15">
                <div className="h-full w-3/4 rounded-full bg-white/65" />
              </div>

              <div className="mt-2 h-1.5 w-2/3 rounded-full bg-white/15" />
            </div>

            <div className="pointer-events-none absolute bottom-8 right-6 hidden items-end gap-1.5 opacity-60 lg:flex">
              {[16, 28, 20, 36].map(
                (
                  height,
                  index
                ) => (
                  <span
                    key={
                      height
                    }
                    className="w-2 rounded-full bg-white/20"
                    style={{
                      height:
                        `${height}px`,
                      transformOrigin:
                        "bottom",
                      animation:
                        `moneyBars ${2.4 + index * 0.25}s ease-in-out infinite`,
                    }}
                  />
                )
              )}
            </div>

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <UsersRound size={27} />
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.16em] text-blue-100/65">
                Shared Money
              </p>
              <h3 className="mt-1 text-[32px] font-black leading-tight sm:text-3xl">Splitter</h3>
              <p className="mt-4 max-w-[34rem] pr-0 text-sm leading-7 text-blue-100/78 sm:pr-24 xl:pr-12">
                Split bills, track who paid, settle balances, keep receipts, and manage group workspaces.
              </p>

              <div className="mt-auto grid w-full gap-3 pt-10 sm:flex sm:flex-wrap sm:items-center sm:pt-12">
                {isSuperAdmin && (
                  <RatingBadge
                    stats={
                      ratingStats.splitter
                    }
                    dark
                  />
                )}

                <div className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-[#142a76] shadow-sm sm:w-auto">
                  Open Splitter
                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onChooseBudgeter}
            className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-[26px] border border-white bg-white p-5 text-left shadow-[0_22px_60px_rgba(31,53,108,0.12)] transition hover:-translate-y-1 sm:min-h-[420px] sm:rounded-[28px] sm:p-8 sm:pb-9"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#e4ebff]" />

            <div
              className="pointer-events-none absolute right-5 top-5 hidden w-32 rounded-2xl border border-[#dfe6f5] bg-[#f6f8fd] p-3 sm:block"
              style={{
                animation:
                  "moneyFloat 5.5s ease-in-out infinite",
              }}
            >
              <div className="flex items-center justify-between">
                <CreditCard
                  size={16}
                  className="text-[#294aad]"
                />
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#8995aa]">
                  Budget
                </span>
              </div>

              <div className="mt-4 flex items-end gap-1">
                {[18, 30, 24, 38, 28].map(
                  (
                    height,
                    index
                  ) => (
                    <span
                      key={
                        `${height}-${index}`
                      }
                      className="w-2 rounded-full bg-[#294aad]/20"
                      style={{
                        height:
                          `${height}px`,
                        transformOrigin:
                          "bottom",
                        animation:
                          `moneyBars ${2.6 + index * 0.2}s ease-in-out infinite`,
                      }}
                    />
                  )
                )}
              </div>
            </div>

            <div
              className="pointer-events-none absolute bottom-8 right-8 hidden h-12 w-12 items-center justify-center rounded-full border-[4px] border-[#e4ebff] border-r-[#294aad]/45 lg:flex"
              style={{
                animation:
                  "moneyPulse 3.8s ease-in-out infinite",
              }}
            >
              <span className="h-2 w-2 rounded-full bg-[#294aad]" />
            </div>
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#294aad]">
                <PiggyBank size={28} />
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.16em] text-[#8995aa]">
                Personal Money
              </p>
              <h3 className="mt-1 text-3xl font-black text-[#182442]">
                Personal Finance
              </h3>
              <p className="mt-4 max-w-[34rem] pr-0 text-sm leading-7 text-[#71809a] sm:pr-24 xl:pr-12">
                Track income and expenses, manage category budgets, and understand your monthly financial position.
              </p>

              <div className="mt-auto grid w-full gap-3 pt-10 sm:flex sm:flex-wrap sm:items-center sm:pt-12">
                {isSuperAdmin && (
                  <RatingBadge
                    stats={
                      ratingStats.personalFinance
                    }
                  />
                )}

                <div className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#142a76] px-5 py-2.5 text-sm font-black text-white shadow-sm sm:w-auto">
                  Open Personal Finance
                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </div>
            </div>
          </button>

          {isSuperAdmin && (
            <div className={`relative overflow-hidden rounded-[26px] border p-5 shadow-[0_22px_60px_rgba(31,53,108,0.10)] sm:rounded-[28px] sm:p-8 ${
              maintenanceMode
                ? "border-[#efcaca] bg-[#fff7f7]"
                : "border-white bg-white"
            }`}>
              <div className={`absolute -right-14 -top-14 h-40 w-40 rounded-full ${
                maintenanceMode
                  ? "bg-[#ffe5e5]"
                  : "bg-[#eef3ff]"
              }`} />

              <div className="relative z-10">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  maintenanceMode
                    ? "bg-[#ffe8e8] text-[#c84b4b]"
                    : "bg-[#eef3ff] text-[#294aad]"
                }`}>
                  <Wrench
                    size={27}
                  />
                </div>

                <div className="mt-7 flex items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8995aa]">
                    System Control
                  </p>

                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#294aad]">
                    <ShieldCheck
                      size={11}
                    />
                    Super Admin
                  </span>
                </div>

                <h3 className="mt-1 text-3xl font-black text-[#182442]">
                  Maintenance Mode
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-[#71809a]">
                  Temporarily block regular users while you update or repair the system. Super Admin access stays available.
                </p>

                <div className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                  maintenanceMode
                    ? "bg-[#ffe8e8] text-[#b94343]"
                    : "bg-[#e7f7ef] text-[#18845c]"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    maintenanceMode
                      ? "bg-[#cf4646]"
                      : "bg-[#18845c]"
                  }`} />

                  {maintenanceMode
                    ? "Maintenance Active"
                    : "System Live"}
                </div>

                <button
                  type="button"
                  disabled={
                    maintenanceSaving
                  }
                  onClick={
                    onToggleMaintenance
                  }
                  className={`mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
                    maintenanceMode
                      ? "bg-[#18845c] hover:bg-[#136f4e]"
                      : "bg-[#cf4646] hover:bg-[#b94343]"
                  }`}
                >
                  <Wrench
                    size={17}
                  />

                  {maintenanceSaving
                    ? "Updating..."
                    : maintenanceMode
                      ? "Disable Maintenance"
                      : "Enable Maintenance"}
                </button>
              </div>
            </div>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={openFeedbackCenter}
              className="group relative flex min-h-[340px] flex-col overflow-hidden rounded-[26px] border border-white bg-white p-5 text-left shadow-[0_22px_60px_rgba(31,53,108,0.12)] transition hover:-translate-y-1 sm:rounded-[28px] sm:p-8"
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#fff4d9]" />

              <div className="pointer-events-none absolute right-6 top-7 hidden grid-cols-3 gap-1.5 sm:grid">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(
                  (dot) => (
                    <span
                      key={
                        dot
                      }
                      className="h-2 w-2 rounded-sm bg-[#b78114]/20"
                      style={{
                        animation:
                          `moneyPulse ${2.8 + (dot % 3) * 0.35}s ease-in-out infinite`,
                      }}
                    />
                  )
                )}
              </div>

              <div className="relative z-10">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4d9] text-[#b78114]">
                  <MessageSquareText size={28} />

                  {newFeedbackCount >
                    0 && (
                    <span className="absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#d84b4b] px-1.5 text-[10px] font-black leading-none text-white shadow-[0_4px_12px_rgba(216,75,75,0.28)]">
                      {newFeedbackCount >
                      99
                        ? "99+"
                        : newFeedbackCount}
                    </span>
                  )}
                </div>

                <div className="mt-7 flex items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8995aa]">
                    Admin Insights
                  </p>

                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#294aad]">
                    <ShieldCheck size={11} />
                    Super Admin
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-3xl font-black text-[#182442]">
                    Feedback Center
                  </h3>

                  {newFeedbackCount >
                    0 && (
                    <span className="inline-flex items-center rounded-full bg-[#ffe8e8] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#c43f3f]">
                      {newFeedbackCount} New
                    </span>
                  )}
                </div>

                <p className="mt-3 max-w-md text-sm leading-6 text-[#71809a]">
                  Review ratings, compare Splitter and Personal Finance feedback, and monitor user satisfaction.
                </p>

                <div className="mt-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#142a76] px-4 py-3 text-sm font-black text-white sm:w-auto">
                  Open Feedback Center
                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default AppChoice;
