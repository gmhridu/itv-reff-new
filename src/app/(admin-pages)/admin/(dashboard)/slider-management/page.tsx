"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, AlertCircle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SliderImageGrid } from "@/components/admin/slider/SliderImageGrid";
import { SliderImageUploader } from "@/components/admin/slider/SliderImageUploader";
import { SliderImage, ApiResponse } from "@/types/admin";

export default function SliderManagementPage() {
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const { toast } = useToast();

  // Fetch slider images
  const fetchSliderImages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/slider-images");
      const data: ApiResponse = await response.json();

      if (data.success) {
        setSliderImages(data.data.sliderImages || []);
        // Fetch stats
        await fetchStats();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch slider images",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching slider images:", error);
      toast({
        title: "Error",
        description: "Failed to fetch slider images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/slider-images");
      const data: ApiResponse = await response.json();

      if (data.success) {
        const images = data.data.sliderImages || [];
        const active = images.filter((img: SliderImage) => img.isActive).length;
        setStats({
          total: images.length,
          active,
          inactive: images.length - active,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Handle upload success
  const handleUploadSuccess = (newImages: SliderImage[]) => {
    setSliderImages((prev) => [...prev, ...newImages]);
    setUploadDialogOpen(false);
    fetchStats();
    toast({
      title: "Success",
      description: `Successfully uploaded ${newImages.length} image${newImages.length > 1 ? "s" : ""}`,
    });
  };

  // Handle image update
  const handleImageUpdate = (updatedImage: SliderImage) => {
    setSliderImages((prev) =>
      prev.map((img) => (img.id === updatedImage.id ? updatedImage : img)),
    );
    fetchStats();
  };

  // Handle image delete
  const handleImageDelete = (deletedId: string) => {
    setSliderImages((prev) => prev.filter((img) => img.id !== deletedId));
    fetchStats();
  };

  // Handle order update
  const handleOrderUpdate = (newOrder: { id: string; order: number }[]) => {
    // Update local state optimistically
    const updatedImages = sliderImages.map((image) => {
      const orderUpdate = newOrder.find((item) => item.id === image.id);
      return orderUpdate ? { ...image, order: orderUpdate.order } : image;
    });

    // Sort by new order
    updatedImages.sort((a, b) => a.order - b.order);
    setSliderImages(updatedImages);

    // Update backend
    fetch("/api/admin/slider-images", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderUpdates: newOrder }),
    })
      .then((response) => response.json())
      .then((data: ApiResponse) => {
        if (data.success) {
          toast({
            title: "Success",
            description: "Slider order updated successfully",
          });
        } else {
          // Revert on error
          fetchSliderImages();
          toast({
            title: "Error",
            description: data.error || "Failed to update order",
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        console.error("Error updating order:", error);
        fetchSliderImages();
        toast({
          title: "Error",
          description: "Failed to update order",
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    fetchSliderImages();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Slider Management
          </h1>
          <p className="text-muted-foreground">
            Manage homepage slider images. Maximum 5 images can be uploaded at
            once.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchSliderImages}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Slider Images</DialogTitle>
                <DialogDescription>
                  Upload up to 5 slider images at once. Images will be uploaded
                  to Cloudinary and optimized automatically.
                </DialogDescription>
              </DialogHeader>
              <SliderImageUploader
                onUploadSuccess={handleUploadSuccess}
                uploading={uploading}
                setUploading={setUploading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Slider Images
          </CardTitle>
          <CardDescription>
            Drag and drop to reorder images. Click on an image to edit or delete
            it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Loading slider images...
                </p>
              </div>
            </div>
          ) : sliderImages.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                No slider images found
              </h3>
              <p className="text-muted-foreground mb-6">
                Get started by uploading your first slider image.
              </p>
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </div>
          ) : (
            <SliderImageGrid
              images={sliderImages}
              onImageUpdate={handleImageUpdate}
              onImageDelete={handleImageDelete}
              onOrderUpdate={handleOrderUpdate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
