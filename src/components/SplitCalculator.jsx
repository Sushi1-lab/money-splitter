import {
  Check,
  ChevronDown,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Percent,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  "Other",
];

const normalizeName = (name = "") =>
  String(name)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

function SplitCalculator({
  people = [],
  onAddPerson,
  onDeletePerson,
  onSave,
  onUpdate,
  editingSplit = null,
  onCancelEdit,
  saving = false,
}) {
  const {
    Dialog,
    warning,
  } = useAppDialog();

  const [totalAmount, setTotalAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState("Food");

  const [payerKey, setPayerKey] =
    useState("");

  const [selectedKeys, setSelectedKeys] =
    useState([]);

  const [splitMode, setSplitMode] =
    useState("equal");

  const [percentages, setPercentages] =
    useState({});

  const [showSavedPeople, setShowSavedPeople] =
    useState(false);

  const [showAddPerson, setShowAddPerson] =
    useState(false);

  const [newPerson, setNewPerson] =
    useState("");

  const [receiptBase64, setReceiptBase64] =
    useState(null);

  const [
    processingReceipt,
    setProcessingReceipt,
  ] = useState(false);

  const personKey = (person) =>
    person.id ||
    normalizeName(person.name);

  const uniqueKeys = (keys = []) =>
    [...new Set(keys.filter(Boolean))];

  const peopleByKey =
    useMemo(() => {
      const map = {};

      people.forEach((person) => {
        map[
          personKey(person)
        ] = person;
      });

      return map;
    }, [people]);

  useEffect(() => {
    if (!editingSplit) {
      return;
    }

    setTotalAmount(
      String(
        editingSplit.totalAmount ??
          ""
      )
    );

    setDescription(
      editingSplit.description ||
        ""
    );

    setCategory(
      editingSplit.category ||
        "Other"
    );

    const payer =
      editingSplit.payer;

    if (payer?.name) {
      const match =
        people.find(
          (person) =>
            normalizeName(
              person.name
            ) ===
            normalizeName(
              payer.name
            )
        );

      if (match) {
        setPayerKey(
          personKey(match)
        );
      }
    }

    const participants =
      Array.isArray(
        editingSplit.participants
      )
        ? editingSplit.participants
        : (
            editingSplit.people ||
            []
          ).map((name) => ({
            name,
          }));

    const keys =
      uniqueKeys(
        participants
          .map((participant) => {
            const match =
              people.find(
                (person) =>
                  normalizeName(
                    person.name
                  ) ===
                  normalizeName(
                    participant.name
                  )
              );

            return match
              ? personKey(match)
              : null;
          })
          .filter(Boolean)
      );

    setSelectedKeys(keys);

    const hasPercentages =
      participants.some(
        (item) =>
          Number.isFinite(
            Number(
              item.percentage
            )
          )
      );

    setSplitMode(
      hasPercentages
        ? "percentage"
        : "equal"
    );

    const nextPercentages = {};

    participants.forEach(
      (participant) => {
        const match =
          people.find(
            (person) =>
              normalizeName(
                person.name
              ) ===
              normalizeName(
                participant.name
              )
          );

        if (match) {
          nextPercentages[
            personKey(match)
          ] =
            Number(
              participant.percentage
            ) || 0;
        }
      }
    );

    setPercentages(
      nextPercentages
    );

    setReceiptBase64(
      editingSplit.receiptBase64 ||
        null
    );
  }, [
    editingSplit?.id,
    people,
  ]);

  const resetForm = () => {
    setTotalAmount("");
    setDescription("");
    setCategory("Food");
    setPayerKey("");
    setSelectedKeys([]);
    setSplitMode("equal");
    setPercentages({});
    setReceiptBase64(null);
  };

  const toggleParticipant = (
    key
  ) => {
    setSelectedKeys(
      (current) => {
        const cleanCurrent =
          uniqueKeys(current);

        if (
          cleanCurrent.includes(key)
        ) {
          const next =
            cleanCurrent.filter(
              (item) =>
                item !== key
            );

          setPercentages(
            (values) => {
              const copy = {
                ...values,
              };

              delete copy[key];
              return copy;
            }
          );

          return next;
        }

        return uniqueKeys([
          ...cleanCurrent,
          key,
        ]);
      }
    );
  };

  const distributeEqually =
    () => {
      const keys =
        uniqueKeys(
          selectedKeys
        );

      if (
        keys.length ===
        0
      ) {
        return;
      }

      const equal =
        100 /
        keys.length;

      const next = {};

      keys.forEach(
        (key, index) => {
          next[key] =
            index ===
            keys.length -
              1
              ? Number(
                  (
                    100 -
                    equal *
                      (
                        keys.length -
                        1
                      )
                  ).toFixed(2)
                )
              : Number(
                  equal.toFixed(
                    2
                  )
                );
        }
      );

      setSelectedKeys(keys);
      setPercentages(next);
    };

  useEffect(() => {
    setSelectedKeys(
      (current) => {
        const deduped =
          uniqueKeys(current);

        return deduped.length ===
          current.length
          ? current
          : deduped;
      }
    );
  }, [
    people.length,
  ]);

  useEffect(() => {
    if (
      splitMode ===
      "percentage" &&
      selectedKeys.length >
        0
    ) {
      const currentTotal =
        selectedKeys.reduce(
          (sum, key) =>
            sum +
            Number(
              percentages[
                key
              ] || 0
            ),
          0
        );

      if (
        currentTotal === 0
      ) {
        distributeEqually();
      }
    }
  }, [
    splitMode,
    selectedKeys.length,
  ]);

  const percentageTotal =
    uniqueKeys(
      selectedKeys
    ).reduce(
      (sum, key) =>
        sum +
        Number(
          percentages[key] ||
            0
        ),
      0
    );

  const compressReceiptImage =
    (file) =>
      new Promise(
        (resolve, reject) => {
          const reader =
            new FileReader();

          reader.onload = (
            event
          ) => {
            const image =
              new Image();

            image.onload = () => {
              try {
                let width =
                  image.width;

                let height =
                  image.height;

                const maxDimension =
                  1100;

                const ratio =
                  Math.min(
                    maxDimension /
                      width,
                    maxDimension /
                      height,
                    1
                  );

                width =
                  Math.round(
                    width *
                      ratio
                  );

                height =
                  Math.round(
                    height *
                      ratio
                  );

                const canvas =
                  document.createElement(
                    "canvas"
                  );

                canvas.width =
                  width;

                canvas.height =
                  height;

                const context =
                  canvas.getContext(
                    "2d"
                  );

                if (!context) {
                  reject(
                    new Error(
                      "Canvas is unavailable."
                    )
                  );
                  return;
                }

                context.drawImage(
                  image,
                  0,
                  0,
                  width,
                  height
                );

                const compressed =
                  canvas.toDataURL(
                    "image/jpeg",
                    0.68
                  );

                resolve(
                  compressed
                );
              } catch (err) {
                reject(err);
              }
            };

            image.onerror = () =>
              reject(
                new Error(
                  "The image could not be processed."
                )
              );

            image.src =
              event.target.result;
          };

          reader.onerror = () =>
            reject(
              new Error(
                "The image could not be read."
              )
            );

          reader.readAsDataURL(
            file
          );
        }
      );

  const handleReceipt =
    async (
      event
    ) => {
      const file =
        event.target
          .files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        await warning(
          "Invalid Image",
          "Please choose an image file."
        );

        event.target.value =
          "";

        return;
      }

      const maxOriginalSize =
        15 *
        1024 *
        1024;

      if (
        file.size >
        maxOriginalSize
      ) {
        await warning(
          "Receipt Too Large",
          "Please choose an image smaller than 15 MB."
        );

        event.target.value =
          "";

        return;
      }

      try {
        setProcessingReceipt(
          true
        );

        const compressed =
          await compressReceiptImage(
            file
          );

        const estimatedBytes =
          Math.ceil(
            compressed.length *
              0.75
          );

        const maxStoredReceiptBytes =
          650 *
          1024;

        if (
          estimatedBytes >
          maxStoredReceiptBytes
        ) {
          await warning(
            "Receipt Still Too Large",
            "This receipt is still too large after compression. Try cropping the image or taking a closer photo."
          );

          event.target.value =
            "";

          return;
        }

        setReceiptBase64(
          compressed
        );
      } catch (err) {
        console.error(
          "Receipt processing error:",
          err
        );

        await warning(
          "Unable to Process Receipt",
          "Please try another image."
        );

        event.target.value =
          "";
      } finally {
        setProcessingReceipt(
          false
        );
      }
    };

  const addPerson =
    async () => {
      const clean =
        newPerson
          .trim()
          .replace(/\s+/g, " ");

      if (!clean) return;

      const created =
        await onAddPerson?.(
          clean
        );

      if (created) {
        const key =
          personKey(
            created
          );

        setSelectedKeys(
          (current) =>
            current.includes(
              key
            )
              ? current
              : [
                  ...current,
                  key,
                ]
        );

        setNewPerson("");
        setShowAddPerson(false);
        setShowSavedPeople(true);
      }
    };

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      const total =
        Number(
          totalAmount
        );

      if (
        !Number.isFinite(total) ||
        total <= 0
      ) {
        await warning(
          "Amount Required",
          "Enter a valid total amount."
        );
        return;
      }

      if (!payerKey) {
        await warning(
          "Who Covered?",
          "Choose the person who covered the expense."
        );
        return;
      }

      const cleanSelectedKeys =
        uniqueKeys(
          selectedKeys
        );

      if (
        cleanSelectedKeys.length ===
        0
      ) {
        await warning(
          "Participants Required",
          "Select at least one person included in the split."
        );
        return;
      }

      if (
        splitMode ===
          "percentage" &&
        Math.abs(
          percentageTotal -
            100
        ) > 0.01
      ) {
        await warning(
          "Percentages Must Equal 100%",
          `Your current total is ${percentageTotal.toFixed(
            2
          )}%.`
        );
        return;
      }

      const payer =
        peopleByKey[
          payerKey
        ];

      const equalAmount =
        total /
        cleanSelectedKeys.length;

      const participants =
        cleanSelectedKeys.map(
          (key) => {
            const person =
              peopleByKey[key];

            const percentage =
              splitMode ===
              "percentage"
                ? Number(
                    percentages[
                      key
                    ] || 0
                  )
                : Number(
                    (
                      100 /
                      cleanSelectedKeys.length
                    ).toFixed(
                      4
                    )
                  );

            const amount =
              splitMode ===
              "percentage"
                ? total *
                  (
                    percentage /
                    100
                  )
                : equalAmount;

            return {
              id:
                person?.id ||
                null,
              name:
                person?.name ||
                "",
              linkedUid:
                person?.linkedUid ||
                null,
              linkedEmail:
                person?.linkedEmail ||
                null,
              username:
                person?.username ||
                "",
              photoURL:
                person?.photoURL ||
                null,
              percentage:
                Number(
                  percentage.toFixed(
                    4
                  )
                ),
              amount:
                Number(
                  amount.toFixed(
                    2
                  )
                ),
            };
          }
        );

      const payload = {
        totalAmount:
          Number(
            total.toFixed(2)
          ),
        amountPerPerson:
          splitMode ===
          "equal"
            ? Number(
                equalAmount.toFixed(
                  2
                )
              )
            : null,
        splitMode,
        payer: {
          id:
            payer?.id ||
            null,
          name:
            payer?.name ||
            "",
          linkedUid:
            payer?.linkedUid ||
            null,
          linkedEmail:
            payer?.linkedEmail ||
            null,
          username:
            payer?.username ||
            "",
          photoURL:
            payer?.photoURL ||
            null,
        },
        participants,
        people:
          participants.map(
            (person) =>
              person.name
          ),
        addedBy:
          payer?.name ||
          "",
        description:
          description.trim() ||
          "Shared expense",
        category,
        receiptBase64:
          receiptBase64 ||
          null,
      };

      const success =
        editingSplit?.id
          ? await onUpdate?.(
              editingSplit.id,
              payload
            )
          : await onSave?.(
              payload
            );

      if (success) {
        resetForm();
        onCancelEdit?.();
      }
    };

  return (
    <>
      <form
        onSubmit={
          handleSubmit
        }
        className="app-card overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <ReceiptText
                size={22}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
                {editingSplit
                  ? "Edit Expense"
                  : "New Expense"}
              </p>

              <h2 className="text-xl font-extrabold">
                {editingSplit
                  ? "Update Split"
                  : "Split an Expense"}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="app-label">
                Total Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  totalAmount
                }
                onChange={(
                  event
                ) =>
                  setTotalAmount(
                    event.target
                      .value
                  )
                }
                className="app-input"
                placeholder="₱0.00"
              />
            </div>

            <div>
              <label className="app-label">
                Category
              </label>

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
                className="app-input"
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
            </div>
          </div>

          <div>
            <label className="app-label">
              Description
            </label>

            <input
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target
                    .value
                )
              }
              className="app-input"
              placeholder="Dinner, groceries, hotel..."
            />
          </div>

          <div>
            <label className="app-label">
              Who Covered?
            </label>

            <select
              value={
                payerKey
              }
              onChange={(
                event
              ) =>
                setPayerKey(
                  event.target
                    .value
                )
              }
              className="app-input"
            >
              <option value="">
                Select person
              </option>

              {people.map(
                (person) => (
                  <option
                    key={
                      personKey(
                        person
                      )
                    }
                    value={
                      personKey(
                        person
                      )
                    }
                  >
                    {
                      person.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="app-label">
              Split Method
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setSplitMode(
                    "equal"
                  )
                }
                className={`min-h-12 rounded-xl border text-sm font-extrabold ${
                  splitMode ===
                  "equal"
                    ? "border-[#294aad] bg-[#e4ebff] text-[#142a76]"
                    : "border-[#dce3ef] bg-[#f7f9fd] text-[#71809a]"
                }`}
              >
                Equal Split
              </button>

              <button
                type="button"
                onClick={() =>
                  setSplitMode(
                    "percentage"
                  )
                }
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-extrabold ${
                  splitMode ===
                  "percentage"
                    ? "border-[#294aad] bg-[#e4ebff] text-[#142a76]"
                    : "border-[#dce3ef] bg-[#f7f9fd] text-[#71809a]"
                }`}
              >
                <Percent
                  size={16}
                />
                Percentage
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#dce3ef]">
            <button
              type="button"
              onClick={() =>
                setShowSavedPeople(
                  (current) =>
                    !current
                )
              }
              className="flex w-full items-center justify-between gap-3 bg-[#f8faff] p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <Users
                  size={20}
                  className="text-[#294aad]"
                />

                <div>
                  <p className="font-extrabold text-[#182442]">
                    Saved People
                  </p>

                  <p className="mt-1 text-xs text-[#8995aa]">
                    {uniqueKeys(selectedKeys).length} selected · {people.length} added
                  </p>
                </div>
              </div>

              {showSavedPeople ? (
                <ChevronDown
                  size={18}
                />
              ) : (
                <ChevronRight
                  size={18}
                />
              )}
            </button>

            {showSavedPeople && (
              <div className="space-y-2 border-t border-[#e3e8f0] p-4">
                {people.length ===
                0 ? (
                  <p className="text-sm text-[#8995aa]">
                    No saved people yet.
                  </p>
                ) : (
                  people.map(
                    (person) => {
                      const key =
                        personKey(
                          person
                        );

                      const selected =
                        selectedKeys.includes(
                          key
                        );

                      return (
                        <div
                          key={
                            key
                          }
                          className={`flex items-center gap-3 rounded-xl border p-3 ${
                            selected
                              ? "border-[#9cb0ea] bg-[#eef3ff]"
                              : "border-[#e0e6ef] bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              toggleParticipant(
                                key
                              )
                            }
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              selected
                                ? "bg-[#294aad] text-white"
                                : "bg-[#edf1f7] text-[#71809a]"
                            }`}>
                              {selected ? (
                                <Check
                                  size={16}
                                />
                              ) : (
                                String(
                                  person.name ||
                                    "?"
                                )
                                  .charAt(0)
                                  .toUpperCase()
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-bold text-[#182442]">
                                {
                                  person.name
                                }
                              </p>

                              <p className="mt-0.5 text-[11px] text-[#8995aa]">
                                Added to this workspace
                              </p>
                            </div>
                          </button>

                          {splitMode ===
                            "percentage" &&
                            selected && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={
                                    percentages[
                                      key
                                    ] ??
                                    ""
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setPercentages(
                                      (
                                        current
                                      ) => ({
                                        ...current,
                                        [key]:
                                          event.target
                                            .value,
                                      })
                                    )
                                  }
                                  className="h-10 w-20 rounded-xl border border-[#dce3ef] bg-white px-2 text-right text-sm font-bold text-[#182442] outline-none"
                                />
                                <span className="text-xs font-bold text-[#71809a]">
                                  %
                                </span>
                              </div>
                            )}

                          <button
                            type="button"
                            title="Remove saved person"
                            onClick={() =>
                              onDeletePerson?.(
                                person
                              )
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#c85353] hover:bg-[#ffeded]"
                          >
                            <Trash2
                              size={15}
                            />
                          </button>
                        </div>
                      );
                    }
                  )
                )}

                {splitMode ===
                  "percentage" &&
                  uniqueKeys(selectedKeys).length >
                    0 && (
                    <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-extrabold ${
                      Math.abs(
                        percentageTotal -
                          100
                      ) <= 0.01
                        ? "bg-[#e7f6ef] text-[#18845c]"
                        : "bg-[#fff3df] text-[#a36b16]"
                    }`}>
                      Percentage total: {percentageTotal.toFixed(2)}%
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#dce3ef]">
            <button
              type="button"
              onClick={() =>
                setShowAddPerson(
                  (current) =>
                    !current
                )
              }
              className="flex w-full items-center justify-between gap-3 bg-white p-4 text-left"
            >
              <div className="flex items-center gap-2 font-extrabold text-[#294aad]">
                <Plus
                  size={18}
                />
                Save New Person
              </div>

              {showAddPerson ? (
                <ChevronDown
                  size={18}
                />
              ) : (
                <ChevronRight
                  size={18}
                />
              )}
            </button>

            {showAddPerson && (
              <div className="flex gap-2 border-t border-[#e3e8f0] p-4">
                <input
                  value={
                    newPerson
                  }
                  onChange={(
                    event
                  ) =>
                    setNewPerson(
                      event.target
                        .value
                    )
                  }
                  className="app-input flex-1"
                  placeholder="Person name"
                />

                <button
                  type="button"
                  onClick={
                    addPerson
                  }
                  className="rounded-xl bg-[#142a76] px-4 font-extrabold text-white"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="app-label">
              Receipt
              <span className="ml-1 font-normal text-[#9aa5b6]">
                (optional)
              </span>
            </label>

            <label
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-[#b9c6e5] bg-[#eef3ff] text-sm font-bold text-[#294aad] ${
                processingReceipt
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              }`}
            >
              {processingReceipt ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <ImagePlus
                  size={18}
                />
              )}

              {processingReceipt
                ? "Processing Receipt..."
                : receiptBase64
                ? "Replace Receipt"
                : "Add Receipt Image"}

              <input
                type="file"
                accept="image/*"
                disabled={
                  processingReceipt
                }
                onChange={
                  handleReceipt
                }
                className="hidden"
              />
            </label>

            {receiptBase64 && (
              <div className="mt-3 rounded-xl border border-[#dce3ef] bg-white p-3">
                <img
                  src={
                    receiptBase64
                  }
                  alt="Receipt preview"
                  className="mx-auto max-h-72 rounded-xl object-contain"
                />

                <button
                  type="button"
                  onClick={() =>
                    setReceiptBase64(
                      null
                    )
                  }
                  className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#ffeded] text-sm font-bold text-[#c85353]"
                >
                  <X
                    size={16}
                  />
                  Remove Receipt
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {editingSplit && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onCancelEdit?.();
                }}
                className="min-h-12 flex-1 rounded-xl bg-[#e8edf5] font-extrabold text-[#52617d]"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              disabled={
                saving ||
                processingReceipt
              }
              className="app-button-primary flex min-h-12 flex-1 items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ||
              processingReceipt ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={18}
                />
              )}

              {processingReceipt
                ? "Processing Receipt..."
                : saving
                ? "Saving..."
                : editingSplit
                ? "Update Expense"
                : "Save Expense"}
            </button>
          </div>
        </div>
      </form>

      <Dialog />
    </>
  );
}

export default SplitCalculator;
