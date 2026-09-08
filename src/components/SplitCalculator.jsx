import { useEffect, useState } from "react";

import {
  Camera,
  Check,
  CircleDollarSign,
  Plus,
  Tag,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import useAppDialog from "../hooks/useAppDialog.jsx";

function SplitCalculator({
  people = [],
  onAddPerson,
  onDeletePerson,
  onSave,
  saving,
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [payerId, setPayerId] = useState("");
  const [participantIds, setParticipantIds] = useState([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [addingPerson, setAddingPerson] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const {
    Dialog,
    warning,
    error,
    success,
  } = useAppDialog();

  const categories = [
    "Food",
    "Transport",
    "Hotel",
    "Shopping",
    "Bills",
    "Entertainment",
    "Other",
  ];

  // =========================================
  // KEEP COVERED PERSON VALID
  // =========================================

  useEffect(() => {
    if (people.length === 0) {
      setPayerId("");
      setParticipantIds([]);
      return;
    }

    const coveredPersonStillExists = people.some(
      (person) => person.id === payerId
    );

    if (!coveredPersonStillExists) {
      setPayerId(people[0].id);
    }

    setParticipantIds((current) =>
      current.filter((id) =>
        people.some((person) => person.id === id)
      )
    );
  }, [people, payerId]);

  // =========================================
  // VALUES
  // =========================================

  const totalAmount = Number(amount) || 0;

  const amountPerPerson =
    participantIds.length > 0
      ? totalAmount / participantIds.length
      : 0;

  const getPerson = (id) =>
    people.find((person) => person.id === id);

  // =========================================
  // WHO COVERED
  // =========================================

  const changeCoveredPerson = (id) => {
    setPayerId(id);

    // The person who covered is NOT
    // automatically included in the split.
  };

  // =========================================
  // PARTICIPANTS
  // =========================================

  const toggleParticipant = (id) => {
    setParticipantIds((current) => {
      if (current.includes(id)) {
        return current.filter(
          (value) => value !== id
        );
      }

      return [...current, id];
    });
  };

  const selectEveryone = () => {
    setParticipantIds(
      people.map((person) => person.id)
    );
  };

  const clearParticipants = () => {
    setParticipantIds([]);
  };

  // =========================================
  // ADD PERSON
  // =========================================

  const handleAddPerson = async () => {
    const cleanName = newPersonName.trim();

    if (!cleanName) {
      await warning(
        "Name Required",
        "Enter a person's name before adding them."
      );

      return;
    }

    const existing = people.find(
      (person) =>
        person.name?.trim().toLowerCase() ===
        cleanName.toLowerCase()
    );

    if (existing) {
      await warning(
        "Person Already Added",
        `${existing.name} is already saved in this server.`
      );

      setNewPersonName("");
      return;
    }

    try {
      setAddingPerson(true);

      const newPerson =
        await onAddPerson(cleanName);

      if (newPerson) {
        setNewPersonName("");

        setParticipantIds((current) => [
          ...current,
          newPerson.id,
        ]);

        if (!payerId) {
          setPayerId(newPerson.id);
        }
      }
    } catch (err) {
      console.error(
        "Add person error:",
        err
      );

      await error(
        "Unable to Add Person",
        "We couldn't save this person. Please try again."
      );
    } finally {
      setAddingPerson(false);
    }
  };

  // =========================================
  // RECEIPT COMPRESSION
  // =========================================

  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const image = new Image();

        image.onload = () => {
          let width = image.width;
          let height = image.height;

          const ratio = Math.min(
            900 / width,
            1200 / height,
            1
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

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

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              0.55
            )
          );
        };

        image.onerror = reject;
        image.src = event.target.result;
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    });

  // =========================================
  // RECEIPT
  // =========================================

  const handleReceipt = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      await warning(
        "Invalid Receipt",
        "Please select an image file for the receipt."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      await warning(
        "Receipt Too Large",
        "The original receipt image must be smaller than 10MB."
      );

      event.target.value = "";
      return;
    }

    try {
      const compressed =
        await compressImage(file);

      if (compressed.length > 700000) {
        await warning(
          "Receipt Too Large",
          "We compressed the receipt, but it is still too large to save. Try a smaller image."
        );

        event.target.value = "";
        return;
      }

      setReceipt(compressed);
      setReceiptPreview(compressed);
    } catch (err) {
      console.error(
        "Receipt error:",
        err
      );

      await error(
        "Receipt Error",
        "We couldn't process this receipt. Try another image."
      );

      event.target.value = "";
    }
  };

  // =========================================
  // SUBMIT
  // =========================================

  const submit = async (event) => {
    event.preventDefault();

    const coveredPerson =
      getPerson(payerId);

    const participants =
      participantIds
        .map(getPerson)
        .filter(Boolean);

    if (!coveredPerson) {
      await warning(
        "Who Covered?",
        "Choose the person who covered this expense."
      );

      return;
    }

    if (!description.trim()) {
      await warning(
        "Description Required",
        "Add a short description so everyone knows what this expense was for."
      );

      return;
    }

    if (totalAmount <= 0) {
      await warning(
        "Invalid Amount",
        "Enter an amount greater than ₱0."
      );

      return;
    }

    if (participants.length === 0) {
      await warning(
        "Nobody Is Included",
        "Select at least one person who should share this expense."
      );

      return;
    }

    try {
      const saved = await onSave({
        totalAmount,

        amountPerPerson:
          totalAmount / participants.length,

        payer: {
          id: coveredPerson.id,
          name: coveredPerson.name,

          linkedUid:
            coveredPerson.linkedUid || null,

          linkedEmail:
            coveredPerson.linkedEmail || null,

          username:
            coveredPerson.username || "",
        },

        participants:
          participants.map((person) => ({
            id: person.id,
            name: person.name,

            linkedUid:
              person.linkedUid || null,

            linkedEmail:
              person.linkedEmail || null,

            username:
              person.username || "",
          })),

        // Keep these for backward compatibility.
        people:
          participants.map(
            (person) => person.name
          ),

        addedBy:
          coveredPerson.name,

        description:
          description.trim(),

        category,

        receiptBase64:
          receipt,
      });

      if (saved) {
        const savedDescription =
          description.trim();

        const numberOfPeople =
          participants.length;

        setAmount("");
        setDescription("");
        setCategory("Food");
        setReceipt(null);
        setReceiptPreview(null);
        setParticipantIds([]);

        await success(
          "Expense Saved",
          `${savedDescription} was split between ${numberOfPeople} ${
            numberOfPeople === 1
              ? "person"
              : "people"
          }.`
        );
      }
    } catch (err) {
      console.error(
        "Save expense error:",
        err
      );

      await error(
        "Unable to Save Expense",
        "Something went wrong while saving this expense. Please try again."
      );
    }
  };

  return (
    <section className="app-card w-full min-w-0 overflow-hidden">
      {/* =====================================
          HEADER
      ====================================== */}

      <div className="bg-gradient-to-r from-[#10245f] to-[#294aad] p-5 text-white sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <CircleDollarSign
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">
              New Expense
            </p>

            <h2 className="text-xl font-extrabold">
              Split Calculator
            </h2>
          </div>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="space-y-6 p-4 sm:p-6"
      >
        {/* =====================================
            SAVED PEOPLE
        ====================================== */}

        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="app-label mb-1">
                Saved People
              </label>

              <p className="text-xs text-[#8995aa]">
                Add a person once and reuse them in future splits.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-[#e4ebff] px-3 py-1 text-xs font-bold text-[#142a76]">
              {people.length}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <UserPlus
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
              />

              <input
                value={newPersonName}
                onChange={(event) =>
                  setNewPersonName(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddPerson();
                  }
                }}
                placeholder="Add a person's name"
                className="app-input app-input-icon"
              />
            </div>

            <button
              type="button"
              disabled={addingPerson}
              onClick={handleAddPerson}
              className="app-button-secondary flex shrink-0 items-center justify-center gap-2 px-5 disabled:opacity-50"
            >
              <Plus size={17} />

              {addingPerson
                ? "Adding..."
                : "Add"}
            </button>
          </div>

          {people.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center overflow-hidden rounded-full bg-[#e4ebff] text-sm font-bold text-[#142a76]"
                >
                  <span className="px-3 py-2">
                    {person.name}
                  </span>

                  <button
                    type="button"
                    title={`Remove ${person.name}`}
                    onClick={() =>
                      onDeletePerson(person)
                    }
                    className="flex h-9 w-9 items-center justify-center border-l border-[#cdd8f7] text-[#7585a6] transition hover:bg-[#d8e2ff]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =====================================
            EMPTY PEOPLE STATE
        ====================================== */}

        {people.length === 0 ? (
          <div className="rounded-[20px] bg-[#eaf0fa] p-8 text-center">
            <UsersRound
              size={30}
              className="mx-auto text-[#9da9bb]"
            />

            <p className="mt-3 font-extrabold text-[#52617d]">
              Add your first person
            </p>

            <p className="mt-1 text-sm text-[#8995aa]">
              Add names above before creating an expense.
            </p>
          </div>
        ) : (
          <>
            {/* =====================================
                WHO COVERED
            ====================================== */}

            <div>
              <label className="app-label">
                Who Covered?
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
                />

                <select
                  value={payerId}
                  onChange={(event) =>
                    changeCoveredPerson(
                      event.target.value
                    )
                  }
                  className="app-input app-input-icon appearance-none"
                >
                  {people.map((person) => (
                    <option
                      key={person.id}
                      value={person.id}
                    >
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="mt-2 text-xs text-[#8995aa]">
                The person who covered the expense does not have to be included in the split.
              </p>
            </div>

            {/* =====================================
                DESCRIPTION
            ====================================== */}

            <div>
              <label className="app-label">
                Description
              </label>

              <input
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Example: Dinner at Manam"
                className="app-input"
              />
            </div>

            {/* =====================================
                CATEGORY
            ====================================== */}

            <div>
              <label className="app-label">
                Category
              </label>

              <div className="relative">
                <Tag
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8995aa]"
                />

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  className="app-input app-input-icon appearance-none"
                >
                  {categories.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* =====================================
                AMOUNT
            ====================================== */}

            <div>
              <label className="app-label">
                Total Amount
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-[#8995aa]">
                  ₱
                </span>

                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  className="app-input app-input-icon"
                />
              </div>
            </div>

            {/* =====================================
                PEOPLE INCLUDED
            ====================================== */}

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UsersRound
                      size={17}
                      className="text-[#294aad]"
                    />

                    <p className="font-bold text-[#52617d]">
                      People Included
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-[#8995aa]">
                    Only selected people will share the total.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectEveryone}
                    className="rounded-lg bg-[#e4ebff] px-3 py-2 text-xs font-bold text-[#142a76]"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={clearParticipants}
                    className="rounded-lg bg-[#e8ecf3] px-3 py-2 text-xs font-bold text-[#71809a]"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {people.map((person) => {
                  const selected =
                    participantIds.includes(
                      person.id
                    );

                  const isCoveredPerson =
                    person.id === payerId;

                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() =>
                        toggleParticipant(
                          person.id
                        )
                      }
                      className={`
                        flex min-h-[64px]
                        min-w-0
                        items-center
                        gap-3
                        rounded-2xl
                        border
                        p-3
                        text-left
                        transition
                        ${
                          selected
                            ? "border-[#8199df] bg-[#e4ebff]"
                            : "border-[#dce3ef] bg-[#f4f7fb]"
                        }
                      `}
                    >
                      <div
                        className={`
                          flex h-9 w-9
                          shrink-0
                          items-center justify-center
                          rounded-full
                          ${
                            selected
                              ? "bg-[#142a76] text-white"
                              : "bg-[#dfe4ed] text-[#8995aa]"
                          }
                        `}
                      >
                        {selected ? (
                          <Check size={17} />
                        ) : (
                          <UserRound size={17} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-extrabold text-[#182442]">
                            {person.name}
                          </p>

                          {isCoveredPerson && (
                            <span className="rounded-full bg-[#ccd8ff] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#142a76]">
                              Covered
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-[#8995aa]">
                          {selected
                            ? "Included in split"
                            : isCoveredPerson
                              ? "Covered, but not included"
                              : "Not included"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =====================================
                AMOUNT PER PERSON
            ====================================== */}

            <div className="rounded-[20px] bg-gradient-to-br from-[#dfe7ff] to-[#edf2ff] p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#71809a]">
                Each Included Person
              </p>

              <p className="mt-1 text-3xl font-extrabold text-[#142a76]">
                ₱
                {amountPerPerson.toLocaleString(
                  "en-PH",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>

              <p className="mt-2 text-xs text-[#71809a]">
                {participantIds.length}{" "}
                {participantIds.length === 1
                  ? "person"
                  : "people"}{" "}
                included
              </p>
            </div>

            {/* =====================================
                RECEIPT
            ====================================== */}

            <div>
              <label className="app-label">
                Receipt

                <span className="ml-1 font-normal text-[#9ba6b9]">
                  optional
                </span>
              </label>

              <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[15px] border border-dashed border-[#b9c6e5] bg-[#eef3ff] font-bold text-[#294aad] transition hover:bg-[#e4ebff]">
                <Camera size={19} />

                Add Receipt

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceipt}
                  className="hidden"
                />
              </label>

              {receiptPreview && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-[#dce3ef] bg-white">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="max-h-72 w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setReceipt(null);
                      setReceiptPreview(null);
                    }}
                    className="flex min-h-11 w-full items-center justify-center gap-2 bg-[#ffeded] text-sm font-bold text-[#cf4646]"
                  >
                    <Trash2 size={16} />

                    Remove Receipt
                  </button>
                </div>
              )}
            </div>

            {/* =====================================
                SAVE
            ====================================== */}

            <button
              type="submit"
              disabled={saving}
              className="app-button-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {saving
                ? "Saving..."
                : "Save Expense"}
            </button>
          </>
        )}
      </form>

      <Dialog />
    </section>
  );
}

export default SplitCalculator;