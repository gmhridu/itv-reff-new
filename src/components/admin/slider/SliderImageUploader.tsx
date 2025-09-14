"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  FileImage,
} from "lucide-react";
import { SliderImage, ApiResponse } from "@/types/admin";
import Image from "next/image";

interface SliderImageUploaderProps {
  onUploadSuccess: (images: SliderImage[]) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
}

interface UploadedImageData {
  file: File;
  url: string;
  altText: string;
  preview: string;
}

export function SliderImageUploader({
  onUploadSuccess,
  uploading,
  setUploading,
}: SliderImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImageData[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const remainingSlots = 5 - uploadedImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        toast({
          title: "Upload Limit",
          description: `Only ${remainingSlots} more images can be added. Maximum 5 images total.`,
          variant: "destructive",
        });
      }

      filesToProcess.forEach((file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid File",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          });
          return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast({
            title: "File Too Large",
            description: `${file.name} is too large. Maximum size is 10MB.`,
            variant: "destructive",
          });
          return;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        const newImage: UploadedImageData = {
          file,
          url: "",
          altText: "",
          preview: previewUrl,
        };

        setUploadedImages((prev) => [...prev, newImage]);
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadedImages.length, toast],
  );

  // Remove uploaded image
  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const imageToRemove = prev[index];
      // Revoke object URL to prevent memory leaks
      if (imageToRemove.preview.startsWith("blob:")) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Update alt text for an image
  const updateAltText = (index: number, altText: string) => {
    setUploadedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, altText } : img)),
    );
  };

  // Upload single image to Cloudinary via server API
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload/slider-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server upload failed: ${response.statusText}`);
    }

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    return result.data.url;
  };

  // Submit images to database
  const handleSubmit = async () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "No Images",
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload all images to Cloudinary first
      const uploadPromises = uploadedImages.map(async (imageData, index) => {
        setUploadProgress(((index + 1) / uploadedImages.length) * 50);

        try {
          const cloudinaryUrl = await uploadImageToCloudinary(imageData.file);
          return {
            url: cloudinaryUrl,
            altText: imageData.altText || null,
            isActive: true,
          };
        } catch (error) {
          console.error(`Failed to upload ${imageData.file.name}:`, error);
          throw new Error(`Failed to upload ${imageData.file.name}`);
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      setUploadProgress(75);

      // Save to database
      const response = await fetch("/api/admin/slider-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uploadResults),
      });

      const data: ApiResponse = await response.json();
      setUploadProgress(100);

      if (data.success) {
        onUploadSuccess(data.data);

        // Clean up object URLs
        uploadedImages.forEach((img) => {
          if (img.preview.startsWith("blob:")) {
            URL.revokeObjectURL(img.preview);
          }
        });

        setUploadedImages([]);
        toast({
          title: "Success",
          description: `Successfully uploaded ${uploadResults.length} slider image${uploadResults.length > 1 ? "s" : ""}`,
        });
      } else {
        throw new Error(data.error || "Failed to save slider images");
      }
    } catch (error) {
      console.error("Error uploading slider images:", error);
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload slider images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Upload Section */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
            <ImageIcon className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium mb-2">Upload Slider Images</h3>
          <p className="text-muted-foreground mb-4">
            Select up to {5 - uploadedImages.length} more images (JPG, PNG,
            WebP, max 10MB each)
          </p>

          <Button
            onClick={triggerFileInput}
            disabled={uploadedImages.length >= 5 || uploading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <FileImage className="h-4 w-4 mr-2" />
            {uploadedImages.length === 0
              ? "Select Images"
              : `Add More (${5 - uploadedImages.length} remaining)`}
          </Button>

          {uploadedImages.length >= 5 && (
            <div className="mt-4 flex items-center justify-center text-amber-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Maximum 5 images reached</span>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Selected Images ({uploadedImages.length}/5)
          </h4>

          <div className="grid gap-4">
            {uploadedImages.map((image, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image Preview */}
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={image.preview}
                        alt={`Upload preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.png";
                        }}
                      />
                    </div>

                    {/* Image Details */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label
                          htmlFor={`alt-${index}`}
                          className="text-sm font-medium"
                        >
                          Alt Text (Optional)
                        </Label>
                        <Textarea
                          id={`alt-${index}`}
                          placeholder="Describe this image for accessibility..."
                          value={image.altText}
                          onChange={(e) => updateAltText(index, e.target.value)}
                          className="mt-1 resize-none"
                          rows={2}
                          disabled={uploading}
                        />
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <div>File: {image.file.name}</div>
                        <div>
                          Size: {(image.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <div>Order: {index + 1}</div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(index)}
                      disabled={uploading}
                      className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {uploadProgress < 50
                ? "Uploading to Cloudinary..."
                : uploadProgress < 100
                  ? "Saving to database..."
                  : "Complete!"}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            // Clean up object URLs
            uploadedImages.forEach((img) => {
              if (img.preview.startsWith("blob:")) {
                URL.revokeObjectURL(img.preview);
              }
            });
            setUploadedImages([]);
          }}
          disabled={uploading || uploadedImages.length === 0}
        >
          Clear All
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={uploading || uploadedImages.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload {uploadedImages.length} Image
              {uploadedImages.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
