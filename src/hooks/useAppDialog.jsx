import { useState } from "react";
import AppDialog from "../components/AppDialog.jsx";

function useAppDialog() {
  const [dialog, setDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
    showCancel: false,
    resolve: null,
  });

  const closeDialog = (result) => {
    if (dialog.resolve) {
      dialog.resolve(result);
    }

    setDialog((current) => ({
      ...current,
      open: false,
      resolve: null,
    }));
  };

  const showDialog = ({
    type = "info",
    title = "Money Splitter",
    message = "",
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
  }) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        showCancel,
        resolve,
      });
    });
  };

  const success = (title, message) =>
    showDialog({
      type: "success",
      title,
      message,
      confirmText: "Done",
    });

  const error = (title, message) =>
    showDialog({
      type: "error",
      title,
      message,
      confirmText: "OK",
    });

  const info = (title, message) =>
    showDialog({
      type: "info",
      title,
      message,
      confirmText: "OK",
    });

  const warning = (title, message) =>
    showDialog({
      type: "warning",
      title,
      message,
      confirmText: "OK",
    });

  const confirm = ({
    type = "warning",
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
  }) =>
    showDialog({
      type,
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true,
    });

  const Dialog = () => (
    <AppDialog
      {...dialog}
      onConfirm={() => closeDialog(true)}
      onCancel={() => closeDialog(false)}
    />
  );

  return {
    Dialog,
    success,
    error,
    info,
    warning,
    confirm,
  };
}

export default useAppDialog;