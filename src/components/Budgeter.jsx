import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Activity,
  Building2,
  CalendarDays,
  CreditCard,
  ChevronDown,
  CircleDollarSign,
  Gauge,
  Lightbulb,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  Save,
  Search,
  Star,
  Smartphone,
  X,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
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


const getFinancialCardTheme = (
  provider = "",
  accountType = "bank"
) => {
  const name =
    String(provider)
      .trim()
      .toLowerCase();

  if (
    name.includes("bpi")
  ) {
    return {
      brand:
        "BPI",
      logo:
        "/bank-logos/bpi.png",
      background:
        "linear-gradient(135deg, #7c0a10 0%, #a5111a 48%, #54060b 100%)",
      accent:
        "#f6d36b",
      chip:
        "#e7c468",
      network:
        "VISA",
      watermark:
        "BPI",
    };
  }

  if (
    name.includes("bdo")
  ) {
    return {
      brand:
        "BDO",
      logo:
        "/bank-logos/bdo.svg",
      background:
        "linear-gradient(135deg, #0b4fb0 0%, #0866dc 48%, #0a2f76 100%)",
      accent:
        "#ffffff",
      chip:
        "#dfbd62",
      network:
        "Mastercard",
      watermark:
        "BDO",
    };
  }

  if (
    name.includes("landbank") ||
    name.includes("land bank")
  ) {
    return {
      brand:
        "LANDBANK",
      logo:
        "/bank-logos/landbank.png",
      background:
        "linear-gradient(135deg, #0b5e38 0%, #087342 50%, #11452b 100%)",
      accent:
        "#ffffff",
      chip:
        "#dfbd62",
      network:
        "VISA",
      watermark:
        "LB",
    };
  }

  if (
    name.includes("metrobank")
  ) {
    return {
      brand:
        "Metrobank",
      logo:
        "/bank-logos/metrobank.png",
      background:
        "linear-gradient(135deg, #0f4699 0%, #1d62bd 50%, #0b326f 100%)",
      accent:
        "#ffffff",
      chip:
        "#dec06f",
      network:
        "VISA",
      watermark:
        "MB",
    };
  }

  if (
    name.includes("security bank")
  ) {
    return {
      brand:
        "Security Bank",
      logo:
        "/bank-logos/securitybank.png",
      background:
        "linear-gradient(135deg, #0f63a0 0%, #1594cf 52%, #0a4d79 100%)",
      accent:
        "#ffffff",
      chip:
        "#dcbc68",
      network:
        "Mastercard",
      watermark:
        "SB",
    };
  }

  if (
    name.includes("unionbank") ||
    name.includes("union bank")
  ) {
    return {
      brand:
        "UnionBank",
      logo:
        "/bank-logos/unionbank.png",
      background:
        "linear-gradient(135deg, #2437a8 0%, #5028b7 55%, #251663 100%)",
      accent:
        "#ffffff",
      chip:
        "#dfbd62",
      network:
        "VISA",
      watermark:
        "UB",
    };
  }

  if (
    name.includes("rcbc")
  ) {
    return {
      brand:
        "RCBC",
      logo:
        "/bank-logos/rcbc.png",
      background:
        "linear-gradient(135deg, #08205a 0%, #163f8d 52%, #071944 100%)",
      accent:
        "#f0cf66",
      chip:
        "#ddc06e",
      network:
        "VISA",
      watermark:
        "RCBC",
    };
  }

  if (
    name.includes("chinabank") ||
    name.includes("china bank")
  ) {
    return {
      brand:
        "China Bank",
      logo:
        "/bank-logos/chinabank.png",
      background:
        "linear-gradient(135deg, #8a1e23 0%, #c52f35 50%, #681316 100%)",
      accent:
        "#ffffff",
      chip:
        "#dec169",
      network:
        "Debit",
      watermark:
        "CBC",
    };
  }

  if (
    name.includes("gcash")
  ) {
    return {
      brand:
        "GCash",
      logo:
        "/bank-logos/gcash.png",
      background:
        "linear-gradient(135deg, #0b79ff 0%, #0b57ef 50%, #0a34ba 100%)",
      accent:
        "#ffffff",
      chip:
        "#d7e4ff",
      network:
        "Prepaid",
      watermark:
        "G",
    };
  }

  if (
    name.includes("maya")
  ) {
    return {
      brand:
        "Maya",
      logo:
        "/bank-logos/maya.png",
      background:
        "linear-gradient(135deg, #101418 0%, #0f2026 48%, #0a0d10 100%)",
      accent:
        "#34e2b5",
      chip:
        "#d7c06d",
      network:
        "Prepaid",
      watermark:
        "m",
    };
  }

  if (
    name.includes("gotyme") ||
    name.includes("go tyme")
  ) {
    return {
      brand:
        "GoTyme",
      logo:
        "/bank-logos/gotyme.png",
      background:
        "linear-gradient(135deg, #18212f 0%, #243348 52%, #10151f 100%)",
      accent:
        "#67e8f9",
      chip:
        "#d6bd69",
      network:
        "VISA",
      watermark:
        "GT",
    };
  }

  return {
    brand:
      provider ||
      (accountType ===
      "ewallet"
        ? "E-Wallet"
        : "Bank"),
    logo:
      null,
    background:
      accountType ===
      "ewallet"
        ? "linear-gradient(135deg, #153e7d 0%, #2b63c9 52%, #17295f 100%)"
        : "linear-gradient(135deg, #15295d 0%, #2d4eac 52%, #16255f 100%)",
    accent:
      "#ffffff",
    chip:
      accountType ===
      "ewallet"
        ? "#d7e4ff"
        : "#ddc06a",
    network:
      accountType ===
      "ewallet"
        ? "Prepaid"
        : "Debit",
    watermark:
      String(provider || "BANK")
        .trim()
        .slice(0, 3)
        .toUpperCase(),
  };
};

