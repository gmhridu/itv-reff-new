"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FundPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundPasswordModal: React.FC<FundPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasFundPassword, setHasFundPassword] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check if user already has a fund password set
  useEffect(() => {
    if (isOpen) {
      checkFundPasswordStatus();
    }
  }, [isOpen]);

  const checkFundPasswordStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch("/api/user/fund-password/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasFundPassword(data.hasFundPassword || false);
      }
    } catch (error) {
      console.error("Error checking fund password status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 6);
    setPin(numericValue);

    // Clear error when user starts typing
    if (errors.pin) {
      setErrors((prev) => ({ ...prev, pin: "" }));
    }
  };

  const handleConfirmPinChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 6);
    setConfirmPin(numericValue);

    // Clear error when user starts typing
    if (errors.confirmPin) {
      setErrors((prev) => ({ ...prev, confirmPin: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!pin) {
      newErrors.pin = "Fund password is required";
    } else if (pin.length !== 6) {
      newErrors.pin = "Fund password must be exactly 6 digits";
    }

    if (!hasFundPassword) {
      if (!confirmPin) {
        newErrors.confirmPin = "Please confirm your fund password";
      } else if (pin !== confirmPin) {
        newErrors.confirmPin = "Fund passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = hasFundPassword
        ? "/api/user/fund-password/change"
        : "/api/user/fund-password/set";

      const requestBody = hasFundPassword
        ? { fundPassword: pin }
        : { fundPassword: pin };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: hasFundPassword
            ? "Fund password changed successfully!"
            : "Fund password set successfully!",
        });
        setPin("");
        setConfirmPin("");
        onClose();
      } else {
        if (data.error === "Invalid current fund password") {
          setErrors({ pin: "Current fund password is incorrect" });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to update fund password",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Fund password error:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setConfirmPin("");
    setErrors({});
    onClose();
  };

  const renderPinInput = (
    value: string,
    onChange: (value: string) => void,
    label: string,
    placeholder: string,
    error?: string,
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            type="password"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => {
              const newValue = value.split("");
              newValue[index] = e.target.value.replace(/[^0-9]/g, "");
              const result = newValue.join("").slice(0, 6);
              onChange(result);

              // Auto-focus next input
              if (e.target.value && index < 5) {
                const nextInput = e.target.parentElement?.children[
                  index + 1
                ] as HTMLInputElement;
                nextInput?.focus();
              }
            }}
            onKeyDown={(e) => {
              // Handle backspace to go to previous input
              if (
                e.key === "Backspace" &&
                !e.currentTarget.value &&
                index > 0
              ) {
                const prevInput = e.currentTarget.parentElement?.children[
                  index - 1
                ] as HTMLInputElement;
                prevInput?.focus();
              }
            }}
            className={`w-12 h-12 text-center text-lg font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
            }`}
            placeholder="•"
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );

  if (isCheckingStatus) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Fund Password"
        size="md"
      >
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={hasFundPassword ? "Change Fund Password" : "Set Fund Password"}
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
          <Shield className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-purple-800 font-medium">
              {hasFundPassword
                ? "Update Your Fund Password"
                : "Secure Your Funds"}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              {hasFundPassword
                ? "Enter your new 6-digit fund password"
                : "Create a 6-digit PIN to secure your fund operations"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-amber-800">
              <strong>Important:</strong> Your fund password will be required
              for all withdrawal operations. Please remember this password as it
              cannot be recovered.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderPinInput(
            pin,
            handlePinChange,
            hasFundPassword ? "New Fund Password" : "Fund Password",
            "Enter 6 digits",
            errors.pin,
          )}

          {!hasFundPassword &&
            renderPinInput(
              confirmPin,
              handleConfirmPinChange,
              "Confirm Fund Password",
              "Enter 6 digits",
              errors.confirmPin,
            )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                pin.length !== 6 ||
                (!hasFundPassword && confirmPin.length !== 6)
              }
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {hasFundPassword ? "Updating..." : "Setting..."}
                </div>
              ) : hasFundPassword ? (
                "Update Password"
              ) : (
                "Set Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default FundPasswordModal;
