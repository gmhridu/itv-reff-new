"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Modal from "./ui/modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User } from "lucide-react";

// Zod schema for form validation
const userDetailedInformationSchema = z.object({
  realName: z
    .string()
    .min(2, "Real name must be at least 2 characters")
    .max(50, "Real name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Real name can only contain letters and spaces"),
});

type UserDetailedInformationFormData = z.infer<
  typeof userDetailedInformationSchema
>;

interface UserDetailedInformationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserDetailedInformationFormData) => void;
  userId: string;
  title?: string;
  defaultValues?: Partial<UserDetailedInformationFormData>;
}

const UserDetailedInformation: React.FC<UserDetailedInformationProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
  title = "Detailed information",
  defaultValues,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<UserDetailedInformationFormData>({
    resolver: zodResolver(userDetailedInformationSchema),
    defaultValues: {
      realName: "",
      ...defaultValues,
    },
  });

  // Load existing user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isOpen || !userId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/user-profile?userId=${userId}`);
        if (response.ok) {
          const { data } = await response.json();
          if (data) {
            form.setValue("realName", data.realName);
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [isOpen, userId, form]);

  const handleFormSubmit = async (data: UserDetailedInformationFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/user-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...data,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Call the onSubmit prop with form data
        onSubmit(data);

        // Show success toast
        toast({
          title: "Information Updated Successfully!",
          description: "Your detailed information has been saved.",
          variant: "default",
        });

        // Close modal after successful submission
        onClose();
      } else {
        throw new Error(result.error || "Failed to save information");
      }
    } catch (error) {
      console.error("Error saving user profile:", error);
      // Show error toast
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error saving your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting && !isLoading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={title}
      size="md"
      closeOnOverlayClick={!isSubmitting && !isLoading}
      closeOnEscape={!isSubmitting && !isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading profile information...</span>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            {/* Real Name Field */}
            <FormField
              control={form.control}
              name="realName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Real Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full real name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Your legal name as it appears on official documents
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Information
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </Modal>
  );
};

export default UserDetailedInformation;