function FinancialBrandLogo({
  theme,
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  if (
    !theme?.logo ||
    failed
  ) {
    return (
      <p
        className="truncate text-[22px] font-black tracking-tight"
        style={{
          color:
            theme?.accent ||
            "#ffffff",
        }}
      >
        {theme?.brand ||
          "Account"}
      </p>
    );
  }

  return (
    <img
      src={
        theme.logo
      }
      alt={`${theme.brand} logo`}
      className="max-h-8 max-w-[125px] object-contain object-left"
      onError={() =>
        setFailed(true)
      }
    />
  );
}

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
    financialAccounts,
    setFinancialAccounts,
  ] = useState([]);

  const [
    financialAccountEntries,
    setFinancialAccountEntries,
  ] = useState([]);

  const [
    showFinancialAccountForm,
    setShowFinancialAccountForm,
  ] = useState(false);

  const [
    editingFinancialAccount,
    setEditingFinancialAccount,
  ] = useState(null);

  const [
    financialAccountType,
    setFinancialAccountType,
  ] = useState("bank");

  const [
    financialAccountProvider,
    setFinancialAccountProvider,
  ] = useState("");

  const [
    financialAccountNickname,
    setFinancialAccountNickname,
  ] = useState("");

  const [
    financialAccountLast4,
    setFinancialAccountLast4,
  ] = useState("");

  const [
    financialAccountOpeningBalance,
    setFinancialAccountOpeningBalance,
  ] = useState("");

  const [
    financialAccountSaving,
    setFinancialAccountSaving,
  ] = useState(false);

  const [
    selectedFinancialAccount,
    setSelectedFinancialAccount,
  ] = useState(null);

  const [
    accountMoneyAction,
    setAccountMoneyAction,
  ] = useState(null);

  const [
    accountMoneyAmount,
    setAccountMoneyAmount,
  ] = useState("");

  const [
    accountMoneyNote,
    setAccountMoneyNote,
  ] = useState("");

  const [
    accountMoneySaving,
    setAccountMoneySaving,
  ] = useState(false);

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
    editingTransaction,
    setEditingTransaction,
  ] = useState(null);

  const [
    transactionFilter,
    setTransactionFilter,
  ] = useState("all");

  const [
    transactionSearch,
    setTransactionSearch,
  ] = useState("");

  const [
    historyMonth,
    setHistoryMonth,
  ] = useState("all");

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
        setFinancialAccounts([]);
        setFinancialAccountEntries([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [
          transactionSnapshot,
          budgetSnapshot,
          financialAccountSnapshot,
          financialAccountEntrySnapshot,
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
            getDocs(
              collection(
                db,
                "users",
                user.uid,
                "financialAccounts"
              )
            ),
            getDocs(
              collection(
                db,
                "users",
                user.uid,
                "financialAccountEntries"
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

        const loadedFinancialAccounts =
          financialAccountSnapshot.docs
            .map(
              (item) => ({
                id:
                  item.id,
                ...item.data(),
              })
            )
            .sort(
              (
                a,
                b
              ) =>
                Number(
                  b.createdAt?.seconds ||
                    0
                ) -
                Number(
                  a.createdAt?.seconds ||
                    0
                )
            );

        const loadedFinancialAccountEntries =
          financialAccountEntrySnapshot.docs
            .map(
              (item) => ({
                id:
                  item.id,
                ...item.data(),
              })
            )
            .sort(
              (
                a,
                b
              ) =>
                Number(
                  b.createdAt?.seconds ||
                    0
                ) -
                Number(
                  a.createdAt?.seconds ||
                    0
                )
            );

        setTransactions(
          loadedTransactions
        );

        setBudgets(
          loadedBudgets
        );

        setFinancialAccounts(
          loadedFinancialAccounts
        );

        setFinancialAccountEntries(
          loadedFinancialAccountEntries
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

  const previousMonthKey =
    useMemo(() => {
      const now =
        new Date();

      return monthKeyFromDate(
        new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        )
      );
    }, []);

  const previousMonthExpenses =
    useMemo(
      () =>
        transactions
          .filter(
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
                item.type ===
                  "expense" &&
                key ===
                  previousMonthKey
              );
            }
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount ||
                  0
              ),
            0
          ),
      [
        transactions,
        previousMonthKey,
      ]
    );

  const currentBudgetSpent =
    useMemo(
      () =>
        currentBudgets.reduce(
          (sum, item) =>
            sum +
            Number(
              categorySpending.find(
                (entry) =>
                  entry.name ===
                  item.category
              )?.value ||
                0
            ),
          0
        ),
      [
        currentBudgets,
        categorySpending,
      ]
    );

  const budgetUsagePercent =
    totalBudget > 0
      ? Math.round(
          (currentBudgetSpent /
            totalBudget) *
            100
        )
      : 0;

  const savingsRate =
    stats.monthIncome > 0
      ? Math.round(
          (Math.max(
            stats.monthRemaining,
            0
          ) /
            stats.monthIncome) *
            100
        )
      : 0;

  const monthlyHealthScore =
    useMemo(() => {
      let score = 50;

      if (
        stats.monthIncome > 0
      ) {
        const spendingRatio =
          stats.monthExpenses /
          stats.monthIncome;

        if (
          spendingRatio <=
          0.7
        ) {
          score += 25;
        } else if (
          spendingRatio <=
          0.9
        ) {
          score += 15;
        } else if (
          spendingRatio <=
          1
        ) {
          score += 5;
        } else {
          score -= 20;
        }
      }

      if (
        totalBudget > 0
      ) {
        if (
          budgetUsagePercent <=
          80
        ) {
          score += 15;
        } else if (
          budgetUsagePercent <=
          100
        ) {
          score += 5;
        } else {
          score -= 15;
        }
      }

      if (
        stats.monthRemaining >
        0
      ) {
        score += 10;
      } else if (
        stats.monthRemaining <
        0
      ) {
        score -= 10;
      }

      return Math.max(
        0,
        Math.min(
          100,
          Math.round(
            score
          )
        )
      );
    }, [
      stats.monthIncome,
      stats.monthExpenses,
      stats.monthRemaining,
      totalBudget,
      budgetUsagePercent,
    ]);

  const expenseChangePercent =
    previousMonthExpenses > 0
      ? Math.round(
          ((stats.monthExpenses -
            previousMonthExpenses) /
            previousMonthExpenses) *
            100
        )
      : null;

  const topSpendingCategory =
    categorySpending[
      0
    ] ||
    null;

  const recentActivity =
    useMemo(
      () =>
        [...transactions]
          .sort(
            (
              a,
              b
            ) =>
              dateValue(
                b.date ||
                  b.createdAt
              ).getTime() -
              dateValue(
                a.date ||
                  a.createdAt
              ).getTime()
          )
          .slice(
            0,
            5
          ),
      [
        transactions,
      ]
    );

  const smartInsights =
    useMemo(
      () => {
        const insights =
          [];

        if (
          expenseChangePercent !==
          null
        ) {
          if (
            expenseChangePercent >
            0
          ) {
            insights.push(
              `Spending is ${expenseChangePercent}% higher than last month.`
            );
          } else if (
            expenseChangePercent <
            0
          ) {
            insights.push(
              `Spending is ${Math.abs(
                expenseChangePercent
              )}% lower than last month.`
            );
          } else {
            insights.push(
              "Spending is unchanged from last month."
            );
          }
        }

        if (
          topSpendingCategory
        ) {
          insights.push(
            `${topSpendingCategory.name} is your biggest category this month at ₱${money(
              topSpendingCategory.value
            )}.`
          );
        }

        if (
          totalBudget >
          0
        ) {
          insights.push(
            `You have used ${budgetUsagePercent}% of your active monthly category budgets.`
          );
        } else {
          insights.push(
            "Set category budgets to get stronger monthly spending insights."
          );
        }

        return insights.slice(
          0,
          3
        );
      },
      [
        expenseChangePercent,
        topSpendingCategory,
        totalBudget,
        budgetUsagePercent,
      ]
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

  const transactionMonths =
    useMemo(
      () =>
        [
          ...new Set(
            transactions
              .map(
                (item) =>
                  item.monthKey ||
                  monthKeyFromDate(
                    dateValue(
                      item.date ||
                        item.createdAt
                    )
                  )
              )
              .filter(
                Boolean
              )
          ),
        ].sort(
          (
            a,
            b
          ) =>
            b.localeCompare(
              a
            )
        ),
      [
        transactions,
      ]
    );

  const filteredTransactions =
    useMemo(() => {
      const search =
        transactionSearch
          .trim()
          .toLowerCase();

      return transactions.filter(
        (item) => {
          if (
            transactionFilter !==
              "all" &&
            item.type !==
              transactionFilter
          ) {
            return false;
          }

          const itemMonth =
            item.monthKey ||
            monthKeyFromDate(
              dateValue(
                item.date ||
                  item.createdAt
              )
            );

          if (
            historyMonth !==
              "all" &&
            itemMonth !==
              historyMonth
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            item.note,
            item.category,
            item.type,
            item.date,
            item.amount,
          ]
            .filter(
              (
                value
              ) =>
                value !==
                  undefined &&
                value !==
                  null
            )
            .some(
              (value) =>
                String(
                  value
                )
                  .toLowerCase()
                  .includes(
                    search
                  )
            );
        }
      );
    }, [
      transactions,
      transactionFilter,
      transactionSearch,
      historyMonth,
    ]);

  const beginEditTransaction =
    (transaction) => {
      setEditingTransaction(
        transaction
      );

      setType(
        transaction.type ===
          "income"
          ? "income"
          : "expense"
      );

      setAmount(
        String(
          transaction.amount ||
            ""
        )
      );

      setCategory(
        transaction.category ===
          "Income"
          ? "Food"
          : transaction.category ||
              "Other"
      );

      setNote(
        transaction.note ||
          ""
      );

      setTransactionDate(
        transaction.date ||
          todayInput()
      );

      window.scrollTo({
        top:
          0,
        behavior:
          "smooth",
      });
    };

  const cancelTransactionEdit =
    () => {
      setEditingTransaction(
        null
      );
      setAmount("");
      setNote("");
      setCategory("Food");
      setType("expense");
      setTransactionDate(
        todayInput()
      );
    };

  const saveTransaction =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        savingTransaction
      ) {
        return;
      }

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
        numericAmount >
        999999999.99
      ) {
        await warning(
          "Amount Too Large",
          "Enter an amount below ₱1 billion."
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

      const parsedDate =
        new Date(
          `${transactionDate}T12:00:00`
        );

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        await warning(
          "Invalid Date",
          "Choose a valid transaction date."
        );
        return;
      }

      if (
        type ===
          "expense" &&
        !category
      ) {
        await warning(
          "Category Required",
          "Choose a category for this expense."
        );
        return;
      }

      const cleanNote =
        note
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      if (
        cleanNote.length >
        120
      ) {
        await warning(
          "Note Too Long",
          "Keep the transaction note under 120 characters."
        );
        return;
      }

      try {
        setSavingTransaction(
          true
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
            cleanNote,
          date:
            transactionDate,
          monthKey:
            monthKeyFromDate(
              parsedDate
            ),
          ownerUid:
            user.uid,
          updatedAt:
            serverTimestamp(),
        };

        const wasEditing =
          Boolean(
            editingTransaction
          );

        if (
          editingTransaction?.id
        ) {
          await setDoc(
            doc(
              db,
              "users",
              user.uid,
              "budgetTransactions",
              editingTransaction.id
            ),
            payload,
            {
              merge:
                true,
            }
          );
        } else {
          await addDoc(
            transactionsRef,
            {
              ...payload,
              createdAt:
                serverTimestamp(),
            }
          );
        }

        cancelTransactionEdit();

        await loadBudgeter();

        await success(
          wasEditing
            ? "Transaction Updated"
            : "Transaction Saved",
          `${type === "income" ? "Income" : "Expense"} of ₱${money(
            numericAmount
          )} ${wasEditing ? "was updated" : "was recorded"} successfully.`
        );
      } catch (err) {
        console.error(
          "Save personal finance transaction error:",
          err
        );

        await error(
          editingTransaction
            ? "Unable to Update Transaction"
            : "Unable to Save Transaction",
          "The transaction could not be saved. Please try again."
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

        if (
          editingTransaction?.id ===
          transaction.id
        ) {
          cancelTransactionEdit();
        }

        await success(
          "Transaction Deleted",
          "The transaction was removed successfully."
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

        await success(
          "Budget Removed",
          `${budget.category} budget for ${budget.monthKey} was removed.`
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

  const financialAccountSummary =
    useMemo(() => {
      const entryMap = {};

      financialAccountEntries.forEach(
        (entry) => {
          const accountId =
            entry.accountId;

          if (!accountId) {
            return;
          }

          if (!entryMap[accountId]) {
            entryMap[accountId] = {
              deposits:
                0,
              withdrawals:
                0,
              balance:
                0,
              count:
                0,
            };
          }

          const value =
            Number(
              entry.amount ||
                0
            );

          if (
            entry.entryType ===
            "withdrawal"
          ) {
            entryMap[
              accountId
            ].withdrawals +=
              value;

            entryMap[
              accountId
            ].balance -=
              value;
          } else {
            entryMap[
              accountId
            ].deposits +=
              value;

            entryMap[
              accountId
            ].balance +=
              value;
          }

          entryMap[
            accountId
          ].count += 1;
        }
      );

      const accounts =
        financialAccounts.map(
          (account) => {
            const totals =
              entryMap[
                account.id
              ] || {
                deposits:
                  0,
                withdrawals:
                  0,
                balance:
                  0,
                count:
                  0,
              };

            return {
              ...account,
              ...totals,
            };
          }
        );

      return {
        accounts,
        totalBalance:
          accounts.reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.balance ||
                  0
              ),
            0
          ),
        totalAdded:
          accounts.reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.deposits ||
                  0
              ),
            0
          ),
      };
    }, [
      financialAccounts,
      financialAccountEntries,
    ]);

  const beginAddFinancialAccount =
    () => {
      setEditingFinancialAccount(
        null
      );
      setFinancialAccountType(
        "bank"
      );
      setFinancialAccountProvider(
        ""
      );
      setFinancialAccountNickname(
        ""
      );
      setFinancialAccountLast4(
        ""
      );
      setFinancialAccountOpeningBalance(
        ""
      );
      setShowFinancialAccountForm(
        true
      );
    };

  const beginEditFinancialAccount =
    (
      account
    ) => {
      setSelectedFinancialAccount(
        null
      );

      setEditingFinancialAccount(
        account
      );
      setFinancialAccountType(
        account.accountType ||
          "bank"
      );
      setFinancialAccountProvider(
        account.provider ||
          ""
      );
      setFinancialAccountNickname(
        account.nickname ||
          ""
      );
      setFinancialAccountLast4(
        account.last4 ||
          ""
      );
      setFinancialAccountOpeningBalance(
        ""
      );
      setShowFinancialAccountForm(
        true
      );

      window.scrollTo({
        top:
          0,
        behavior:
          "smooth",
      });
    };

  const cancelFinancialAccountForm =
    () => {
      setEditingFinancialAccount(
        null
      );
      setFinancialAccountType(
        "bank"
      );
      setFinancialAccountProvider(
        ""
      );
      setFinancialAccountNickname(
        ""
      );
      setFinancialAccountLast4(
        ""
      );
      setFinancialAccountOpeningBalance(
        ""
      );
      setShowFinancialAccountForm(
        false
      );
    };

  const saveFinancialAccount =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        financialAccountSaving
      ) {
        return;
      }

      const provider =
        financialAccountProvider
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const nickname =
        financialAccountNickname
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const last4 =
        financialAccountLast4
          .replace(
            /\D/g,
            ""
          )
          .slice(
            -4
          );

      const openingBalance =
        Number(
          financialAccountOpeningBalance ||
            0
        );

      if (!provider) {
        await warning(
          financialAccountType ===
            "bank"
            ? "Bank Name Required"
            : "E-Wallet Required",
          financialAccountType ===
            "bank"
            ? "Enter the bank name."
            : "Enter the e-wallet provider."
        );
        return;
      }

      if (
        financialAccountLast4 &&
        last4.length !==
          4
      ) {
        await warning(
          "Use Last 4 Digits",
          "For privacy, enter only the last 4 digits of the account, wallet number, or physical card."
        );
        return;
      }

      if (
        !editingFinancialAccount &&
        (
          !Number.isFinite(
            openingBalance
          ) ||
          openingBalance <
            0
        )
      ) {
        await warning(
          "Invalid Opening Balance",
          "Opening balance must be zero or greater."
        );
        return;
      }

      try {
        setFinancialAccountSaving(
          true
        );

        const payload = {
          accountType:
            financialAccountType,
          provider,
          nickname,
          last4,
          ownerUid:
            user.uid,
          updatedAt:
            serverTimestamp(),
        };

        if (
          editingFinancialAccount?.id
        ) {
          await setDoc(
            doc(
              db,
              "users",
              user.uid,
              "financialAccounts",
              editingFinancialAccount.id
            ),
            payload,
            {
              merge:
                true,
            }
          );

          await success(
            "Account Updated",
            `${nickname || provider} was updated successfully.`
          );
        } else {
          const accountRef =
            await addDoc(
              collection(
                db,
                "users",
                user.uid,
                "financialAccounts"
              ),
              {
                ...payload,
                createdAt:
                  serverTimestamp(),
              }
            );

          if (
            openingBalance >
            0
          ) {
            await addDoc(
              collection(
                db,
                "users",
                user.uid,
                "financialAccountEntries"
              ),
              {
                accountId:
                  accountRef.id,
                entryType:
                  "deposit",
                amount:
                  Number(
                    openingBalance.toFixed(
                      2
                    )
                  ),
                note:
                  "Opening balance",
                ownerUid:
                  user.uid,
                createdAt:
                  serverTimestamp(),
              }
            );
          }

          await success(
            "Account Added",
            `${nickname || provider} was added to your savings accounts.`
          );
        }

        cancelFinancialAccountForm();
        await loadBudgeter();
      } catch (err) {
        console.error(
          "Financial account save error:",
          err
        );

        await error(
          "Unable to Save Account",
          "Please check your Firestore rules and try again."
        );
      } finally {
        setFinancialAccountSaving(
          false
        );
      }
    };

  const removeFinancialAccount =
    async (
      account
    ) => {
      setSelectedFinancialAccount(
        null
      );

      const approved =
        await confirm({
          type:
            "danger",
          title:
            `Remove ${account.nickname || account.provider}?`,
          message:
            "This removes the account card and its saved deposit/withdrawal history from Personal Finance.",
          confirmText:
            "Remove Account",
        });

      if (!approved) {
        return;
      }

      try {
        const relatedEntries =
          financialAccountEntries.filter(
            (entry) =>
              entry.accountId ===
              account.id
          );

        await Promise.all([
          ...relatedEntries.map(
            (entry) =>
              deleteDoc(
                doc(
                  db,
                  "users",
                  user.uid,
                  "financialAccountEntries",
                  entry.id
                )
              )
          ),
          deleteDoc(
            doc(
              db,
              "users",
              user.uid,
              "financialAccounts",
              account.id
            )
          ),
        ]);

        await loadBudgeter();

        await success(
          "Account Removed",
          `${account.nickname || account.provider} was removed.`
        );
      } catch (err) {
        console.error(
          "Financial account delete error:",
          err
        );

        await error(
          "Unable to Remove Account",
          "Please try again."
        );
      }
    };

  const openAccountMoneyAction =
    (
      account,
      entryType
    ) => {
      setSelectedFinancialAccount(
        null
      );

      setAccountMoneyAction({
        account,
        entryType,
      });
      setAccountMoneyAmount(
        ""
      );
      setAccountMoneyNote(
        ""
      );

      window.scrollTo({
        top:
          0,
        behavior:
          "smooth",
      });
    };

  const saveAccountMoneyEntry =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !accountMoneyAction ||
        accountMoneySaving
      ) {
        return;
      }

      const numericAmount =
        Number(
          accountMoneyAmount
        );

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <=
          0
      ) {
        await warning(
          "Amount Required",
          "Enter an amount greater than zero."
        );
        return;
      }

      const account =
        financialAccountSummary.accounts.find(
          (item) =>
            item.id ===
            accountMoneyAction
              .account.id
        );

      if (
        accountMoneyAction.entryType ===
          "withdrawal" &&
        numericAmount >
          Number(
            account?.balance ||
              0
          )
      ) {
        await warning(
          "Insufficient Saved Balance",
          `You currently have ₱${money(
            account?.balance ||
              0
          )} tracked in this account.`
        );
        return;
      }

      try {
        setAccountMoneySaving(
          true
        );

        await addDoc(
          collection(
            db,
            "users",
            user.uid,
            "financialAccountEntries"
          ),
          {
            accountId:
              accountMoneyAction
                .account.id,
            entryType:
              accountMoneyAction
                .entryType,
            amount:
              Number(
                numericAmount.toFixed(
                  2
                )
              ),
            note:
              accountMoneyNote
                .trim()
                .replace(
                  /\s+/g,
                  " "
                ),
            ownerUid:
              user.uid,
            createdAt:
              serverTimestamp(),
          }
        );

        await loadBudgeter();

        await success(
          accountMoneyAction.entryType ===
            "deposit"
            ? "Savings Added"
            : "Withdrawal Recorded",
          `${accountMoneyAction.entryType === "deposit" ? "₱" : "₱"}${money(
            numericAmount
          )} was ${
            accountMoneyAction.entryType ===
            "deposit"
              ? "added to"
              : "deducted from"
          } ${
            accountMoneyAction.account
              .nickname ||
            accountMoneyAction.account
              .provider
          }.`
        );

        setAccountMoneyAction(
          null
        );
        setAccountMoneyAmount(
          ""
        );
        setAccountMoneyNote(
          ""
        );
      } catch (err) {
        console.error(
          "Financial account entry error:",
          err
        );

        await error(
          "Unable to Update Savings",
          "Please check your Firestore rules and try again."
        );
      } finally {
        setAccountMoneySaving(
          false
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
    {
      id:
        "savings",
      label:
        "Savings",
      icon:
        CreditCard,
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
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />

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

        <button
          type="button"
          onClick={() =>
            changePage(
              "savings"
            )
          }
          className="app-card group flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 sm:p-5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#18845c]">
            <CreditCard
              size={22}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
              Bank & Wallet Savings
            </p>

            <p className="mt-1 text-lg font-black text-[#182442]">
              ₱{money(
                financialAccountSummary.totalBalance
              )}
            </p>

            <p className="mt-0.5 text-xs text-[#8995aa]">
              {
                financialAccountSummary.accounts.length
              } tracked account{
                financialAccountSummary.accounts.length ===
                1
                  ? ""
                  : "s"
              }
            </p>
          </div>

          <span className="shrink-0 text-xs font-extrabold text-[#294aad]">
            View
          </span>
        </button>


        <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="app-card overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
                    <Gauge
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                      Monthly Health Score
                    </p>

                    <h3 className="mt-1 text-xl font-black text-[#182442]">
                      Financial Health
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-[#142a76]">
                    {monthlyHealthScore}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                    out of 100
                  </p>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#edf1f7]">
                <div
                  className="h-full rounded-full bg-[#294aad] transition-all"
                  style={{
                    width:
                      `${monthlyHealthScore}%`,
                  }}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f8faff] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8995aa]">
                    Savings Rate
                  </p>
                  <p className="mt-1 text-lg font-black text-[#182442]">
                    {savingsRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8faff] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8995aa]">
                    Budget Used
                  </p>
                  <p className="mt-1 text-lg font-black text-[#182442]">
                    {totalBudget > 0
                      ? `${budgetUsagePercent}%`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="app-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4d9] text-[#b78114]">
                <Lightbulb
                  size={21}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Smart Insights
                </p>

                <h3 className="mt-1 text-xl font-black text-[#182442]">
                  What stands out this month
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {smartInsights.map(
                (
                  insight,
                  index
                ) => (
                  <div
                    key={
                      insight
                    }
                    className="flex gap-3 rounded-2xl border border-[#e3e8f0] bg-[#f9fbff] p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-xs font-black text-[#294aad]">
                      {index + 1}
                    </div>

                    <p className="text-sm font-bold leading-6 text-[#52617d]">
                      {insight}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section className="app-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
                <Zap
                  size={21}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Quick Actions
                </p>

                <h3 className="mt-1 text-xl font-black text-[#182442]">
                  Jump straight into your next task
                </h3>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setType(
                    "expense"
                  );
                  changePage(
                    "transactions"
                  );
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-4 text-sm font-extrabold text-white transition hover:bg-[#10245f]"
              >
                <TrendingDown
                  size={17}
                />
                Add Expense
              </button>

              <button
                type="button"
                onClick={() => {
                  setType(
                    "income"
                  );
                  changePage(
                    "transactions"
                  );
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8e0ef] bg-white px-4 text-sm font-extrabold text-[#294aad] transition hover:bg-[#f7f9ff]"
              >
                <TrendingUp
                  size={17}
                />
                Add Income
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(
                    currentMonth
                  );
                  setShowBudgetForm(
                    true
                  );
                  setEditingBudget(
                    null
                  );
                  changePage(
                    "budgets"
                  );
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8e0ef] bg-white px-4 text-sm font-extrabold text-[#52617d] transition hover:bg-[#f7f9ff]"
              >
                <Target
                  size={17}
                />
                Set Budget
              </button>
            </div>
          </div>
        </section>

        <section className="app-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
                <Activity
                  size={21}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Activity Feed
                </p>

                <h3 className="mt-1 text-xl font-black text-[#182442]">
                  Latest money activity
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                changePage(
                  "transactions"
                )
              }
              className="text-xs font-black text-[#294aad] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="mt-5 divide-y divide-[#e7ebf2]">
            {recentActivity.length ===
            0 ? (
              <div className="py-8 text-center">
                <ReceiptText
                  size={28}
                  className="mx-auto text-[#b3bdcc]"
                />
                <p className="mt-3 text-sm font-bold text-[#71809a]">
                  Your recent transactions will appear here.
                </p>
              </div>
            ) : (
              recentActivity.map(
                (item) => {
                  const isIncome =
                    item.type ===
                    "income";

                  return (
                    <div
                      key={
                        item.id
                      }
                      className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isIncome
                          ? "bg-[#e8f7ef] text-[#18845c]"
                          : "bg-[#fff1ed] text-[#c65d3a]"
                      }`}>
                        {isIncome ? (
                          <ArrowUpCircle
                            size={19}
                          />
                        ) : (
                          <ArrowDownCircle
                            size={19}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[#182442]">
                          {item.note?.trim() ||
                            item.category ||
                            (isIncome
                              ? "Income"
                              : "Expense")}
                        </p>

                        <p className="mt-0.5 text-xs text-[#8995aa]">
                          {item.category ||
                            "Other"}{" "}
                          ·{" "}
                          {dateValue(
                            item.date ||
                              item.createdAt
                          ).toLocaleDateString(
                            "en-PH",
                            {
                              month:
                                "short",
                              day:
                                "numeric",
                            }
                          )}
                        </p>
                      </div>

                      <p className={`shrink-0 text-sm font-black ${
                        isIncome
                          ? "text-[#18845c]"
                          : "text-[#182442]"
                      }`}>
                        {isIncome
                          ? "+"
                          : "-"}₱
                        {money(
                          item.amount
                        )}
                      </p>
                    </div>
                  );
                }
              )
            )}
          </div>
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
        <section className="app-card w-full min-w-0 max-w-full overflow-hidden">
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
                  {editingTransaction
                    ? "Edit Transaction"
                    : "Add Transaction"}
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

            <div className="grid min-w-0 grid-cols-1 gap-4 min-[480px]:grid-cols-2">
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
                  className="app-input w-full min-w-0 max-w-full box-border"
                  inputMode="decimal"
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
                  className="app-input w-full min-w-0 max-w-full box-border [color-scheme:light]"
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
                    className="app-input w-full min-w-0 max-w-full appearance-none box-border pl-3 !pr-14 font-bold text-[#182442] transition focus:border-[#3d63d2] focus:ring-4 focus:ring-[#3d63d2]/10"
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

                  <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef3ff] text-[#294aad]">
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
                maxLength={120}
                className="app-input w-full min-w-0 max-w-full box-border"
                placeholder={
                  type ===
                  "income"
                    ? "Salary, freelance..."
                    : "Lunch, groceries..."
                }
              />
            </div>

            <div
              className={`grid gap-2 ${
                editingTransaction
                  ? "sm:grid-cols-[1fr_auto]"
                  : "grid-cols-1"
              }`}
            >
              <button
                type="submit"
                disabled={
                  savingTransaction
                }
                className="app-button-primary flex min-h-12 w-full min-w-0 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                  : editingTransaction
                    ? "Update Transaction"
                    : "Save Transaction"}
              </button>

              {editingTransaction && (
                <button
                  type="button"
                  disabled={
                    savingTransaction
                  }
                  onClick={
                    cancelTransactionEdit
                  }
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#dce3ef] bg-[#f7f9fd] px-5 text-sm font-extrabold text-[#52617d]"
                >
                  <X
                    size={17}
                  />
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="app-card w-full min-w-0 max-w-full overflow-hidden p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                Activity
              </p>

              <h3 className="mt-1 text-xl font-black text-[#182442]">
                Transaction History
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#8995aa]">
                Search, filter, edit, or remove your recorded transactions.
              </p>
            </div>

            <div className="w-full min-w-0 lg:w-auto lg:min-w-[520px]">
              {/* Search always gets its own full row on mobile.
                  This prevents 3 large fields from being squeezed horizontally. */}
              <div className="relative min-w-0">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-11 items-center justify-center text-[#8995aa]">
                  <Search
                    size={16}
                    strokeWidth={2.2}
                  />
                </div>

                <input
                  value={
                    transactionSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setTransactionSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search"
                  className="app-input h-11 w-full min-w-0 max-w-full box-border !pl-11 pr-3 text-sm"
                />
              </div>

              {/* Filters stay side-by-side only when there is enough room. */}
              <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                <div className="relative min-w-0">
                  <select
                    value={
                      transactionFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setTransactionFilter(
                        event.target
                          .value
                      )
                    }
                    className="app-input h-11 w-full min-w-0 max-w-full appearance-none box-border truncate pl-3 !pr-11 text-[12px] font-bold sm:text-sm"
                  >
                    <option value="all">
                      All types
                    </option>
                    <option value="expense">
                      Expenses
                    </option>
                    <option value="income">
                      Income
                    </option>
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center text-[#8995aa]">
                    <ChevronDown
                      size={15}
                      strokeWidth={2.2}
                    />
                  </div>
                </div>

                <div className="relative min-w-0">
                  <select
                    value={
                      historyMonth
                    }
                    onChange={(
                      event
                    ) =>
                      setHistoryMonth(
                        event.target
                          .value
                      )
                    }
                    className="app-input h-11 w-full min-w-0 max-w-full appearance-none box-border truncate pl-3 !pr-11 text-[12px] font-bold sm:text-sm"
                  >
                    <option value="all">
                      All months
                    </option>

                    {transactionMonths.map(
                      (
                        month
                      ) => (
                        <option
                          key={
                            month
                          }
                          value={
                            month
                          }
                        >
                          {new Date(
                            `${month}-01T12:00:00`
                          ).toLocaleString(
                            "en-PH",
                            {
                              month:
                                "short",
                              year:
                                "numeric",
                            }
                          )}
                        </option>
                      )
                    )}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center text-[#8995aa]">
                    <ChevronDown
                      size={15}
                      strokeWidth={2.2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f7f9fd] px-3 py-2">
            <p className="text-xs font-bold text-[#71809a]">
              Showing{" "}
              <span className="font-black text-[#182442]">
                {
                  filteredTransactions.length
                }
              </span>{" "}
              of{" "}
              {
                transactions.length
              }
            </p>

            {(transactionSearch ||
              transactionFilter !==
                "all" ||
              historyMonth !==
                "all") && (
              <button
                type="button"
                onClick={() => {
                  setTransactionSearch(
                    ""
                  );
                  setTransactionFilter(
                    "all"
                  );
                  setHistoryMonth(
                    "all"
                  );
                }}
                className="text-xs font-extrabold text-[#294aad]"
              >
                Clear filters
              </button>
            )}
          </div>

          <TransactionList
            items={
              filteredTransactions
            }
            deletingId={
              deletingId
            }
            editingId={
              editingTransaction?.id ||
              null
            }
            onEdit={
              beginEditTransaction
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
                className="app-input w-full min-w-0 max-w-full box-border [color-scheme:light] sm:w-[220px]"
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
                        className="app-input w-full min-w-0 max-w-full appearance-none box-border pl-3 !pr-14 font-bold text-[#182442] transition focus:border-[#3d63d2] focus:ring-4 focus:ring-[#3d63d2]/10 disabled:cursor-not-allowed disabled:bg-[#eef2f8] disabled:text-[#8995aa]"
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

                      <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex items-center">
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
                      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-11 items-center justify-center text-sm font-black text-[#8995aa]">
                        ₱
                      </div>

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
                        className="app-input w-full min-w-0 max-w-full box-border !pl-11 pr-3"
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

  const SavingsPage =
    () => (
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[30px] border border-[#dbe3f0] bg-white p-5 shadow-[0_18px_45px_rgba(24,45,93,0.08)] sm:p-7">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#eef3ff]" />
          <div className="absolute -bottom-20 right-24 h-32 w-32 rounded-full border-[20px] border-[#f4f7fd]" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a97ad]">
                Savings Accounts
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#17213d] sm:text-3xl">
                Banks & E-Wallets
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#72809a]">
                Track money you keep across bank accounts and e-wallets without mixing it into your expense history.
              </p>
            </div>

            <button
              type="button"
              onClick={
                beginAddFinancialAccount
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(20,42,118,0.20)] transition hover:-translate-y-0.5"
            >
              <Plus
                size={17}
              />
              Add Account
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="app-card p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
              Total Savings
            </p>
            <p className="mt-2 text-2xl font-black text-[#182442]">
              ₱{money(
                financialAccountSummary.totalBalance
              )}
            </p>
          </div>

          <div className="app-card p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
              Total Added
            </p>
            <p className="mt-2 text-2xl font-black text-[#18845c]">
              ₱{money(
                financialAccountSummary.totalAdded
              )}
            </p>
          </div>

          <div className="app-card p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
              Accounts
            </p>
            <p className="mt-2 text-2xl font-black text-[#182442]">
              {
                financialAccountSummary.accounts.length
              }
            </p>
          </div>
        </section>

        {showFinancialAccountForm && (
          <section className="app-card overflow-hidden">
            <div className="border-b border-[#e2e7ef] bg-[#f8faff] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                    {editingFinancialAccount
                      ? "Edit Account"
                      : "New Savings Account"}
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[#182442]">
                    {editingFinancialAccount
                      ? "Update account details"
                      : "Add a bank or e-wallet"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={
                    cancelFinancialAccountForm
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf1f7] text-[#71809a]"
                >
                  <X
                    size={17}
                  />
                </button>
              </div>
            </div>

            <form
              onSubmit={
                saveFinancialAccount
              }
              className="space-y-4 p-4 sm:p-6"
            >
              <div>
                <label className="app-label">
                  Account Type
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFinancialAccountType(
                        "bank"
                      )
                    }
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-extrabold ${
                      financialAccountType ===
                      "bank"
                        ? "border-[#294aad] bg-[#e4ebff] text-[#142a76]"
                        : "border-[#dce3ef] bg-[#f7f9fd] text-[#71809a]"
                    }`}
                  >
                    <Building2
                      size={17}
                    />
                    Bank
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFinancialAccountType(
                        "ewallet"
                      )
                    }
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-extrabold ${
                      financialAccountType ===
                      "ewallet"
                        ? "border-[#294aad] bg-[#e4ebff] text-[#142a76]"
                        : "border-[#dce3ef] bg-[#f7f9fd] text-[#71809a]"
                    }`}
                  >
                    <Smartphone
                      size={17}
                    />
                    E-Wallet
                  </button>
                </div>
              </div>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="app-label">
                    {financialAccountType ===
                    "bank"
                      ? "Bank Name"
                      : "E-Wallet Provider"}
                  </label>

                  <input
                    value={
                      financialAccountProvider
                    }
                    onChange={(
                      event
                    ) =>
                      setFinancialAccountProvider(
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      financialAccountType ===
                      "bank"
                        ? "e.g. BPI, BDO, Maya Bank"
                        : "e.g. GCash, Maya, GoTyme"
                    }
                    maxLength={40}
                    className="app-input"
                  />
                </div>

                <div className="min-w-0">
                  <label className="app-label">
                    Account Nickname
                  </label>

                  <input
                    value={
                      financialAccountNickname
                    }
                    onChange={(
                      event
                    ) =>
                      setFinancialAccountNickname(
                        event.target
                          .value
                      )
                    }
                    placeholder="e.g. Emergency Fund"
                    maxLength={40}
                    className="app-input"
                  />
                </div>
              </div>

              <div className={`grid min-w-0 gap-4 ${
                editingFinancialAccount
                  ? "grid-cols-1"
                  : "sm:grid-cols-2"
              }`}>
                <div className="min-w-0">
                  <label className="app-label">
                    Last 4 Digits
                  </label>

                  <input
                    value={
                      financialAccountLast4
                    }
                    onChange={(
                      event
                    ) =>
                      setFinancialAccountLast4(
                        event.target
                          .value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            4
                          )
                      )
                    }
                    placeholder="1234"
                    inputMode="numeric"
                    maxLength={4}
                    className="app-input"
                  />

                  <p className="mt-1.5 text-[11px] leading-5 text-[#8995aa]">
                    For privacy, save only the last 4 digits of the account, wallet number, or physical card.
                  </p>
                </div>

                {!editingFinancialAccount && (
                  <div className="min-w-0">
                    <label className="app-label">
                      Opening Balance
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        financialAccountOpeningBalance
                      }
                      onChange={(
                        event
                      ) =>
                        setFinancialAccountOpeningBalance(
                          event.target
                            .value
                        )
                      }
                      placeholder="₱0.00"
                      inputMode="decimal"
                      className="app-input"
                    />

                    <p className="mt-1.5 text-[11px] leading-5 text-[#8995aa]">
                      Optional. This becomes the first savings entry.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    cancelFinancialAccountForm
                  }
                  className="min-h-11 rounded-xl border border-[#dce3ef] bg-[#f7f9fd] px-4 text-sm font-extrabold text-[#71809a]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    financialAccountSaving
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-5 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  {financialAccountSaving ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={17}
                    />
                  )}

                  {editingFinancialAccount
                    ? "Update Account"
                    : "Save Account"}
                </button>
              </div>
            </form>
          </section>
        )}

        {accountMoneyAction && (
          <section className="app-card overflow-hidden">
            <div className="border-b border-[#e2e7ef] bg-[#f8faff] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                    {accountMoneyAction.entryType ===
                    "deposit"
                      ? "Add Savings"
                      : "Record Withdrawal"}
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[#182442]">
                    {accountMoneyAction
                      .account
                      .nickname ||
                      accountMoneyAction
                        .account
                        .provider}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAccountMoneyAction(
                      null
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf1f7] text-[#71809a]"
                >
                  <X
                    size={17}
                  />
                </button>
              </div>
            </div>

            <form
              onSubmit={
                saveAccountMoneyEntry
              }
              className="grid gap-4 p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end sm:p-6"
            >
              <div className="min-w-0">
                <label className="app-label">
                  Amount
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    accountMoneyAmount
                  }
                  onChange={(
                    event
                  ) =>
                    setAccountMoneyAmount(
                      event.target
                        .value
                    )
                  }
                  placeholder="₱0.00"
                  inputMode="decimal"
                  className="app-input"
                />
              </div>

              <div className="min-w-0">
                <label className="app-label">
                  Note
                </label>

                <input
                  value={
                    accountMoneyNote
                  }
                  onChange={(
                    event
                  ) =>
                    setAccountMoneyNote(
                      event.target
                        .value
                    )
                  }
                  placeholder="Optional note"
                  maxLength={80}
                  className="app-input"
                />
              </div>

              <button
                type="submit"
                disabled={
                  accountMoneySaving
                }
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold text-white disabled:opacity-50 ${
                  accountMoneyAction.entryType ===
                  "deposit"
                    ? "bg-[#18845c]"
                    : "bg-[#142a76]"
                }`}
              >
                {accountMoneySaving && (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                )}

                {accountMoneyAction.entryType ===
                "deposit"
                  ? "Add Money"
                  : "Record Withdrawal"}
              </button>
            </form>
          </section>
        )}

        {financialAccountSummary.accounts.length ===
        0 ? (
          <section className="app-card p-6 text-center sm:p-9">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#294aad]">
              <CreditCard
                size={25}
              />
            </div>

            <h3 className="mt-4 text-lg font-black text-[#182442]">
              No savings accounts yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8995aa]">
              Add a bank or e-wallet to track how much money you have saved there.
            </p>

            <button
              type="button"
              onClick={
                beginAddFinancialAccount
              }
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#142a76] px-5 text-sm font-extrabold text-white"
            >
              <Plus
                size={17}
              />
              Add First Account
            </button>
          </section>
        ) : (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                  Your Accounts
                </p>

                <h3 className="mt-1 text-lg font-black text-[#182442]">
                  Savings Cards
                </h3>
              </div>

              <p className="text-xs font-bold text-[#8995aa]">
                {
                  financialAccountSummary.accounts.length
                } account{
                  financialAccountSummary.accounts.length ===
                  1
                    ? ""
                    : "s"
                }
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {financialAccountSummary.accounts.map(
                (
                  account
                ) => {
                  const cardTheme =
                    getFinancialCardTheme(
                      account.provider,
                      account.accountType
                    );

                  return (
                    <button
                      key={
                        account.id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedFinancialAccount(
                          account
                        )
                      }
                      className="group block w-full overflow-hidden rounded-[22px] border border-black/5 bg-white text-left shadow-[0_14px_32px_rgba(20,42,118,0.10)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(20,42,118,0.15)] focus:outline-none focus:ring-4 focus:ring-[#294aad]/10"
                      aria-label={`View ${account.nickname || account.provider} details`}
                    >
                      <div
                        className="relative aspect-[1.586/1] overflow-hidden rounded-[22px] p-5 text-white"
                        style={{
                          background:
                            cardTheme.background,
                        }}
                      >
                        <div className="pointer-events-none absolute inset-0">
                          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),transparent_28%,rgba(255,255,255,0.03)_55%,transparent_76%)]" />
                          <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full border border-white/10" />
                          <div className="absolute -bottom-20 right-8 h-36 w-56 rotate-[-15deg] rounded-[50%] border border-white/10" />
                          <div
                            className="absolute bottom-2 right-4 select-none text-[72px] font-black tracking-[-0.08em] text-white/[0.07]"
                          >
                            {cardTheme.watermark}
                          </div>
                        </div>

                        <div className="relative z-10 flex h-full flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <FinancialBrandLogo
                                theme={
                                  cardTheme
                                }
                              />

                              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">
                                {account.accountType ===
                                "ewallet"
                                  ? "E-Wallet"
                                  : "Debit / Savings"}
                              </p>
                            </div>

                            <span className="rounded-md bg-black/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/80 backdrop-blur-sm">
                              {
                                cardTheme.network
                              }
                            </span>
                          </div>

                          <div className="mt-5 flex items-center justify-between">
                            <div
                              className="relative h-9 w-12 overflow-hidden rounded-[8px] border border-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.22),0_1px_2px_rgba(255,255,255,0.18)]"
                              style={{
                                background:
                                  `linear-gradient(135deg, ${cardTheme.chip}, #f4de8a 55%, ${cardTheme.chip})`,
                              }}
                            >
                              <div className="absolute left-1/3 top-0 h-full w-px bg-black/20" />
                              <div className="absolute left-2/3 top-0 h-full w-px bg-black/20" />
                              <div className="absolute left-0 top-1/2 h-px w-full bg-black/20" />
                              <div className="absolute left-2 top-2 h-2 w-8 rounded-full border border-black/15" />
                            </div>

                            <div className="text-right">
                              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/45">
                                Contactless
                              </p>

                              <div className="mt-1 flex justify-end gap-[2px] opacity-60">
                                <span className="h-3 w-[2px] rounded-full bg-white/70" />
                                <span className="h-4 w-[2px] rounded-full bg-white/55" />
                                <span className="h-5 w-[2px] rounded-full bg-white/40" />
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto">
                            <p className="font-mono text-[15px] font-bold tracking-[0.18em] text-white/95 drop-shadow-sm sm:text-[17px]">
                              •••• •••• ••••{" "}
                              {account.last4 ||
                                "0000"}
                            </p>

                            <div className="mt-4 flex items-end justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                                  Cardholder
                                </p>

                                <p className="mt-0.5 max-w-[180px] truncate text-[11px] font-extrabold uppercase tracking-[0.06em] text-white/90">
                                  {account.nickname ||
                                    account.provider}
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/45">
                                  Balance
                                </p>

                                <p className="mt-0.5 text-[13px] font-black text-white">
                                  ₱{money(
                                    account.balance
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/10" />
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#e4e9f2] bg-white/70 px-3 py-2 text-xs font-bold text-[#8995aa]">
              <CreditCard
                size={14}
              />
              Tap a card to view its information and actions.
            </div>
          </section>
        )}

        {selectedFinancialAccount &&
          (() => {
            const account =
              financialAccountSummary.accounts.find(
                (item) =>
                  item.id ===
                  selectedFinancialAccount.id
              ) ||
              selectedFinancialAccount;

            const cardTheme =
              getFinancialCardTheme(
                account.provider,
                account.accountType
              );

            const recentEntries =
              financialAccountEntries
                .filter(
                  (entry) =>
                    entry.accountId ===
                    account.id
                )
                .slice(
                  0,
                  5
                );

            return (
              <div
                className="fixed inset-0 z-[90] flex items-end justify-center bg-[#0b1630]/45 px-2 pb-[82px] pt-3 backdrop-blur-[6px] sm:items-center sm:px-6 sm:py-8"
                onMouseDown={(
                  event
                ) => {
                  if (
                    event.target ===
                    event.currentTarget
                  ) {
                    setSelectedFinancialAccount(
                      null
                    );
                  }
                }}
              >
                <div
                  className="account-detail-modal flex max-h-[94dvh] flex-col overflow-hidden rounded-t-[24px] border border-[#dfe5ef] bg-[#fdfefe] shadow-[0_28px_80px_rgba(15,33,75,0.24)] sm:max-h-[88dvh] sm:rounded-[28px]"
                  style={{
                    width:
                      "100%",
                    maxWidth:
                      "640px",
                  }}
                >
                  <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#e6eaf1] bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-6">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                        Account Details
                      </p>

                      <h3 className="mt-1 truncate text-lg font-black text-[#182442]">
                        {account.nickname ||
                          account.provider}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFinancialAccount(
                          null
                        )
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf1f7] text-[#71809a] transition hover:bg-[#e3e8f0]"
                      aria-label="Close account details"
                    >
                      <X
                        size={18}
                      />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pb-5 sm:p-6">
                    <div
                      className="relative mx-auto aspect-[1.586/1] w-full max-w-[500px] overflow-hidden rounded-[22px] p-5 text-white shadow-[0_18px_44px_rgba(20,42,118,0.18)]"
                      style={{
                        background:
                          cardTheme.background,
                      }}
                    >
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),transparent_28%,rgba(255,255,255,0.03)_55%,transparent_76%)]" />
                        <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full border border-white/10" />
                        <div className="absolute -bottom-20 right-8 h-36 w-56 rotate-[-15deg] rounded-[50%] border border-white/10" />
                        <div className="absolute bottom-2 right-4 select-none text-[76px] font-black tracking-[-0.08em] text-white/[0.07]">
                          {cardTheme.watermark}
                        </div>
                      </div>

                      <div className="relative z-10 flex h-full flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <FinancialBrandLogo
                              theme={
                                cardTheme
                              }
                            />

                            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">
                              {account.accountType ===
                              "ewallet"
                                ? "E-Wallet"
                                : "Debit / Savings"}
                            </p>
                          </div>

                          <span className="rounded-md bg-black/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/80 backdrop-blur-sm">
                            {
                              cardTheme.network
                            }
                          </span>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
                          <div
                            className="relative h-10 w-[52px] overflow-hidden rounded-[8px] border border-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.22),0_1px_2px_rgba(255,255,255,0.18)]"
                            style={{
                              background:
                                `linear-gradient(135deg, ${cardTheme.chip}, #f4de8a 55%, ${cardTheme.chip})`,
                            }}
                          >
                            <div className="absolute left-1/3 top-0 h-full w-px bg-black/20" />
                            <div className="absolute left-2/3 top-0 h-full w-px bg-black/20" />
                            <div className="absolute left-0 top-1/2 h-px w-full bg-black/20" />
                            <div className="absolute left-2 top-2 h-2 w-9 rounded-full border border-black/15" />
                          </div>

                          <div className="flex items-center gap-[3px] opacity-60">
                            <span className="h-4 w-[2px] rounded-full bg-white/70" />
                            <span className="h-5 w-[2px] rounded-full bg-white/55" />
                            <span className="h-6 w-[2px] rounded-full bg-white/40" />
                          </div>
                        </div>

                        <div className="mt-auto">
                          <p className="font-mono text-[17px] font-bold tracking-[0.18em] text-white/95 drop-shadow-sm sm:text-[20px]">
                            •••• •••• ••••{" "}
                            {account.last4 ||
                              "0000"}
                          </p>

                          <div className="mt-4 flex items-end justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                                Cardholder
                              </p>

                              <p className="mt-0.5 max-w-[220px] truncate text-xs font-extrabold uppercase tracking-[0.07em] text-white/90">
                                {account.nickname ||
                                  account.provider}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/45">
                                Balance
                              </p>

                              <p className="mt-0.5 text-base font-black text-white">
                                ₱{money(
                                  account.balance
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/10" />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#e5eaf2] bg-white">
                      <div className="flex items-center justify-between gap-4 border-b border-[#e6eaf1] px-4 py-3">
                        <p className="text-xs font-bold text-[#8995aa]">
                          Provider
                        </p>

                        <p className="min-w-0 truncate text-right text-sm font-extrabold text-[#182442]">
                          {
                            account.provider
                          }
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-b border-[#e6eaf1] px-4 py-3">
                        <p className="text-xs font-bold text-[#8995aa]">
                          Account Name
                        </p>

                        <p className="min-w-0 truncate text-right text-sm font-extrabold text-[#182442]">
                          {account.nickname ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-b border-[#e6eaf1] px-4 py-3">
                        <p className="text-xs font-bold text-[#8995aa]">
                          Type
                        </p>

                        <p className="text-right text-sm font-extrabold text-[#182442]">
                          {account.accountType ===
                          "ewallet"
                            ? "E-Wallet"
                            : "Bank Account"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-b border-[#e6eaf1] px-4 py-3">
                        <p className="text-xs font-bold text-[#8995aa]">
                          Last 4 Digits
                        </p>

                        <p className="font-mono text-right text-sm font-black tracking-[0.12em] text-[#182442]">
                          {account.last4
                            ? `•••• ${account.last4}`
                            : "Not provided"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-b border-[#e6eaf1] px-4 py-3">
                        <p className="text-xs font-bold text-[#8995aa]">
                          Money Added
                        </p>

                        <p className="text-right text-sm font-black text-[#18845c]">
                          ₱{money(
                            account.deposits
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-b border-[#e6eaf1] px-4 py-3">
                        <p className="text-xs font-bold text-[#8995aa]">
                          Withdrawn
                        </p>

                        <p className="text-right text-sm font-black text-[#c85353]">
                          ₱{money(
                            account.withdrawals
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 bg-[#f8faff] px-4 py-4">
                        <p className="text-sm font-extrabold text-[#52617d]">
                          Current Balance
                        </p>

                        <p className="text-xl font-black text-[#142a76]">
                          ₱{money(
                            account.balance
                          )}
                        </p>
                      </div>
                    </div>

                    {recentEntries.length >
                      0 && (
                      <div className="rounded-2xl border border-[#e2e7ef] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8995aa]">
                              Recent Activity
                            </p>

                            <p className="mt-1 text-sm font-extrabold text-[#182442]">
                              Latest savings movements
                            </p>
                          </div>

                          <span className="text-[10px] font-bold text-[#9aa5b6]">
                            {
                              recentEntries.length
                            } shown
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {recentEntries.map(
                            (
                              entry
                            ) => (
                              <div
                                key={
                                  entry.id
                                }
                                className="flex items-center justify-between gap-3 rounded-xl bg-[#f8faff] px-3 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-extrabold text-[#52617d]">
                                    {entry.note ||
                                      (entry.entryType ===
                                      "withdrawal"
                                        ? "Withdrawal"
                                        : "Savings added")}
                                  </p>

                                  <p className="mt-0.5 text-[10px] font-semibold text-[#9aa5b6]">
                                    {entry.createdAt
                                      ? dateValue(
                                          entry.createdAt
                                        ).toLocaleDateString(
                                          "en-PH",
                                          {
                                            month:
                                              "short",
                                            day:
                                              "numeric",
                                            year:
                                              "numeric",
                                          }
                                        )
                                      : ""}
                                  </p>
                                </div>

                                <p
                                  className={`shrink-0 text-sm font-black ${
                                    entry.entryType ===
                                    "withdrawal"
                                      ? "text-[#c85353]"
                                      : "text-[#18845c]"
                                  }`}
                                >
                                  {entry.entryType ===
                                  "withdrawal"
                                    ? "-"
                                    : "+"}
                                  ₱{money(
                                    entry.amount
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="shrink-0 border-t border-[#e5eaf2] bg-white px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 sm:px-5 sm:pb-4 sm:pt-4">
                    <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#9aa5b5] sm:hidden">
                      Account Actions
                    </p>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() =>
                          openAccountMoneyAction(
                            account,
                            "deposit"
                          )
                        }
                        className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#142a76] px-3 text-[12px] font-extrabold text-white shadow-[0_7px_18px_rgba(20,42,118,0.14)] transition active:scale-[0.98] sm:text-sm"
                      >
                        + Add Money
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openAccountMoneyAction(
                            account,
                            "withdrawal"
                          )
                        }
                        className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-[#d8e0ec] bg-white px-3 text-[12px] font-extrabold text-[#3f506d] transition active:bg-[#f5f7fb] sm:text-sm"
                      >
                        − Withdraw
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          beginEditFinancialAccount(
                            account
                          )
                        }
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#f3f6fa] px-3 text-[11px] font-extrabold text-[#52617d] transition active:bg-[#e9edf4] sm:min-h-[46px] sm:text-sm"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeFinancialAccount(
                            account
                          )
                        }
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#fff4f4] px-3 text-[11px] font-extrabold text-[#bd4b4b] transition active:bg-[#ffe8e8] sm:min-h-[46px] sm:text-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        <section className="rounded-2xl border border-[#dce3ef] bg-[#f8faff] p-4">
          <p className="text-xs font-extrabold text-[#52617d]">
            Manual savings tracker
          </p>

          <p className="mt-1 text-xs leading-5 text-[#8995aa]">
            Personal Finance does not connect to your bank or e-wallet. Balances are based only on the deposits and withdrawals you record here.
          </p>
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

      if (
        page ===
        "savings"
      ) {
        return SavingsPage();
      }

      return OverviewPage();
    };

  return (
    <>
      <div className="finance-shell relative min-h-[100dvh] overflow-x-hidden bg-[#eaf0fa]">
        <style>
          {`
            .finance-shell,
            .finance-shell * {
              box-sizing: border-box;
            }

            .finance-shell .app-input {
              width: 100%;
              min-width: 0;
              max-width: 100%;
            }

            .finance-shell,
            .finance-shell main,
            .finance-shell main > div,
            .finance-shell form,
            .finance-shell section,
            .finance-shell .app-card,
            .finance-shell .grid,
            .finance-shell .flex {
              min-width: 0;
              max-width: 100%;
            }

            .finance-shell .grid > *,
            .finance-shell .flex > * {
              min-width: 0;
            }

            .finance-shell .account-detail-modal {
              width: min(640px, calc(100vw - 48px)) !important;
              max-width: 640px !important;
            }

            @media (max-width: 639px) {
              .finance-shell .account-detail-modal {
                width: calc(100vw - 16px) !important;
                max-width: calc(100vw - 16px) !important;
              }
            }

            .finance-shell input,
            .finance-shell select,
            .finance-shell textarea,
            .finance-shell .app-input {
              display: block;
              width: 100% !important;
              min-width: 0 !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }

            .finance-shell select {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .finance-shell .has-left-icon {
              padding-left: 2.75rem !important;
            }

            .finance-shell .has-right-icon {
              padding-right: 2.75rem !important;
            }

            @media (max-width: 389px) {
              .finance-shell .app-input {
                font-size: 14px;
              }
            }

            .finance-shell input[type="date"],
            .finance-shell input[type="month"] {
              appearance: none;
              -webkit-appearance: none;
            }

            @media (max-width: 639px) {
              .finance-shell input[type="date"],
              .finance-shell input[type="month"] {
                font-size: 16px;
              }
            }
          `}
        </style>
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

        <header className="relative z-30 w-full min-w-0 bg-gradient-to-r from-[#10245f] to-[#294aad] px-4 py-4 text-white lg:hidden">
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

        <main className="relative z-10 w-full min-w-0 px-3 py-4 pb-6 sm:px-5 lg:ml-[260px] lg:w-[calc(100%-260px)] lg:px-8 lg:py-8 lg:pb-10">
          <div className="mx-auto w-full min-w-0 max-w-6xl">
            {renderPage()}

            {/* Mobile scroll clearance:
                keeps the final Edit/Delete/Remove controls fully above
                the fixed bottom navigation. Using an explicit height
                avoids depending only on Tailwind bottom padding. */}
            <div
              aria-hidden="true"
              className="lg:hidden"
              style={{
                height:
                  "260px",
              }}
            />
          </div>
        </main>

        <nav className="fixed bottom-[max(env(safe-area-inset-bottom),8px)] left-2 right-2 z-50 overflow-hidden rounded-[20px] border border-[#dfe5ef]/90 bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(20,42,118,0.14)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
            {navItems.map(
              ({
                id,
                label,
                icon:
                  Icon,
              }) => {
                const active =
                  page ===
                  id;

                return (
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
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`flex min-h-[54px] min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] px-1 transition ${
                      active
                        ? "bg-[#edf2ff] text-[#17368d] shadow-[inset_0_0_0_1px_rgba(41,74,173,0.05)]"
                        : "text-[#9aa6b8] active:bg-[#f4f6fa]"
                    }`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={
                        active
                          ? 2.2
                          : 1.8
                      }
                    />

                    <span className="max-w-full truncate text-[10px] font-bold leading-none">
                      {label}
                    </span>
                  </button>
                );
              }
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
  editingId,
  onEdit,
  onDelete,
}) {
  if (
    items.length ===
    0
  ) {
    return (
      <p className="mt-5 rounded-2xl bg-[#f7f9fd] p-5 text-sm text-[#8995aa]">
        No transactions match your current filters.
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
              className={`min-w-0 rounded-2xl border p-4 transition ${
                editingId ===
                item.id
                  ? "border-[#9cb0ea] bg-[#eef3ff]"
                  : "border-transparent bg-[#f7f9fd]"
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
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

                <div className="ml-auto shrink-0 text-right">
                  <p
                    className={`whitespace-nowrap font-black ${
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
                </div>
              </div>

              <div className="mt-3 mb-2 flex items-center justify-end gap-2 border-t border-[#e5eaf2] pt-3">
                <button
                  type="button"
                  onClick={() =>
                    onEdit?.(
                      item
                    )
                  }
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-xs font-extrabold text-[#294aad]"
                >
                  <Pencil
                    size={14}
                  />
                  Edit
                </button>

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
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#ffeded] px-3 text-xs font-extrabold text-[#c85353] disabled:opacity-50"
                >
                  {deletingId ===
                  item.id ? (
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2
                      size={15}
                    />
                  )}
                  Delete
                </button>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

export default Budgeter;
