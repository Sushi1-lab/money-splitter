import { useState } from "react";

function SplitCalculator({ onSave, saving }) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [people, setPeople] = useState([]);

  const [addedBy, setAddedBy] = useState("");
  const [description, setDescription] = useState("");

  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const totalAmount = Number(amount) || 0;

  const amountPerPerson =
    people.length > 0
      ? totalAmount / people.length
      : 0;

  // ============================================
  // ADD PERSON
  // ============================================

  const addPerson = () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    const alreadyExists = people.some(
      (person) =>
        person.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      alert("This person is already included.");
      return;
    }

    setPeople((currentPeople) => [
      ...currentPeople,
      trimmedName,
    ]);

    setName("");
  };

  // ============================================
  // REMOVE PERSON
  // ============================================

  const removePerson = (indexToRemove) => {
    setPeople((currentPeople) =>
      currentPeople.filter(
        (_, index) => index !== indexToRemove
      )
    );
  };

  // ============================================
  // COMPRESS RECEIPT
  // ============================================

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const image = new Image();

        image.onload = () => {
          const canvas = document.createElement("canvas");

          const maxWidth = 900;
          const maxHeight = 1200;

          let width = image.width;
          let height = image.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          const compressedBase64 =
            canvas.toDataURL(
              "image/jpeg",
              0.55
            );

          resolve(compressedBase64);
        };

        image.onerror = () => {
          reject(
            new Error("Unable to process image.")
          );
        };

        image.src = event.target.result;
      };

      reader.onerror = () => {
        reject(
          new Error("Unable to read image.")
        );
      };

      reader.readAsDataURL(file);
    });
  };

  // ============================================
  // RECEIPT
  // ============================================

  const handleReceiptChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Please use an image smaller than 10MB.");
      return;
    }

    try {
      const compressed =
        await compressImage(file);

      if (compressed.length > 700000) {
        alert(
          "The receipt is still too large. Please use a smaller image."
        );

        return;
      }

      setReceipt(compressed);
      setReceiptPreview(compressed);
    } catch (error) {
      console.error("Receipt error:", error);

      alert("Unable to process receipt.");
    }
  };

  const removeReceipt = () => {
    setReceipt(null);
    setReceiptPreview(null);
  };

  // ============================================
  // SAVE
  // ============================================

  const submitSplit = async () => {
    if (!addedBy.trim()) {
      alert("Please enter who added this split.");
      return;
    }

    if (!description.trim()) {
      alert("Please enter the purpose of this split.");
      return;
    }

    if (totalAmount <= 0) {
      alert("Please enter a valid total amount.");
      return;
    }

    if (people.length === 0) {
      alert("Please add at least one person.");
      return;
    }

    const success = await onSave({
      totalAmount,
      amountPerPerson,
      people,
      addedBy: addedBy.trim(),
      description: description.trim(),
      receiptBase64: receipt,
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
    <section className="rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-2xl md:p-7">

      {/* HEADER */}

      <div className="mb-6">
        <p className="text-sm text-slate-400">
          New expense
        </p>

        <h2 className="text-2xl font-bold">
          Split Calculator
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Fields marked * are required.
        </p>
      </div>

      {/* ADDED BY */}

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Added By
          <span className="ml-1 text-red-400">
            *
          </span>
        </label>

        <input
          type="text"
          value={addedBy}
          onChange={(event) =>
            setAddedBy(event.target.value)
          }
          placeholder="Who paid / added this split?"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/10"
        />
      </div>

      {/* DESCRIPTION */}

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Split Description
          <span className="ml-1 text-red-400">
            *
          </span>
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="What is this split for? Example: Dinner at Vikings"
          rows={3}
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/10"
        />
      </div>

      {/* TOTAL AMOUNT */}

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
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
              setAmount(event.target.value)
            }
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-10 pr-4 text-lg outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/10"
          />
        </div>
      </div>

      {/* ADD PERSON */}

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          People Included
          <span className="ml-1 text-red-400">
            *
          </span>
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addPerson();
              }
            }}
            placeholder="Enter person's name"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-purple-400/50"
          />

          <button
            type="button"
            onClick={addPerson}
            className="rounded-2xl border border-white/10 bg-white/10 px-5 font-semibold transition hover:bg-white/20"
          >
            Add
          </button>
        </div>
      </div>

      {/* PEOPLE LIST */}

      <div className="mb-6">

        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">
            Included
          </h3>

          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-400">
            {people.length}{" "}
            {people.length === 1
              ? "person"
              : "people"}
          </span>
        </div>

        {people.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-500">
            No people added yet.
          </div>
        ) : (
          <div className="space-y-2">

            {people.map((person, index) => (
              <div
                key={`${person}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
              >

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 font-bold text-slate-950">
                    {person
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span className="truncate">
                    {person}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    removePerson(index)
                  }
                  className="ml-3 text-xs text-red-300 transition hover:text-red-200"
                >
                  Remove
                </button>

              </div>
            ))}

          </div>
        )}
      </div>

      {/* RECEIPT */}

      <div className="mb-6">

        <label className="mb-2 block text-sm font-medium text-slate-300">
          Receipt
          <span className="ml-2 text-xs font-normal text-slate-500">
            Optional
          </span>
        </label>

        {!receiptPreview ? (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-7 text-center transition hover:bg-white/[0.07]">

            <div className="mb-3 text-3xl">
              🧾
            </div>

            <p className="text-sm font-medium">
              Add Receipt Image
            </p>

            <p className="mt-1 text-xs text-slate-500">
              JPG, PNG or WEBP
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptChange}
              className="hidden"
            />

          </label>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">

            <img
              src={receiptPreview}
              alt="Receipt preview"
              className="max-h-72 w-full bg-black/20 object-contain"
            />

            <div className="flex justify-end p-3">

              <button
                type="button"
                onClick={removeReceipt}
                className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20"
              >
                Remove Receipt
              </button>

            </div>

          </div>
        )}
      </div>

      {/* CALCULATION */}

      <div className="mb-6 rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/10 to-purple-500/10 p-6">

        <p className="text-sm text-slate-400">
          Each person pays
        </p>

        <h2 className="mt-1 text-4xl font-bold">
          ₱{amountPerPerson.toFixed(2)}
        </h2>

        <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">

          <div className="flex justify-between">
            <span className="text-slate-400">
              Total
            </span>

            <span className="font-semibold">
              ₱{totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">
              People
            </span>

            <span className="font-semibold">
              {people.length}
            </span>
          </div>

        </div>
      </div>

      {/* SAVE */}

      <button
        type="button"
        onClick={submitSplit}
        disabled={saving}
        className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 py-4 font-bold text-slate-950 shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : "Save Split"}
      </button>

    </section>
  );
}

export default SplitCalculator;