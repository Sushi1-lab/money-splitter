import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

function AppDialog({
  open,
  type = "info",
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  const types = {
    success: {
      icon: CheckCircle2,
      iconBg: "bg-[#dff7eb]",
      iconColor: "text-[#16845b]",
      button: "bg-[#142a76] hover:bg-[#10245f]",
    },

    warning: {
      icon: AlertTriangle,
      iconBg: "bg-[#fff2d8]",
      iconColor: "text-[#c47b16]",
      button: "bg-[#142a76] hover:bg-[#10245f]",
    },

    danger: {
      icon: Trash2,
      iconBg: "bg-[#ffe7e7]",
      iconColor: "text-[#d74b4b]",
      button: "bg-[#d94c4c] hover:bg-[#c64040]",
    },

    error: {
      icon: XCircle,
      iconBg: "bg-[#ffe7e7]",
      iconColor: "text-[#d74b4b]",
      button: "bg-[#142a76] hover:bg-[#10245f]",
    },

    info: {
      icon: Info,
      iconBg: "bg-[#e4ebff]",
      iconColor: "text-[#294aad]",
      button: "bg-[#142a76] hover:bg-[#10245f]",
    },
  };

  const style = types[type] || types.info;
  const Icon = style.icon;

  const handleBackdrop = (event) => {
    if (
      event.target === event.currentTarget &&
      !loading
    ) {
      onCancel?.();
    }
  };

  return (
    <div
      onMouseDown={handleBackdrop}
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-[#081331]/55
        p-4
        backdrop-blur-[4px]
      "
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className="
          w-full
          max-w-[410px]
          overflow-hidden
          rounded-[26px]
          border border-white/60
          bg-[#f8faff]
          shadow-[0_25px_80px_rgba(8,19,49,0.28)]
        "
      >
        {/* TOP BLUE ACCENT */}

        <div className="h-1.5 bg-gradient-to-r from-[#10245f] via-[#294aad] to-[#5273d8]" />

        <div className="p-5 sm:p-6">
          {/* ICON + CLOSE */}

          <div className="flex items-start justify-between gap-4">
            <div
              className={`
                flex h-12 w-12
                shrink-0
                items-center justify-center
                rounded-[17px]
                ${style.iconBg}
                ${style.iconColor}
              `}
            >
              <Icon size={23} />
            </div>

            {!loading && (
              <button
                type="button"
                aria-label="Close"
                onClick={onCancel}
                className="
                  flex h-9 w-9
                  shrink-0
                  items-center justify-center
                  rounded-xl
                  text-[#8995aa]
                  transition
                  hover:bg-[#e9eef7]
                  hover:text-[#142a76]
                "
              >
                <X size={19} />
              </button>
            )}
          </div>

          {/* MESSAGE */}

          <div className="mt-5">
            <h2
              id="app-dialog-title"
              className="
                text-[20px]
                font-extrabold
                tracking-[-0.02em]
                text-[#182442]
              "
            >
              {title}
            </h2>

            {message && (
              <p
                className="
                  mt-2
                  whitespace-pre-line
                  text-[14px]
                  leading-6
                  text-[#71809a]
                "
              >
                {message}
              </p>
            )}
          </div>

          {/* BUTTONS */}

          <div
            className={`
              mt-6 grid gap-2
              ${
                showCancel
                  ? "grid-cols-2"
                  : "grid-cols-1"
              }
            `}
          >
            {showCancel && (
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="
                  min-h-[48px]
                  rounded-[14px]
                  border border-[#dce3ef]
                  bg-[#eef2f8]
                  px-4
                  text-sm
                  font-extrabold
                  text-[#52617d]
                  transition
                  hover:bg-[#e5eaf2]
                  disabled:opacity-50
                "
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`
                flex min-h-[48px]
                items-center justify-center
                gap-2
                rounded-[14px]
                px-4
                text-sm
                font-extrabold
                text-white
                shadow-[0_8px_22px_rgba(20,42,118,0.18)]
                transition
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${style.button}
              `}
            >
              {loading && (
                <span
                  className="
                    h-4 w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-white/40
                    border-t-white
                  "
                />
              )}

              {loading
                ? "Please wait..."
                : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppDialog;