"use client";

import React, { useState } from "react";
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

type UserDetailedInformationFormData = z.infer<typeof userDetailedInformationSchema>;

interface UserDetailedInformationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserDetailedInformationFormData) => void;
  title?: string;
  defaultValues?: Partial<UserDetailedInformationFormData>;
}

const UserDetailedInformation: React.FC<UserDetailedInformationProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Detailed information",
  defaultValues,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<UserDetailedInformationFormData>({
    resolver: zodResolver(userDetailedInformationSchema),
    defaultValues: {
      realName: "Sayed Waqar Tanveer",
      ...defaultValues,
    },
  });

  const handleFormSubmit = async (data: UserDetailedInformationFormData) => {
    try {
      setIsSubmitting(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
    } catch (error) {
      // Show error toast
      toast({
        title: "Submission Failed",
        description: "There was an error saving your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
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
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
    </Modal>
  );
};

export default UserDetailedInformation;
