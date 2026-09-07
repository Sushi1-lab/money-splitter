import { useState } from "react";

function SplitCalculator({
  onSave,
  saving,
}) {
  const [amount, setAmount] =
    useState("");

  const [name, setName] =
    useState("");

  const [people, setPeople] =
    useState([]);

  const [addedBy, setAddedBy] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [receipt, setReceipt] =
    useState(null);

  const [
    receiptPreview,
    setReceiptPreview,
  ] = useState(null);

  const totalAmount =
    Number(amount) || 0;

  const amountPerPerson =
    people.length > 0
      ? totalAmount /
        people.length
      : 0;

  // =========================================================
  // ADD PERSON
  // =========================================================

  const addPerson = () => {
    const trimmedName =
      name.trim();

    if (!trimmedName) return;

    const exists =
      people.some(
        (person) =>
          person.toLowerCase() ===
          trimmedName.toLowerCase()
      );

    if (exists) {
      alert(
        "This person is already included."
      );

      return;
    }

    setPeople(
      (current) => [
        ...current,
        trimmedName,
      ]
    );

    setName("");
  };

  // =========================================================
  // REMOVE PERSON
  // =========================================================

  const removePerson = (
    indexToRemove
  ) => {
    setPeople(
      (current) =>
        current.filter(
          (_, index) =>
            index !==
            indexToRemove
        )
    );
  };

  // =========================================================
  // COMPRESS RECEIPT
  // =========================================================

  const compressImage = (
    file
  ) => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = (
          event
        ) => {
          const image =
            new Image();

          image.onload =
            () => {
              const canvas =
                document.createElement(
                  "canvas"
                );

              const maxWidth =
                900;

              const maxHeight =
                1200;

              let width =
                image.width;

              let height =
                image.height;

              if (
                width >
                maxWidth
              ) {
                height =
                  (height *
                    maxWidth) /
                  width;

                width =
                  maxWidth;
              }

              if (
                height >
                maxHeight
              ) {
                width =
                  (width *
                    maxHeight) /
                  height;

                height =
                  maxHeight;
              }

              canvas.width =
                width;

              canvas.height =
                height;

              const context =
                canvas.getContext(
                  "2d"
                );

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
                  0.55
                );

              resolve(
                compressed
              );
            };

          image.onerror =
            () =>
              reject(
                new Error(
                  "Unable to process image."
                )
              );

          image.src =
            event.target.result;
        };

        reader.onerror =
          () =>
            reject(
              new Error(
                "Unable to read image."
              )
            );

        reader.readAsDataURL(
          file
        );
      }
    );
  };

  const handleReceiptChange =
    async (event) => {
      const file =
        event.target
          .files?.[0];

      if (!file) return;

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        alert(
          "Please select an image."
        );

        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        alert(
          "Please use an image smaller than 10MB."
        );

        return;
      }

      try {
        const compressed =
          await compressImage(
            file
          );

        if (
          compressed.length >
          700000
        ) {
          alert(
            "Receipt is too large. Please use a smaller image."
          );

          return;
        }

        setReceipt(compressed);
        setReceiptPreview(
          compressed
        );
      } catch (error) {
        console.error(
          "Receipt error:",
          error
        );

        alert(
          "Unable to process receipt."
        );
      }
    };

  // =========================================================
  // SAVE
  // =========================================================

  const submitSplit =
    async () => {
      if (
        !addedBy.trim()
      ) {
        alert(
          "Please enter who paid for this split."
        );

        return;
      }

      if (
        !description.trim()
      ) {
        alert(
          "Please enter the purpose of this split."
        );

        return;
      }

      if (
        totalAmount <= 0
      ) {
        alert(
          "Please enter a valid amount."
        );

        return;
      }

      if (
        people.length === 0
      ) {
        alert(
          "Please add at least one person."
        );

        return;
      }

      const success =
        await onSave({
          totalAmount,
          amountPerPerson,
          people,

          addedBy:
            addedBy.trim(),

          description:
            description.trim(),

          receiptBase64:
            receipt,
        });

      if (success) {
        setAmount("");
        setName("");
        setPeople([]);
        setAddedBy("");
        setDescription("");
        setReceipt(null);
        setReceiptPreview(null);
      }
    };

  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-2xl sm:p-5 md:p-7">

      <div className="mb-6">

        <p className="text-sm text-slate-400">
          New expense
        </p>

        <h2 className="text-xl font-bold sm:text-2xl">
          Split Calculator
        </h2>

      </div>

      {/* ADDED BY */}

      <div className="mb-5">

        <label className="mb-2 block text-sm text-slate-300">
          Added By
          <span className="ml-1 text-red-400">
            *
          </span>
        </label>

        <input
          type="text"
          value={addedBy}
          onChange={(event) =>
            setAddedBy(
              event.target.value
            )
          }
          placeholder="Example: Marl"
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base outline-none focus:border-cyan-400/50"
        />

      </div>

      {/* DESCRIPTION */}

      <div className="mb-5">

        <label className="mb-2 block text-sm text-slate-300">
          Description
          <span className="ml-1 text-red-400">
            *
          </span>
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="Example: Dinner"
          rows={3}
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none focus:border-cyan-400/50"
        />

      </div>

      {/* AMOUNT */}

      <div className="mb-5">

        <label className="mb-2 block text-sm text-slate-300">
          Total Amount
          <span className="ml-1 text-red-400">
            *
          </span>
        </label>

        <div className="relative">

          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
            ₱
          </span>

          <input
            type="number"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value
              )
            }
            min="0"
            step="0.01"
            placeholder="0.00"
            className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-lg outline-none focus:border-cyan-400/50"
          />

        </div>

      </div>

      {/* PEOPLE */}

      <div className="mb-5">

        <label className="mb-2 block text-sm text-slate-300">
          People Included
          <span className="ml-1 text-red-400">
            *
          </span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">

          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();
                addPerson();
              }
            }}
            placeholder="Person's name"
            className="min-h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-base outline-none"
          />

          <button
            type="button"
            onClick={addPerson}
            className="min-h-12 rounded-2xl bg-white/10 px-5 font-semibold"
          >
            Add Person
          </button>

        </div>

      </div>

      {/* LIST */}

      <div className="mb-6 space-y-2">

        {people.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
            No people added.
          </div>
        ) : (
          people.map(
            (
              person,
              index
            ) => (
              <div
                key={`${person}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-3"
              >

                <span className="min-w-0 truncate">
                  {person}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    removePerson(
                      index
                    )
                  }
                  className="shrink-0 text-xs text-red-300"
                >
                  Remove
                </button>

              </div>
            )
          )
        )}

      </div>

      {/* RECEIPT */}

      <div className="mb-6">

        <label className="mb-2 block text-sm text-slate-300">
          Receipt
          <span className="ml-2 text-xs text-slate-500">
            Optional
          </span>
        </label>

        {!receiptPreview ? (
          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5">

            <span className="text-3xl">
              🧾
            </span>

            <p className="mt-2 text-sm">
              Add Receipt
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleReceiptChange
              }
              className="hidden"
            />

          </label>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">

            <img
              src={receiptPreview}
              alt="Receipt preview"
              className="max-h-72 w-full object-contain"
            />

            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                setReceiptPreview(
                  null
                );
              }}
              className="min-h-11 w-full bg-red-500/10 text-sm text-red-300"
            >
              Remove Receipt
            </button>

          </div>
        )}

      </div>

      {/* RESULT */}

      <div className="mb-6 rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.06] p-5">

        <p className="text-sm text-slate-400">
          Each person pays
        </p>

        <p className="mt-1 text-3xl font-bold">
          ₱
          {amountPerPerson.toFixed(
            2
          )}
        </p>

        <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-sm">

          <span className="text-slate-400">
            People
          </span>

          <span>
            {people.length}
          </span>

        </div>

      </div>

      <button
        type="button"
        onClick={submitSplit}
        disabled={saving}
        className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 font-bold text-slate-950 disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : "Save Split"}
      </button>

    </section>
  );
}

export default SplitCalculator;