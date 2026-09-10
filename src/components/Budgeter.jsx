import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  Save,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase.js";
import useAppDialog from "../hooks/useAppDialog.jsx";

const categories = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills",
  "Travel",
  "Entertainment",
  "Health",
  "Savings",
  "Other",
];

const money = (value) =>
  Number(value || 0).toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

const dateValue = (value) => {
  if (!value) return new Date();

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime()
  )
    ? new Date()
    : parsed;
};

const monthKeyFromDate = (
  date
) =>
  `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;

const todayInput = () => {
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

const safeId = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function Budgeter({
  user,
  profile,
  onSwitchApp,
  onSignOut,
}) {
  const [
    page,
    setPage,
  ] = useState(
    "dashboard"
  );

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    budgets,
    setBudgets,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    savingTransaction,
    setSavingTransaction,
  ] = useState(false);

  const [
    savingBudget,
    setSavingBudget,
  ] = useState(false);

  const [
    feedbackRating,
    setFeedbackRating,
  ] = useState(0);

  const [
    feedbackText,
    setFeedbackText,
  ] = useState("");

  const [
    sendingFeedback,
    setSendingFeedback,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    type,
    setType,
  ] = useState(
    "expense"
  );

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState(
    "Food"
  );

  const [
    note,
    setNote,
  ] = useState("");

  const [
    transactionDate,
    setTransactionDate,
  ] = useState(
    todayInput()
  );

  const [
    budgetCategory,
    setBudgetCategory,
  ] = useState(
    "Food"
  );

  const [
    budgetLimit,
    setBudgetLimit,
  ] = useState("");

  const [
    showBudgetForm,
    setShowBudgetForm,
  ] = useState(false);

  const [
    editingBudget,
    setEditingBudget,
  ] = useState(null);

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    monthKeyFromDate(
      new Date()
    )
  );

  const {
    Dialog,
    success,
    warning,
    error,
    confirm,
  } = useAppDialog();

  const transactionsRef =
    user?.uid
      ? collection(
          db,
          "users",
          user.uid,
          "budgetTransactions"
        )
      : null;

  const budgetsRef =
    user?.uid
      ? collection(
          db,
          "users",
          user.uid,
          "budgets"
        )
      : null;

  const loadBudgeter =
    async () => {
      if (!user?.uid) {
        setTransactions([]);
        setBudgets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [
          transactionSnapshot,
          budgetSnapshot,
        ] =
          await Promise.all([
            getDocs(
              collection(
                db,
                "users",
                user.uid,
                "budgetTransactions"
              )
            ),
            getDocs(
              collection(
                db,
                "users",
                user.uid,
                "budgets"
              )
            ),
          ]);

        const loadedTransactions =
          transactionSnapshot.docs
            .map((item) => ({
              id:
                item.id,
              ...item.data(),
            }))
            .sort(
              (a, b) =>
                dateValue(
                  b.date ||
                    b.createdAt
                ) -
                dateValue(
                  a.date ||
                    a.createdAt
                )
            );

        const loadedBudgets =
          budgetSnapshot.docs.map(
            (item) => ({
              id:
                item.id,
              ...item.data(),
            })
          );

        setTransactions(
          loadedTransactions
        );

        setBudgets(
          loadedBudgets
        );
      } catch (err) {
        console.error(
          "Personal Finance loading error:",
          err
        );

        await error(
          "Unable to Load Personal Finance",
          "Please check your Firestore rules and internet connection."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadBudgeter();
  }, [user?.uid]);

  const currentMonth =
    monthKeyFromDate(
      new Date()
    );

  const monthTransactions =
    useMemo(
      () =>
        transactions.filter(
          (item) => {
            const key =
              item.monthKey ||
              monthKeyFromDate(
                dateValue(
                  item.date ||
                    item.createdAt
                )
              );

            return (
              key ===
              currentMonth
            );
          }
        ),
      [
        transactions,
        currentMonth,
      ]
    );

  const stats =
    useMemo(() => {
      const allIncome =
        transactions
          .filter(
            (item) =>
              item.type ===
              "income"
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount ||
                  0
              ),
            0
          );

      const allExpenses =
        transactions
          .filter(
            (item) =>
              item.type ===
              "expense"
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount ||
                  0
              ),
            0
          );

      const monthIncome =
        monthTransactions
          .filter(
            (item) =>
              item.type ===
              "income"
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount ||
                  0
              ),
            0
          );

      const monthExpenses =
        monthTransactions
          .filter(
            (item) =>
              item.type ===
              "expense"
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount ||
                  0
              ),
            0
          );

      return {
        balance:
          allIncome -
          allExpenses,
        monthIncome,
        monthExpenses,
        monthRemaining:
          monthIncome -
          monthExpenses,
      };
    }, [
      transactions,
      monthTransactions,
    ]);

  const categorySpending =
    useMemo(() => {
      const map = {};

      monthTransactions
        .filter(
          (item) =>
            item.type ===
            "expense"
        )
        .forEach((item) => {
          const key =
            item.category ||
            "Other";

          map[key] =
            Number(
              map[key] ||
                0
            ) +
            Number(
              item.amount ||
                0
            );
        });

      return Object.entries(
        map
      )
        .map(
          ([
            name,
            value,
          ]) => ({
            name,
            value,
          })
        )
        .sort(
          (a, b) =>
            b.value -
            a.value
        );
    }, [
      monthTransactions,
    ]);

  const currentBudgets =
    useMemo(
      () =>
        budgets
          .filter(
            (item) =>
              item.monthKey ===
              currentMonth
          )
          .sort(
            (a, b) =>
              String(
                a.category ||
                  ""
              ).localeCompare(
                String(
                  b.category ||
                    ""
                )
              )
          ),
      [
        budgets,
        currentMonth,
      ]
    );

  const totalBudget =
    currentBudgets.reduce(
      (sum, item) =>
        sum +
        Number(
          item.limit ||
            0
        ),
      0
    );

  const selectedMonthTransactions =
    useMemo(
      () =>
        transactions.filter(
          (item) => {
            const key =
              item.monthKey ||
              monthKeyFromDate(
                dateValue(
                  item.date ||
                    item.createdAt
                )
              );

            return (
              key ===
              selectedMonth
            );
          }
        ),
      [
        transactions,
        selectedMonth,
      ]
    );

  const selectedMonthSpending =
    useMemo(() => {
      const map = {};

      selectedMonthTransactions
        .filter(
          (item) =>
            item.type ===
            "expense"
        )
        .forEach((item) => {
          const key =
            item.category ||
            "Other";

          map[key] =
            Number(
              map[key] ||
                0
            ) +
            Number(
              item.amount ||
                0
            );
        });

      return map;
    }, [
      selectedMonthTransactions,
    ]);

  const selectedMonthBudgets =
    useMemo(
      () =>
        budgets
          .filter(
            (item) =>
              item.monthKey ===
              selectedMonth
          )
          .sort(
            (a, b) =>
              String(
                a.category ||
                  ""
              ).localeCompare(
                String(
                  b.category ||
                    ""
                )
              )
          ),
      [
        budgets,
        selectedMonth,
      ]
    );

  const selectedBudgetSummary =
    useMemo(() => {
      const totalLimit =
        selectedMonthBudgets.reduce(
          (sum, item) =>
            sum +
            Number(
              item.limit ||
                0
            ),
          0
        );

      const totalSpent =
        selectedMonthBudgets.reduce(
          (sum, item) =>
            sum +
            Number(
              selectedMonthSpending[
                item.category
              ] ||
                0
            ),
          0
        );

      return {
        totalLimit,
        totalSpent,
        remaining:
          totalLimit -
          totalSpent,
        categoryCount:
          selectedMonthBudgets.length,
      };
    }, [
      selectedMonthBudgets,
      selectedMonthSpending,
    ]);

  const availableBudgetCategories =
    categories.filter(
      (item) =>
        item !==
          "Savings" &&
        !selectedMonthBudgets.some(
          (budget) =>
            budget.category ===
            item
        )
    );

  const beginAddBudget =
    () => {
      const firstAvailable =
        availableBudgetCategories[
          0
        ] ||
        "Food";

      setEditingBudget(
        null
      );

      setBudgetCategory(
        firstAvailable
      );

      setBudgetLimit(
        ""
      );

      setShowBudgetForm(
        true
      );
    };

  const beginEditBudget =
    (budget) => {
      setEditingBudget(
        budget
      );

      setBudgetCategory(
        budget.category
      );

      setBudgetLimit(
        String(
          budget.limit ||
            ""
        )
      );

      setSelectedMonth(
        budget.monthKey ||
          currentMonth
      );

      setShowBudgetForm(
        true
      );

      window.scrollTo({
        top:
          0,
        behavior:
          "smooth",
      });
    };

  const cancelBudgetForm =
    () => {
      setShowBudgetForm(
        false
      );

      setEditingBudget(
        null
      );

      setBudgetLimit(
        ""
      );
    };

  const sixMonthData =
    useMemo(() => {
      const now =
        new Date();

      const rows = [];

      for (
        let offset = 5;
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
          key:
            monthKeyFromDate(
              date
            ),
          label:
            date.toLocaleString(
              "en-PH",
              {
                month:
                  "short",
              }
            ),
          income:
            0,
          expense:
            0,
        });
      }

      transactions.forEach(
        (item) => {
          const key =
            item.monthKey ||
            monthKeyFromDate(
              dateValue(
                item.date ||
                  item.createdAt
              )
            );

          const row =
            rows.find(
              (entry) =>
                entry.key ===
                key
            );

          if (!row) return;

          if (
            item.type ===
            "income"
          ) {
            row.income +=
              Number(
                item.amount ||
                  0
              );
          } else {
            row.expense +=
              Number(
                item.amount ||
                  0
              );
          }
        }
      );

      return rows;
    }, [
      transactions,
    ]);

  const maxSixMonth =
    Math.max(
      ...sixMonthData.flatMap(
        (item) => [
          item.income,
          item.expense,
        ]
      ),
      1
    );

  const saveTransaction =
    async (
      event
    ) => {
      event.preventDefault();

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        await warning(
          "Amount Required",
          "Enter a valid amount greater than zero."
        );
        return;
      }

      if (
        !transactionDate
      ) {
        await warning(
          "Date Required",
          "Choose a date for this transaction."
        );
        return;
      }

      try {
        setSavingTransaction(
          true
        );

        const parsedDate =
          new Date(
            `${transactionDate}T12:00:00`
          );

        const payload = {
          type,
          amount:
            Number(
              numericAmount.toFixed(
                2
              )
            ),
          category:
            type ===
            "income"
              ? "Income"
              : category,
          note:
            note.trim(),
          date:
            transactionDate,
          monthKey:
            monthKeyFromDate(
              parsedDate
            ),
          ownerUid:
            user.uid,
          createdAt:
            serverTimestamp(),
        };

        await addDoc(
          transactionsRef,
          payload
        );

        setAmount("");
        setNote("");
        setTransactionDate(
          todayInput()
        );

        await loadBudgeter();

        await success(
          "Transaction Saved",
          type ===
            "income"
            ? "Your income was added."
            : "Your expense was added."
        );
      } catch (err) {
        console.error(
          "Save budget transaction error:",
          err
        );

        await error(
          "Unable to Save",
          "The transaction could not be saved."
        );
      } finally {
        setSavingTransaction(
          false
        );
      }
    };

  const removeTransaction =
    async (
      transaction
    ) => {
      const approved =
        await confirm({
          type:
            "danger",
          title:
            "Delete Transaction?",
          message:
            `Delete ${transaction.note || transaction.category || "this transaction"} for ₱${money(transaction.amount)}?`,
          confirmText:
            "Delete",
        });

      if (!approved) {
        return;
      }

      try {
        setDeletingId(
          transaction.id
        );

        await deleteDoc(
          doc(
            db,
            "users",
            user.uid,
            "budgetTransactions",
            transaction.id
          )
        );

        setTransactions(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                transaction.id
            )
        );
      } catch (err) {
        console.error(
          "Delete transaction error:",
          err
        );

        await error(
          "Unable to Delete",
          "Please try again."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  const saveBudget =
    async (
      event
    ) => {
      event.preventDefault();

      const numericLimit =
        Number(
          budgetLimit
        );

      if (
        !selectedMonth
      ) {
        await warning(
          "Month Required",
          "Choose the month for this budget."
        );
        return;
      }

      if (
        !budgetCategory
      ) {
        await warning(
          "Category Required",
          "Choose a category for this budget."
        );
        return;
      }

      if (
        !Number.isFinite(
          numericLimit
        ) ||
        numericLimit <= 0
      ) {
        await warning(
          "Budget Required",
          "Enter a valid monthly limit greater than zero."
        );
        return;
      }

      const duplicate =
        selectedMonthBudgets.find(
          (item) =>
            item.category ===
              budgetCategory &&
            item.id !==
              editingBudget?.id
        );

      if (duplicate) {
        await warning(
          "Category Already Added",
          `${budgetCategory} already has a limit for ${selectedMonth}. Use Edit Limit instead.`
        );
        return;
      }

      try {
        setSavingBudget(
          true
        );

        const id =
          editingBudget?.id ||
          `${selectedMonth}-${safeId(
            budgetCategory
          )}`;

        await setDoc(
          doc(
            db,
            "users",
            user.uid,
            "budgets",
            id
          ),
          {
            category:
              budgetCategory,
            limit:
              Number(
                numericLimit.toFixed(
                  2
                )
              ),
            monthKey:
              selectedMonth,
            ownerUid:
              user.uid,
            updatedAt:
              serverTimestamp(),
          },
          {
            merge:
              true,
          }
        );

        const wasEditing =
          Boolean(
            editingBudget
          );

        setBudgetLimit(
          ""
        );

        setEditingBudget(
          null
        );

        setShowBudgetForm(
          false
        );

        await loadBudgeter();

        await success(
          wasEditing
            ? "Budget Updated"
            : "Budget Added",
          wasEditing
            ? `${budgetCategory} is now limited to ₱${money(numericLimit)} for ${selectedMonth}.`
            : `${budgetCategory} budget was created with a ₱${money(numericLimit)} monthly limit.`
        );
      } catch (err) {
        console.error(
          "Save budget error:",
          err
        );

        await error(
          "Unable to Save Budget",
          "Please try again."
        );
      } finally {
        setSavingBudget(
          false
        );
      }
    };

  const removeBudget =
    async (
      budget
    ) => {
      const approved =
        await confirm({
          type:
            "danger",
          title:
            "Remove Budget?",
          message:
            `Remove the ${budget.category} budget for ${budget.monthKey}?`,
          confirmText:
            "Remove",
        });

      if (!approved) {
        return;
      }

      try {
        setDeletingId(
          budget.id
        );

        await deleteDoc(
          doc(
            db,
            "users",
            user.uid,
            "budgets",
            budget.id
          )
        );

        setBudgets(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                budget.id
            )
        );
      } catch (err) {
        console.error(
          "Delete budget error:",
          err
        );

        await error(
          "Unable to Remove Budget",
          "Please try again."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  const navItems = [
    {
      id:
        "dashboard",
      label:
        "Overview",
      icon:
        LayoutDashboard,
    },
    {
      id:
        "transactions",
      label:
        "Transactions",
      icon:
        ReceiptText,
    },
    {
      id:
        "budgets",
      label:
        "Budgets",
      icon:
        Target,
    },
  ];

  const changePage =
    (nextPage) => {
      setPage(
        nextPage
      );

      window.scrollTo({
        top:
          0,
        behavior:
          "smooth",
      });
    };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#eaf0fa] px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#142a76] text-white">
            <LoaderCircle
              size={30}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 font-extrabold text-[#182442]">
            Loading Personal Finance...
          </p>
        </div>
      </div>
    );
  }

  const submitPersonalFinanceFeedback =
    async () => {
      if (
        feedbackRating < 1 ||
        feedbackRating > 5
      ) {
        await warning(
          "Choose a Rating",
          "Select 1 to 5 stars before submitting your feedback."
        );
        return;
      }

      try {
        setSendingFeedback(
          true
        );

        await addDoc(
          collection(
            db,
            "feedback"
          ),
          {
            rating:
              feedbackRating,
            message:
              feedbackText.trim(),
            source:
              "Personal Finance",
            appSource:
              "personal-finance",
            appName:
              "Personal Finance",
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
              null,
            serverName:
              "",
            createdAt:
              serverTimestamp(),
          }
        );

        setFeedbackRating(
          0
        );
        setFeedbackText(
          ""
        );

        await success(
          "Feedback Submitted",
          "Thank you for rating Personal Finance."
        );
      } catch (err) {
        console.error(
          "Personal Finance feedback error:",
          err
        );

        await error(
          "Unable to Submit Feedback",
          "Please check your Firestore rules and try again."
        );
      } finally {
        setSendingFeedback(
          false
        );
      }
    };

  const OverviewPage =
    () => (
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#10245f] via-[#1b378e] to-[#3d63d2] p-6 text-white shadow-[0_20px_50px_rgba(20,42,118,0.18)] sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 animate-pulse" />
          <div className="pointer-events-none absolute right-20 top-8 h-3 w-3 rounded-full bg-white/40 animate-pulse" />
          <div className="pointer-events-none absolute bottom-7 right-10 h-20 w-20 rounded-full border border-white/15 animate-pulse" />
          <div className="pointer-events-none absolute bottom-4 right-28 h-8 w-8 rounded-full border border-white/10 animate-pulse" />
          <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-24 rounded-full bg-white/5 blur-xl animate-pulse" />

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100/65">
              Personal Budget
            </p>

            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              Hi, {profile?.displayName || user?.displayName || "there"}!
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/78">
              Keep an eye on your income, spending, and monthly limits in one place.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <span className="h-1.5 w-10 rounded-full bg-white/55 animate-pulse" />
              <span className="h-1.5 w-5 rounded-full bg-white/30 animate-pulse" />
              <span className="h-1.5 w-2 rounded-full bg-white/20 animate-pulse" />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label:
                "Current Balance",
              value:
                `₱${money(stats.balance)}`,
              icon:
                WalletCards,
            },
            {
              label:
                "Income This Month",
              value:
                `₱${money(stats.monthIncome)}`,
              icon:
                TrendingUp,
            },
            {
              label:
                "Expenses This Month",
              value:
                `₱${money(stats.monthExpenses)}`,
              icon:
                TrendingDown,
            },
            {
              label:
                "Remaining This Month",
              value:
                `₱${money(stats.monthRemaining)}`,
              icon:
                PiggyBank,
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
                  className="app-card p-4 sm:p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#294aad]">
                    <Icon
                      size={20}
                    />
                  </div>

                  <p className="mt-4 text-xs font-bold text-[#8995aa]">
                    {card.label}
                  </p>

                  <p className="mt-1 break-words text-xl font-black text-[#182442]">
                    {card.value}
                  </p>
                </div>
              );
            }
          )}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="app-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Last 6 months
                </p>

                <h3 className="mt-1 text-xl font-black text-[#182442]">
                  Income vs Expenses
                </h3>
              </div>

              <CalendarDays
                size={21}
                className="text-[#294aad]"
              />
            </div>

            <div className="mt-7 flex h-52 items-end justify-between gap-2">
              {sixMonthData.map(
                (item) => (
                  <div
                    key={
                      item.key
                    }
                    className="flex min-w-0 flex-1 flex-col items-center"
                  >
                    <div className="flex h-40 w-full max-w-12 items-end justify-center gap-1">
                      <div
                        title={`Income ₱${money(item.income)}`}
                        className="w-1/2 rounded-t-md bg-[#3d63d2]"
                        style={{
                          height:
                            `${Math.max(
                              item.income
                                ? 8
                                : 2,
                              (
                                item.income /
                                maxSixMonth
                              ) *
                                100
                            )}%`,
                        }}
                      />

                      <div
                        title={`Expense ₱${money(item.expense)}`}
                        className="w-1/2 rounded-t-md bg-[#c9d4ea]"
                        style={{
                          height:
                            `${Math.max(
                              item.expense
                                ? 8
                                : 2,
                              (
                                item.expense /
                                maxSixMonth
                              ) *
                                100
                            )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-[10px] font-extrabold uppercase text-[#8995aa]">
                      {item.label}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-[#71809a]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3d63d2]" />
                Income
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c9d4ea]" />
                Expenses
              </span>
            </div>
          </div>

          <div className="app-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#294aad]">
                <Target
                  size={20}
                />
              </div>

              <div>
                <h3 className="font-black text-[#182442]">
                  Monthly Budget
                </h3>

                <p className="text-xs text-[#8995aa]">
                  {currentMonth}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#eef3ff] p-4">
              <p className="text-xs font-bold text-[#71809a]">
                Total category budgets
              </p>

              <p className="mt-1 text-2xl font-black text-[#142a76]">
                ₱{money(totalBudget)}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {currentBudgets.length ===
              0 ? (
                <p className="rounded-2xl bg-[#f7f9fd] p-4 text-sm text-[#8995aa]">
                  No budgets set for this month yet.
                </p>
              ) : (
                currentBudgets
                  .slice(
                    0,
                    4
                  )
                  .map(
                    (budget) => {
                      const spent =
                        Number(
                          categorySpending.find(
                            (item) =>
                              item.name ===
                              budget.category
                          )?.value ||
                            0
                        );

                      const limit =
                        Number(
                          budget.limit ||
                            0
                        );

                      const percentage =
                        limit > 0
                          ? Math.min(
                              (
                                spent /
                                limit
                              ) *
                                100,
                              100
                            )
                          : 0;

                      return (
                        <div
                          key={
                            budget.id
                          }
                        >
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-extrabold text-[#52617d]">
                              {budget.category}
                            </span>

                            <span className="font-bold text-[#8995aa]">
                              ₱{money(spent)} / ₱{money(limit)}
                            </span>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2e7f0]">
                            <div
                              className={`h-full rounded-full ${
                                percentage >=
                                100
                                  ? "bg-[#cf4646]"
                                  : percentage >=
                                    80
                                  ? "bg-[#d59b2c]"
                                  : "bg-[#3d63d2]"
                              }`}
                              style={{
                                width:
                                  `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                changePage(
                  "budgets"
                )
              }
              className="mt-5 min-h-11 w-full rounded-xl bg-[#eef3ff] text-sm font-extrabold text-[#294aad]"
            >
              Manage Budgets
            </button>
          </div>
        </section>

        <section className="app-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                This month
              </p>

              <h3 className="mt-1 text-xl font-black text-[#182442]">
                Spending by Category
              </h3>
            </div>

            <CircleDollarSign
              size={21}
              className="text-[#294aad]"
            />
          </div>

          <div className="mt-5 space-y-3">
            {categorySpending.length ===
            0 ? (
              <p className="rounded-2xl bg-[#f7f9fd] p-5 text-sm text-[#8995aa]">
                Add an expense to see your spending breakdown.
              </p>
            ) : (
              categorySpending.map(
                (item) => {
                  const percentage =
                    stats.monthExpenses >
                    0
                      ? (
                          item.value /
                          stats.monthExpenses
                        ) *
                        100
                      : 0;

                  return (
                    <div
                      key={
                        item.name
                      }
                      className="rounded-2xl bg-[#f7f9fd] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-extrabold text-[#52617d]">
                          {item.name}
                        </p>

                        <p className="font-black text-[#182442]">
                          ₱{money(item.value)}
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e2e7f0]">
                        <div
                          className="h-full rounded-full bg-[#3d63d2]"
                          style={{
                            width:
                              `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        <section className="app-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[#182442]">
              Recent Transactions
            </h3>

            <button
              type="button"
              onClick={() =>
                changePage(
                  "transactions"
                )
              }
              className="text-xs font-extrabold text-[#294aad]"
            >
              View all
            </button>
          </div>

          <TransactionList
            items={
              transactions.slice(
                0,
                5
              )
            }
            deletingId={
              deletingId
            }
            onDelete={
              removeTransaction
            }
          />
        </section>
      </div>
    );

  const TransactionsPage =
    () => (
      <div className="space-y-5">
        <section className="app-card overflow-hidden">
          <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Plus
                  size={22}
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
                  Personal Money
                </p>

                <h2 className="text-xl font-black">
                  Add Transaction
                </h2>
              </div>
            </div>
          </div>

          <form
            onSubmit={
              saveTransaction
            }
            className="space-y-5 p-4 sm:p-6"
          >
            <div>
              <label className="app-label">
                Transaction Type
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setType(
                      "expense"
                    )
                  }
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-extrabold ${
                    type ===
                    "expense"
                      ? "border-[#294aad] bg-[#e4ebff] text-[#142a76]"
                      : "border-[#dce3ef] bg-[#f7f9fd] text-[#71809a]"
                  }`}
                >
                  <ArrowDownCircle
                    size={17}
                  />
                  Expense
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setType(
                      "income"
                    )
                  }
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-extrabold ${
                    type ===
                    "income"
                      ? "border-[#294aad] bg-[#e4ebff] text-[#142a76]"
                      : "border-[#dce3ef] bg-[#f7f9fd] text-[#71809a]"
                  }`}
                >
                  <ArrowUpCircle
                    size={17}
                  />
                  Income
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="app-label">
                  Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    amount
                  }
                  onChange={(
                    event
                  ) =>
                    setAmount(
                      event.target
                        .value
                    )
                  }
                  placeholder="₱0.00"
                  className="app-input"
                />
              </div>

              <div>
                <label className="app-label">
                  Date
                </label>

                <input
                  type="date"
                  value={
                    transactionDate
                  }
                  onChange={(
                    event
                  ) =>
                    setTransactionDate(
                      event.target
                        .value
                    )
                  }
                  className="app-input"
                />
              </div>
            </div>

            {type ===
              "expense" && (
              <div>
                <label className="app-label">
                  Category
                </label>

                <div className="relative">
                  <select
                    value={
                      category
                    }
                    onChange={(
                      event
                    ) =>
                      setCategory(
                        event.target
                          .value
                      )
                    }
                    className="app-input appearance-none pr-12 font-bold text-[#182442] transition focus:border-[#3d63d2] focus:ring-4 focus:ring-[#3d63d2]/10"
                  >
                    {categories.map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef3ff] text-[#294aad]">
                      <ChevronDown
                        size={16}
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="app-label">
                Note
                <span className="ml-1 font-normal text-[#9aa5b6]">
                  (optional)
                </span>
              </label>

              <input
                value={
                  note
                }
                onChange={(
                  event
                ) =>
                  setNote(
                    event.target
                      .value
                  )
                }
                className="app-input"
                placeholder={
                  type ===
                  "income"
                    ? "Salary, freelance..."
                    : "Lunch, groceries..."
                }
              />
            </div>

            <button
              type="submit"
              disabled={
                savingTransaction
              }
              className="app-button-primary flex min-h-12 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingTransaction ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={18}
                />
              )}

              {savingTransaction
                ? "Saving..."
                : "Save Transaction"}
            </button>
          </form>
        </section>

        <section className="app-card p-5 sm:p-6">
          <h3 className="text-xl font-black text-[#182442]">
            Transaction History
          </h3>

          <TransactionList
            items={
              transactions
            }
            deletingId={
              deletingId
            }
            onDelete={
              removeTransaction
            }
          />
        </section>
      </div>
    );

  const BudgetsPage =
    () => (
      <div className="space-y-5">
        <section className="app-card overflow-hidden">
          <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <Target
                    size={22}
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
                    Spending Limits
                  </p>

                  <h2 className="text-xl font-black">
                    Monthly Budgets
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  beginAddBudget
                }
                disabled={
                  availableBudgetCategories.length ===
                    0 &&
                  !editingBudget
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#142a76] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus
                  size={17}
                />
                Add Budget
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#dce3ef] bg-[#f8faff] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Budget Month
                </p>

                <p className="mt-1 text-sm font-bold text-[#52617d]">
                  Choose a month to manage its category limits.
                </p>
              </div>

              <input
                type="month"
                value={
                  selectedMonth
                }
                onChange={(
                  event
                ) => {
                  setSelectedMonth(
                    event.target
                      .value
                  );

                  setShowBudgetForm(
                    false
                  );

                  setEditingBudget(
                    null
                  );

                  setBudgetLimit(
                    ""
                  );
                }}
                className="app-input w-full sm:w-[220px]"
              />
            </div>

            {showBudgetForm && (
              <form
                onSubmit={
                  saveBudget
                }
                className="mt-5 overflow-hidden rounded-[22px] border border-[#cfdaf1] bg-white shadow-[0_14px_34px_rgba(31,53,108,0.08)]"
              >
                <div className="border-b border-[#e3e8f0] bg-[#eef3ff] px-4 py-4 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#71809a]">
                        {editingBudget
                          ? "Edit Budget"
                          : "New Budget"}
                      </p>

                      <h3 className="mt-1 text-lg font-black text-[#182442]">
                        {editingBudget
                          ? `Update ${editingBudget.category} limit`
                          : "Set a monthly spending limit"}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                        {editingBudget
                          ? "Change the amount below. Your existing spending will stay the same."
                          : "Choose a category and set the maximum amount you plan to spend this month."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        cancelBudgetForm
                      }
                      className="shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold text-[#71809a] transition hover:bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  <div>
                    <label className="app-label">
                      Category
                    </label>

                    <div className="relative">
                      <select
                        value={
                          budgetCategory
                        }
                        disabled={
                          Boolean(
                            editingBudget
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          setBudgetCategory(
                            event.target
                              .value
                          )
                        }
                        className="app-input appearance-none pr-12 font-bold text-[#182442] transition focus:border-[#3d63d2] focus:ring-4 focus:ring-[#3d63d2]/10 disabled:cursor-not-allowed disabled:bg-[#eef2f8] disabled:text-[#8995aa]"
                      >
                        {editingBudget ? (
                          <option
                            value={
                              editingBudget.category
                            }
                          >
                            {editingBudget.category}
                          </option>
                        ) : (
                          availableBudgetCategories.map(
                            (item) => (
                              <option
                                key={
                                  item
                                }
                                value={
                                  item
                                }
                              >
                                {item}
                              </option>
                            )
                          )
                        )}
                      </select>

                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          editingBudget
                            ? "bg-[#e1e6ee] text-[#9aa5b6]"
                            : "bg-[#eef3ff] text-[#294aad]"
                        }`}>
                          <ChevronDown
                            size={16}
                            strokeWidth={2.5}
                          />
                        </div>
                      </div>
                    </div>

                    {editingBudget && (
                      <p className="mt-2 text-xs leading-5 text-[#8995aa]">
                        Category is locked while editing. Remove it and add a new category if you need to change the category itself.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="app-label">
                      Monthly Limit
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#8995aa]">
                        ₱
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          budgetLimit
                        }
                        onChange={(
                          event
                        ) =>
                          setBudgetLimit(
                            event.target
                              .value
                          )
                        }
                        placeholder="0.00"
                        className="app-input pl-9"
                        autoFocus
                      />
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[#8995aa]">
                      You can edit this limit anytime. Updating it will not remove past transactions.
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#e3e8f0] p-4 sm:flex sm:justify-end sm:p-5">
                  <button
                    type="submit"
                    disabled={
                      savingBudget
                    }
                    className="app-button-primary flex min-h-12 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[190px]"
                  >
                    {savingBudget ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : editingBudget ? (
                      <Pencil
                        size={17}
                      />
                    ) : (
                      <Plus
                        size={17}
                      />
                    )}

                    {savingBudget
                      ? "Saving..."
                      : editingBudget
                      ? "Update Limit"
                      : "Add Budget"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label:
                "Total Monthly Limit",
              value:
                `₱${money(
                  selectedBudgetSummary.totalLimit
                )}`,
              icon:
                Target,
            },
            {
              label:
                "Budgeted Spending",
              value:
                `₱${money(
                  selectedBudgetSummary.totalSpent
                )}`,
              icon:
                TrendingDown,
            },
            {
              label:
                selectedBudgetSummary.remaining >=
                0
                  ? "Budget Remaining"
                  : "Over Budget",
              value:
                `₱${money(
                  Math.abs(
                    selectedBudgetSummary.remaining
                  )
                )}`,
              icon:
                WalletCards,
            },
            {
              label:
                "Categories",
              value:
                selectedBudgetSummary.categoryCount,
              icon:
                CircleDollarSign,
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
                  className="app-card p-4 sm:p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#294aad]">
                    <Icon
                      size={20}
                    />
                  </div>

                  <p className="mt-4 text-xs font-bold text-[#8995aa]">
                    {card.label}
                  </p>

                  <p className="mt-1 break-words text-xl font-black text-[#182442]">
                    {card.value}
                  </p>
                </div>
              );
            }
          )}
        </section>

        <section className="app-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                {selectedMonth}
              </p>

              <h3 className="mt-1 text-xl font-black text-[#182442]">
                Category Budgets
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#8995aa]">
                Manage each category budget independently and adjust its limit whenever your financial plan changes.
              </p>
            </div>

            {selectedMonthBudgets.length >
              0 &&
              availableBudgetCategories.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    beginAddBudget
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#eef3ff] px-4 text-sm font-extrabold text-[#294aad]"
                >
                  <Plus
                    size={17}
                  />
                  Add Budget
                </button>
              )}
          </div>

          <div className="mt-5 space-y-4">
            {selectedMonthBudgets.length ===
            0 ? (
              <div className="rounded-[22px] border border-dashed border-[#b9c6e5] bg-[#f8faff] p-7 text-center sm:p-9">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4ebff] text-[#294aad]">
                  <Target
                    size={26}
                  />
                </div>

                <h4 className="mt-4 text-lg font-black text-[#182442]">
                  Start with your first category
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8995aa]">
                  For example, set Food to ₱5,000 for the month. You can then add Groceries, Transport, Bills, and other categories separately.
                </p>

                <button
                  type="button"
                  onClick={
                    beginAddBudget
                  }
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-5 text-sm font-black text-white"
                >
                  <Plus
                    size={17}
                  />
                  Add Budget
                </button>
              </div>
            ) : (
              selectedMonthBudgets.map(
                (budget) => {
                  const spent =
                    Number(
                      selectedMonthSpending[
                        budget.category
                      ] ||
                        0
                    );

                  const limit =
                    Number(
                      budget.limit ||
                        0
                    );

                  const percentage =
                    limit > 0
                      ? (
                          spent /
                          limit
                        ) *
                        100
                      : 0;

                  const remaining =
                    limit -
                    spent;

                  const status =
                    percentage >=
                    100
                      ? "Over limit"
                      : percentage >=
                        80
                      ? "Near limit"
                      : "On track";

                  return (
                    <div
                      key={
                        budget.id
                      }
                      className="rounded-[22px] border border-[#e1e7f0] bg-[#fbfcff] p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-black text-[#182442]">
                              {budget.category}
                            </h4>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                                percentage >=
                                100
                                  ? "bg-[#ffeded] text-[#cf4646]"
                                  : percentage >=
                                    80
                                  ? "bg-[#fff3df] text-[#a36b16]"
                                  : "bg-[#e7f6ef] text-[#18845c]"
                              }`}
                            >
                              {status}
                            </span>
                          </div>

                          <p
                            className={`mt-1 text-sm font-bold ${
                              remaining <
                              0
                                ? "text-[#cf4646]"
                                : "text-[#71809a]"
                            }`}
                          >
                            {remaining >=
                            0
                              ? `₱${money(remaining)} remaining`
                              : `₱${money(Math.abs(remaining))} over your limit`}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              beginEditBudget(
                                budget
                              )
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#e4ebff] px-3 text-xs font-extrabold text-[#294aad]"
                          >
                            <Pencil
                              size={15}
                            />
                            Edit Limit
                          </button>

                          <button
                            type="button"
                            title="Remove budget"
                            disabled={
                              deletingId ===
                              budget.id
                            }
                            onClick={() =>
                              removeBudget(
                                budget
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffeded] text-[#cf4646] disabled:opacity-50"
                          >
                            {deletingId ===
                            budget.id ? (
                              <LoaderCircle
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={17}
                              />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8995aa]">
                            Spent
                          </p>

                          <p className="mt-1 font-black text-[#182442]">
                            ₱{money(spent)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8995aa]">
                            Limit
                          </p>

                          <p className="mt-1 font-black text-[#182442]">
                            ₱{money(limit)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8995aa]">
                            Used
                          </p>

                          <p className="mt-1 font-black text-[#182442]">
                            {percentage.toFixed(
                              0
                            )}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e2e7f0]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentage >=
                            100
                              ? "bg-[#cf4646]"
                              : percentage >=
                                80
                              ? "bg-[#d59b2c]"
                              : "bg-[#3d63d2]"
                          }`}
                          style={{
                            width:
                              `${Math.min(
                                percentage,
                                100
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
        </section>

        <section className="app-card overflow-hidden">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff4d9] text-[#b78114]">
                <Star
                  size={21}
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-[#182442]">
                    Rate Personal Finance
                  </h3>

                  <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#294aad]">
                    Personal Finance
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                  Share a quick rating to help improve your personal finance experience.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-1">
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <button
                    key={
                      star
                    }
                    type="button"
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                    onClick={() =>
                      setFeedbackRating(
                        star
                      )
                    }
                    className={`rounded-xl p-2 transition ${
                      feedbackRating >=
                      star
                        ? "bg-[#fff4d9] text-[#e2a51e]"
                        : "text-[#c6ceda] hover:bg-[#f5f7fb]"
                    }`}
                  >
                    <Star
                      size={24}
                      fill={
                        feedbackRating >=
                        star
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                )
              )}
            </div>
          </div>

          <div className="border-t border-[#e3e8f0] p-5 sm:p-6">
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
              className="min-h-24 w-full resize-none rounded-2xl border border-[#dce3ef] bg-[#f8faff] p-4 text-sm text-[#182442] outline-none transition focus:border-[#294aad] focus:ring-4 focus:ring-[#294aad]/10"
              placeholder="Optional feedback..."
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#8995aa]">
                This submission will be tagged as coming from{" "}
                <span className="font-extrabold text-[#294aad]">
                  Personal Finance
                </span>
                .
              </p>

              <button
                type="button"
                disabled={
                  sendingFeedback
                }
                onClick={
                  submitPersonalFinanceFeedback
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-5 text-sm font-extrabold text-white transition hover:bg-[#10245f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingFeedback && (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                )}

                {sendingFeedback
                  ? "Submitting..."
                  : "Submit Feedback"}
              </button>
            </div>
          </div>
        </section>
      </div>
    );

  const renderPage =
    () => {
      if (
        page ===
        "transactions"
      ) {
        return TransactionsPage();
      }

      if (
        page ===
        "budgets"
      ) {
        return BudgetsPage();
      }

      return OverviewPage();
    };

  return (
    <>
      <div className="relative min-h-[100dvh] bg-[#eaf0fa]">
        <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] bg-gradient-to-b from-[#10245f] via-[#142a76] to-[#0c1e5b] p-5 text-white lg:flex lg:flex-col">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-white/12">
              <PiggyBank
                size={27}
              />
            </div>

            <h1 className="mt-4 text-xl font-black">
              Personal Finance
            </h1>

            <p className="mt-1 text-xs text-blue-100/60">
              Personal money,
              simplified
            </p>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map(
              ({
                id,
                label,
                icon:
                  Icon,
              }) => (
                <button
                  key={
                    id
                  }
                  type="button"
                  onClick={() =>
                    changePage(
                      id
                    )
                  }
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-bold transition ${
                    page ===
                    id
                      ? "bg-white text-[#142a76]"
                      : "text-blue-100/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    size={19}
                  />
                  {label}
                </button>
              )
            )}
          </nav>

          <div className="mt-auto space-y-2">
            <button
              type="button"
              onClick={
                onSwitchApp
              }
              className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-white/10 px-4 text-sm font-bold transition hover:bg-white/15"
            >
              <ArrowLeftRight
                size={18}
              />
              Switch App
            </button>

            <button
              type="button"
              onClick={
                onSignOut
              }
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-blue-100 transition hover:bg-white/10"
            >
              <LogOut
                size={18}
              />
              Sign Out
            </button>
          </div>
        </aside>

        <header className="relative z-30 bg-gradient-to-r from-[#10245f] to-[#294aad] px-4 py-4 text-white lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100/60">
                Personal Money
              </p>

              <h1 className="text-xl font-black">
                Personal Finance
              </h1>
            </div>

            <button
              type="button"
              title="Switch app"
              onClick={
                onSwitchApp
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"
            >
              <ArrowLeftRight
                size={20}
              />
            </button>
          </div>
        </header>

        <main className="relative z-10 w-full px-3 py-4 pb-28 sm:px-5 lg:ml-[260px] lg:w-[calc(100%-260px)] lg:px-8 lg:py-8 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            {renderPage()}
          </div>
        </main>

        <nav className="fixed bottom-[max(env(safe-area-inset-bottom),12px)] left-3 right-3 z-50 rounded-[24px] border border-white/70 bg-[#f7f9fd]/92 px-2 py-2 shadow-[0_18px_50px_rgba(20,42,118,0.20)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-3 gap-1">
            {navItems.map(
              ({
                id,
                label,
                icon:
                  Icon,
              }) => (
                <button
                  key={
                    id
                  }
                  type="button"
                  onClick={() =>
                    changePage(
                      id
                    )
                  }
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold ${
                    page ===
                    id
                      ? "bg-[#e4ebff] text-[#142a76]"
                      : "text-[#9ca7b8]"
                  }`}
                >
                  <Icon
                    size={20}
                  />
                  {label}
                </button>
              )
            )}
          </div>
        </nav>
      </div>

      <Dialog />
    </>
  );
}

function TransactionList({
  items,
  deletingId,
  onDelete,
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <p className="mt-5 rounded-2xl bg-[#f7f9fd] p-5 text-sm text-[#8995aa]">
        No transactions yet.
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      {items.map(
        (item) => {
          const income =
            item.type ===
            "income";

          return (
            <div
              key={
                item.id
              }
              className="flex items-center gap-3 rounded-2xl bg-[#f7f9fd] p-4"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  income
                    ? "bg-[#e7f6ef] text-[#18845c]"
                    : "bg-[#eef3ff] text-[#294aad]"
                }`}
              >
                {income ? (
                  <ArrowUpCircle
                    size={20}
                  />
                ) : (
                  <ArrowDownCircle
                    size={20}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-[#182442]">
                  {item.note ||
                    item.category ||
                    (income
                      ? "Income"
                      : "Expense")}
                </p>

                <p className="mt-0.5 text-xs text-[#8995aa]">
                  {item.category} · {item.date || "No date"}
                </p>
              </div>

              <p
                className={`shrink-0 text-right font-black ${
                  income
                    ? "text-[#18845c]"
                    : "text-[#182442]"
                }`}
              >
                {income
                  ? "+"
                  : "-"}
                ₱{money(item.amount)}
              </p>

              <button
                type="button"
                disabled={
                  deletingId ===
                  item.id
                }
                onClick={() =>
                  onDelete(
                    item
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#c85353] hover:bg-[#ffeded] disabled:opacity-50"
              >
                {deletingId ===
                item.id ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={16}
                  />
                )}
              </button>
            </div>
          );
        }
      )}
    </div>
  );
}

export default Budgeter;
