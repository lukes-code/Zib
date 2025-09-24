import React, { useState, useEffect } from "react";
import { Button, Variant } from "./button";

type Position = "defender" | "forward" | "goalie" | "any";

interface ConfirmationModalProps {
  open: boolean;
  onConfirm?: (choice?: Position) => void;
  onCancel?: () => void;
  confirmVariant?: Variant;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requireChoice?: boolean;
  hideButtons?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmVariant = "danger",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  requireChoice = false,
  hideButtons = false,
}) => {
  const [choice, setChoice] = useState<Position | null>(null);

  useEffect(() => {
    if (!open) setChoice(null);
  }, [open]);

  if (!open) return null;

  const positions: Position[] = ["defender", "forward", "goalie", "any"];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[7px] p-6 max-w-sm w-full shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
        <p className="mb-6 text-sm text-gray-700">{message}</p>

        {requireChoice && (
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setChoice(pos)}
                className={`px-4 py-2 rounded font-semibold text-base border-2 w-full ${
                  choice === pos
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>
        )}

        {hideButtons ? null : (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={() => onConfirm(choice ?? undefined)}
              disabled={requireChoice && !choice}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmationModal;
