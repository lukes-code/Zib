import { useState, useCallback } from "react";

export type ConfirmationState = {
  open: boolean;
  title: string;
  message: string;
  action: () => void | Promise<void>;
};

type UseConfirmationModal = {
  state: ConfirmationState;
  openConfirmation: (
    title: string,
    message: string,
    action: () => void | Promise<void>,
  ) => void;
  closeConfirmation: () => void;
};

export const useConfirmationModal = (): UseConfirmationModal => {
  const [state, setState] = useState<ConfirmationState>({
    open: false,
    title: "",
    message: "",
    action: () => {},
  });

  const openConfirmation = useCallback(
    (title: string, message: string, action: () => void | Promise<void>) => {
      setState({
        open: true,
        title,
        message,
        action,
      });
    },
    [],
  );

  const closeConfirmation = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    state,
    openConfirmation,
    closeConfirmation,
  };
};
