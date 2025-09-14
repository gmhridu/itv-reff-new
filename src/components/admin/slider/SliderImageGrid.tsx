"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, Trash2, GripVertical, Eye, EyeOff, Save, X } from "lucide-react";
import { SliderImage, ApiResponse } from "@/types/admin";
import Image from "next/image";

interface SliderImageGridProps {
  images: SliderImage[];
  onImageUpdate: (image: SliderImage) => void;
  onImageDelete: (imageId: string) => void;
  onOrderUpdate: (newOrder: { id: string; order: number }[]) => void;
}

interface SortableItemProps {
  image: SliderImage;
  onEdit: (image: SliderImage) => void;
  onDelete: (imageId: string) => void;
  onToggleStatus: (imageId: string) => void;
}

function SortableItem({
  image,
  onEdit,
  onDelete,
  onToggleStatus,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`relative group ${isDragging ? "shadow-lg" : ""}`}>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Image Preview */}
            <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-muted">
              {/* Temporary fallback while server restarts */}
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.altText || `Slider image ${image.order}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-image.png";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Loading...</span>
                </div>
              )}
            </div>

            {/* Image Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Order: {image.order}</span>
                <Badge variant={image.isActive ? "default" : "secondary"}>
                  {image.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {image.altText || "No alt text"}
              </p>
              <p className="text-xs text-muted-foreground">
                Created: {new Date(image.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStatus(image.id)}
                className="h-8 w-8 p-0"
              >
                {image.isActive ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(image)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(image.id)}
                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SliderImageGrid({
  images,
  onImageUpdate,
  onImageDelete,
  onOrderUpdate,
}: SliderImageGridProps) {
  const [editingImage, setEditingImage] = useState<SliderImage | null>(null);
  const [editForm, setEditForm] = useState({
    altText: "",
    isActive: true,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((item) => item.id === active.id);
      const newIndex = images.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(images, oldIndex, newIndex);
      const orderUpdates = newOrder.map((image, index) => ({
        id: image.id,
        order: index + 1,
      }));

      onOrderUpdate(orderUpdates);
    }
  };

  // Handle edit
  const handleEdit = (image: SliderImage) => {
    setEditingImage(image);
    setEditForm({
      altText: image.altText || "",
      isActive: image.isActive,
    });
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingImage) return;

    setUpdating(true);

    try {
      const response = await fetch(
        `/api/admin/slider-images/${editingImage.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            altText: editForm.altText || null,
            isActive: editForm.isActive,
          }),
        },
      );

      const data: ApiResponse = await response.json();

      if (data.success) {
        onImageUpdate(data.data);
        setEditingImage(null);
        toast({
          title: "Success",
          description: "Slider image updated successfully",
        });
      } else {
        throw new Error(data.error || "Failed to update image");
      }
    } catch (error) {
      console.error("Error updating image:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update image",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = async (imageId: string) => {
    try {
      const response = await fetch(`/api/admin/slider-images/${imageId}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        onImageDelete(imageId);
        toast({
          title: "Success",
          description: "Slider image deleted successfully",
        });
      } else {
        throw new Error(data.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (imageId: string) => {
    try {
      const image = images.find((img) => img.id === imageId);
      if (!image) return;

      const response = await fetch(`/api/admin/slider-images/${imageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !image.isActive,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        onImageUpdate(data.data);
        toast({
          title: "Success",
          description: `Image ${!image.isActive ? "activated" : "deactivated"} successfully`,
        });
      } else {
        throw new Error(data.error || "Failed to toggle status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        title: "Error",
        description: "Failed to toggle image status",
        variant: "destructive",
      });
    }
  };

  if (images.length === 0) {
    return null;
  }

  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedImages.map((image) => image.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sortedImages.map((image) => (
              <SortableItem
                key={image.id}
                image={image}
                onEdit={handleEdit}
                onDelete={setDeletingId}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Dialog */}
      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Slider Image</DialogTitle>
            <DialogDescription>
              Update the alt text and status of the slider image.
            </DialogDescription>
          </DialogHeader>

          {editingImage && (
            <div className="space-y-6">
              {/* Image Preview */}
              <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted">
                <img
                  src={editingImage.url}
                  alt={editingImage.altText || "Slider image"}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-alt-text">Alt Text</Label>
                  <Textarea
                    id="edit-alt-text"
                    placeholder="Describe this image for accessibility..."
                    value={editForm.altText}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        altText: e.target.value,
                      }))
                    }
                    className="mt-1 resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alt text helps screen readers describe the image to visually
                    impaired users.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={editForm.isActive}
                    onCheckedChange={(checked) =>
                      setEditForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="edit-active">
                    Active (visible on homepage slider)
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingImage(null)}
              disabled={updating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Image
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slider Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slider image? This action
              cannot be undone. The image will be permanently removed from the
              slider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
