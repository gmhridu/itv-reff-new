"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Upload,
  Play,
  Trash2,
  Edit,
  X,
  CalendarIcon,
  Eye,
  EyeOff,
  Clock,
  Tag,
  Loader2,
  FileVideo,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Image as ImageIcon,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  VideoManagement,
  PositionLevelInfo,
  ApiResponse,
  VideoUploadForm,
  PaginatedResponse,
} from "@/types/admin";
import {
  ChunkedUploadClient,
  createChunkedUploadClient,
  formatFileSize,
  formatDuration,
  UploadProgressTracker,
} from "@/lib/chunked-upload-client";
import { useSimpleUploadProgress } from "@/hooks/use-upload-progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

interface VideoUploadState {
  videos: VideoManagement[];
  positionLevels: PositionLevelInfo[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  currentVideo: VideoManagement | null;
  editingVideo: VideoManagement | null;
  uploadProgress: number;
  uploadStatus: string;
  useChunkedUpload: boolean;
}

interface UploadFormData {
  title: string;
  description: string;
  rewardAmount: number;
  positionLevelId: string;
  availableFrom: Date | undefined;
  availableTo: Date | undefined;
  tags: string[];
  isActive: boolean;
  uploadMethod: "file";
  duration: number;
}

export function VideoUploadClient() {
  const [state, setState] = useState<VideoUploadState>({
    videos: [],
    positionLevels: [],
    loading: true,
    uploading: false,
    error: null,
    currentVideo: null,
    editingVideo: null,
    uploadProgress: 0,
    uploadStatus: "",
    useChunkedUpload: false,
  });

  const [formData, setFormData] = useState<UploadFormData>({
    title: "",
    description: "",
    rewardAmount: 0,
    positionLevelId: "all",
    availableFrom: undefined,
    availableTo: undefined,
    tags: [],
    isActive: true,
    uploadMethod: "file",
    duration: 0,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [chunkedUploadClient, setChunkedUploadClient] =
    useState<ChunkedUploadClient | null>(null);
  const [uploadAbortController, setUploadAbortController] =
    useState<AbortController | null>(null);

  // Use the simple progress tracking hook
  const progressTracker = useSimpleUploadProgress();
  const progressTrackerRef = useRef(progressTracker);
  progressTrackerRef.current = progressTracker;

  const { toast } = useToast();

  // Initialize chunked upload client
  useEffect(() => {
    const client = createChunkedUploadClient({
      chunkSize: 10 * 1024 * 1024, // 10MB chunks
      maxRetries: 3,
      retryDelay: 1000,
      onProgress: (progress) => {
        progressTrackerRef.current.updateProgress(Math.round(progress));
      },
      onChunkProgress: (chunkIndex, totalChunks) => {
        if (totalChunks === -1) {
          // Retry indicator
          progressTrackerRef.current.updateProgress(
            progressTrackerRef.current.progress,
            `Retrying chunk ${chunkIndex + 1}...`,
          );
        } else {
          const chunkProgress = Math.round(
            ((chunkIndex + 1) / totalChunks) * 100,
          );
          progressTrackerRef.current.updateProgress(
            chunkProgress,
            `Uploading chunk ${chunkIndex + 1}/${totalChunks}...`,
          );
        }
      },
      onError: (error) => {
        toast({
          title: "Upload Error",
          description: error.message,
          variant: "destructive",
        });
        progressTrackerRef.current.resetUpload();
      },
      onComplete: (result) => {
        if (result.success) {
          progressTrackerRef.current.completeUpload(
            "Video uploaded successfully!",
          );
          toast({
            title: "Success",
            description: "Video uploaded successfully",
          });
          fetchInitialData();
        }
      },
    });

    setChunkedUploadClient(client);
  }, []); // Remove progressTracker dependency

  // Memoized callback for position level change
  const handlePositionLevelChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      positionLevelId: value,
    }));
  }, []);

  // Upload method is fixed to "file" only
  const handleUploadMethodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      uploadMethod: "file",
    }));
  };

  // Memoized callbacks for form field changes
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        title: e.target.value,
      }));
    },
    [],
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        description: e.target.value,
      }));
    },
    [],
  );

  // Auto-calculate reward amount based on selected position level
  const calculateRewardAmount = useCallback(() => {
    const selectedLevel = state.positionLevels.find(
      (level) => level.id === formData.positionLevelId,
    );
    return selectedLevel ? selectedLevel.unitPrice : 0;
  }, [state.positionLevels, formData.positionLevelId]);

  // Update reward amount when position level changes
  useEffect(() => {
    const rewardAmount = calculateRewardAmount();
    setFormData((prev) => ({
      ...prev,
      rewardAmount,
    }));
  }, [calculateRewardAmount]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle file preview and automatic chunked upload detection
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      // Automatically suggest chunked upload for files > 100MB
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      const shouldUseChunked = fileSizeMB > 100;

      setState((prev) => ({ ...prev, useChunkedUpload: shouldUseChunked }));

      if (shouldUseChunked) {
        toast({
          title: "Large File Detected",
          description: `File size: ${formatFileSize(selectedFile.size)}. Chunked upload will be used for better reliability.`,
        });
      }

      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  const fetchInitialData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const [positionLevelsResponse, videosResponse] = await Promise.all([
        fetch("/api/admin/videos/upload"),
        fetch("/api/admin/videos?page=1&limit=10"),
      ]);

      if (!positionLevelsResponse.ok || !videosResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const positionLevelsResult: ApiResponse<PositionLevelInfo[]> =
        await positionLevelsResponse.json();
      const videosResult: ApiResponse<PaginatedResponse<VideoManagement>> =
        await videosResponse.json();

      if (!positionLevelsResult.success || !videosResult.success) {
        throw new Error("Failed to load data");
      }

      setState((prev) => ({
        ...prev,
        positionLevels: positionLevelsResult.data || [],
        videos: videosResult.data?.data || [],
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));

      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      });
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("video/")) {
          setSelectedFile(file);

          // Auto-detect duration when file is dropped
          const video = document.createElement("video");
          video.preload = "metadata";

          video.onloadedmetadata = () => {
            const duration = Math.round(video.duration);
            console.log(
              "Auto-detected video duration (drop):",
              duration,
              "seconds",
            );
            setFormData((prev) => ({
              ...prev,
              duration: duration,
            }));
            URL.revokeObjectURL(video.src);
          };

          video.onerror = () => {
            console.warn(
              "Failed to auto-detect video duration from dropped file",
            );
            URL.revokeObjectURL(video.src);
          };

          video.src = URL.createObjectURL(file);
        } else {
          toast({
            title: "Invalid file type",
            description: "Please select a video file",
            variant: "destructive",
          });
        }
      }
    },
    [toast],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Auto-detect duration when file is selected
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration);
        console.log("Auto-detected video duration:", duration, "seconds");
        setFormData((prev) => ({
          ...prev,
          duration: duration,
        }));
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        console.warn("Failed to auto-detect video duration");
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setThumbnailFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
    }
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Title is required";
    if (formData.positionLevelId === "all")
      return "Please select a position level";

    if (!selectedFile) return "Please select a video file";

    // Duration is auto-detected from video file, no validation needed

    if (formData.availableFrom && formData.availableTo) {
      const fromDate = new Date(formData.availableFrom);
      const toDate = new Date(formData.availableTo);
      if (fromDate >= toDate) {
        return "Available from date must be before available to date";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    try {
      setState((prev) => ({ ...prev, uploading: true }));
      progressTracker.startUpload("Preparing upload...");

      // Check if we should use chunked upload
      const shouldUseChunked =
        formData.uploadMethod === "file" &&
        selectedFile &&
        (state.useChunkedUpload || selectedFile.size > 100 * 1024 * 1024);

      if (shouldUseChunked && selectedFile && chunkedUploadClient) {
        // Use chunked upload for large files
        progressTracker.updateProgress(0, "Starting chunked upload...");

        const videoMetadata = {
          title: formData.title,
          description: formData.description,
          rewardAmount: formData.rewardAmount,
          positionLevelId:
            formData.positionLevelId === "all"
              ? undefined
              : formData.positionLevelId,
          availableFrom: formData.availableFrom?.toISOString(),
          availableTo: formData.availableTo?.toISOString(),
          tags: formData.tags.join(","),
          isActive: formData.isActive,
        };

        const result = await chunkedUploadClient.uploadFile(
          selectedFile,
          videoMetadata,
          thumbnailFile || undefined,
        );

        if (!result.success) {
          throw new Error(result.error || "Chunked upload failed");
        }

        toast({
          title: "Success",
          description: "Video uploaded successfully using chunked upload!",
        });
      } else {
        // Use traditional upload for small files with progress simulation
        progressTracker.updateProgress(0, "Uploading...");

        // Create abort controller for traditional upload
        const abortController = new AbortController();
        setUploadAbortController(abortController);

        // Simulate progress for traditional upload
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          if (currentProgress < 90) {
            currentProgress += Math.random() * 15 + 5; // Random increment between 5-20
            progressTracker.updateProgress(Math.min(currentProgress, 90));
          }
        }, 800);

        const uploadFormData = new FormData();

        // Add form fields
        Object.entries(formData).forEach(([key, value]) => {
          if (
            value !== null &&
            value !== undefined &&
            !["durationHours", "durationMinutes", "durationSeconds"].includes(
              key,
            )
          ) {
            // Handle special cases
            if (key === "positionLevelId" && value === "all") {
              uploadFormData.append(key, "");
            } else if (key === "availableFrom" && value instanceof Date) {
              uploadFormData.append(key, value.toISOString());
            } else if (key === "availableTo" && value instanceof Date) {
              uploadFormData.append(key, value.toISOString());
            } else if (key === "tags" && Array.isArray(value)) {
              uploadFormData.append(key, value.join(","));
            } else if (typeof value === "string" && value !== "") {
              uploadFormData.append(key, value);
            } else if (
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              uploadFormData.append(key, value.toString());
            }
          }
        });

        // Add files for file upload method
        if (formData.uploadMethod === "file" && selectedFile) {
          uploadFormData.append("videoFile", selectedFile);
          if (thumbnailFile) {
            uploadFormData.append("thumbnailFile", thumbnailFile);
          }
        }

        // Debug logging before submission
        console.log("Form submission debug:", {
          uploadMethod: formData.uploadMethod,
          title: formData.title,
          formDataKeys: Array.from(uploadFormData.keys()),
        });

        const response = await fetch("/api/admin/videos/upload", {
          method: "POST",
          body: uploadFormData,
          signal: abortController.signal,
        });

        // Clear progress simulation and complete
        clearInterval(progressInterval);
        progressTracker.updateProgress(100, "Processing...");

        const result: ApiResponse = await response.json();

        if (!result.success) {
          // If regular upload fails due to timeout/size, suggest chunked upload
          if (
            (result.error?.includes("timeout") ||
              result.error?.includes("too large")) &&
            selectedFile &&
            selectedFile.size > 50 * 1024 * 1024
          ) {
            setState((prev) => ({ ...prev, useChunkedUpload: true }));
            toast({
              title: "Upload Failed",
              description: `${result.error} Please try again with chunked upload (automatically enabled).`,
              variant: "destructive",
            });
            return;
          }
          throw new Error(result.error || "Upload failed");
        }

        progressTracker.completeUpload("Upload completed successfully!");
        toast({
          title: "Success",
          description: "Video uploaded successfully!",
        });
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        rewardAmount: 0,
        positionLevelId: "all",
        availableFrom: undefined,
        availableTo: undefined,
        tags: [],
        isActive: true,
        uploadMethod: "file",
        duration: 0,
      });
      setSelectedFile(null);
      setThumbnailFile(null);
      setPreviewUrl(null);

      // Refresh video list
      await fetchInitialData();

      // Switch to management tab
      setActiveTab("management");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // If it's a timeout error, suggest chunked upload
      if (
        errorMessage.includes("timeout") &&
        selectedFile &&
        selectedFile.size > 50 * 1024 * 1024
      ) {
        setState((prev) => ({ ...prev, useChunkedUpload: true }));
        toast({
          title: "Tip",
          description:
            "For large files, chunked upload has been enabled automatically.",
        });
      }
    } finally {
      setUploadAbortController(null);
      setState((prev) => ({ ...prev, uploading: false }));
      if (!progressTracker.isUploading) {
        progressTracker.resetUpload();
      }
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: "DELETE",
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Delete failed");
      }

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });

      // Refresh video list
      await fetchInitialData();
      setDeleteVideoId(null);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setDeleteVideoId(null);
    }
  };

  const handleEditVideo = (video: VideoManagement) => {
    setState((prev) => ({ ...prev, editingVideo: video }));

    // Populate form with video data
    const hours = Math.floor(video.duration / 3600);
    const minutes = Math.floor((video.duration % 3600) / 60);
    const seconds = video.duration % 60;

    setFormData({
      title: video.title,
      description: video.description || "",
      rewardAmount: video.rewardAmount,
      positionLevelId: video.positionLevelId || "all",
      availableFrom: video.availableFrom
        ? new Date(video.availableFrom)
        : undefined,
      availableTo: video.availableTo ? new Date(video.availableTo) : undefined,
      tags: video.tags || [],
      isActive: video.isActive,
      uploadMethod: "file",
      duration: video.duration,
    });

    setEditDialogOpen(true);
  };

  const handleUpdateVideo = async () => {
    if (!state.editingVideo) return;

    try {
      setState((prev) => ({ ...prev, uploading: true }));

      const updateData = {
        title: formData.title,
        description: formData.description,
        rewardAmount: formData.rewardAmount,
        positionLevelId:
          formData.positionLevelId === "all" ? null : formData.positionLevelId,
        availableFrom: formData.availableFrom?.toISOString(),
        availableTo: formData.availableTo?.toISOString(),
        tags: formData.tags,
        isActive: formData.isActive,
      };

      const response = await fetch(
        `/api/admin/videos/${state.editingVideo.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Update failed");
      }

      toast({
        title: "Success",
        description: "Video updated successfully",
      });

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        rewardAmount: 0,
        positionLevelId: "all",
        availableFrom: undefined,
        availableTo: undefined,
        tags: [],
        isActive: true,
        uploadMethod: "file",
        duration: 0,
      });

      setState((prev) => ({ ...prev, editingVideo: null }));
      setEditDialogOpen(false);

      // Refresh video list
      await fetchInitialData();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setState((prev) => ({ ...prev, uploading: false }));
    }
  };

  const handleToggleStatus = async (videoId: string) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "toggle-status" }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Status toggle failed");
      }

      toast({
        title: "Success",
        description: result.message || "Status updated successfully",
      });

      // Refresh video list
      await fetchInitialData();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Video Management</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileVideo className="h-3 w-3" />
            {state.videos.length} Videos
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Video
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Manage Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Video</CardTitle>
              <CardDescription>
                Upload videos directly from files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="upload-method">Upload Method</Label>
                  <Tabs value="file" className="w-full">
                    <TabsList className="grid w-full grid-cols-1">
                      <TabsTrigger
                        value="file"
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        File Upload
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4">
                      <div className="space-y-4">
                        <div
                          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          {selectedFile ? (
                            <div className="space-y-4">
                              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                              <div>
                                <p className="font-medium">
                                  {selectedFile.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatFileSize(selectedFile.size)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedFile(null);
                                  setPreviewUrl(null);
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                              <div>
                                <p className="text-lg font-medium">
                                  Drag & drop your video file here
                                </p>
                                <p className="text-sm text-gray-500">
                                  or click to browse
                                </p>
                              </div>
                              <p className="text-xs text-gray-400">
                                Supports MP4, AVI, MOV, WMV, WEBM (Max 500MB)
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>

                        {selectedFile && (
                          <div className="space-y-3">
                            {/* Duration Status */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <Label className="text-sm font-medium">
                                  Video Duration
                                </Label>
                              </div>
                              <div className="text-sm font-mono">
                                {formData.duration > 0 ? (
                                  <span className="text-green-600 font-semibold">
                                    ✓ {formatDuration(formData.duration)}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">
                                    Detecting...
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Video Preview */}
                            {previewUrl && (
                              <div className="space-y-2">
                                <Label>Video Preview</Label>
                                <video
                                  src={previewUrl}
                                  controls
                                  className="w-full max-w-md rounded-lg"
                                  onLoadedMetadata={(e) => {
                                    const video = e.target as HTMLVideoElement;
                                    const duration = Math.round(video.duration);
                                    console.log(
                                      "Auto-detected video duration (preview):",
                                      duration,
                                      "seconds",
                                    );
                                    setFormData((prev) => ({
                                      ...prev,
                                      duration: duration,
                                    }));
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="thumbnail">
                            Custom Thumbnail (Optional)
                          </Label>
                          <div className="flex items-center gap-4">
                            <Input
                              id="thumbnail"
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailSelect}
                              className="flex-1"
                            />
                            {thumbnailFile && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <ImageIcon className="h-3 w-3" />
                                {thumbnailFile.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Video Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={handleTitleChange}
                        placeholder="Enter video title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        placeholder="Enter video description"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <div className="space-y-2">
                          <Input
                            id="tags"
                            placeholder="Type a tag and press Enter or comma"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            className="flex-1"
                          />
                          {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-900">
                              {formData.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                                >
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reward-amount">
                          Reward Amount (Auto-calculated)
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="reward-amount"
                            type="number"
                            placeholder="Select position level first"
                            className="pl-10 bg-gray-50"
                            value={formData.rewardAmount || ""}
                            disabled
                            readOnly
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          Reward amount is automatically calculated based on the
                          selected position level's unit price.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position-level">Position Level</Label>
                      <Select
                        value={formData.positionLevelId}
                        onValueChange={handlePositionLevelChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {state.positionLevels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name} (Level {level.level})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Available From</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.availableFrom &&
                                  "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.availableFrom ? (
                                format(formData.availableFrom, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.availableFrom}
                              onSelect={(date) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  availableFrom: date,
                                }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Available To</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.availableTo &&
                                  "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.availableTo ? (
                                format(formData.availableTo, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.availableTo}
                              onSelect={(date) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  availableTo: date,
                                }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="is-active">Active</Label>
                      <Switch
                        id="is-active"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {state.uploading && (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {progressTracker.status || "Uploading..."}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {progressTracker.progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                          style={{ width: `${progressTracker.progress}%` }}
                        />
                      </div>
                      {state.useChunkedUpload && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Using chunked upload for better reliability
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={state.uploading}
                      className={`flex-1 md:flex-none ${
                        state.useChunkedUpload
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }`}
                    >
                      {state.uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {state.useChunkedUpload
                            ? "Uploading Chunks..."
                            : "Uploading..."}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {state.useChunkedUpload ? (
                            <span className="flex items-center">
                              Upload (Chunked)
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs bg-green-100 text-green-800 border-green-200"
                              >
                                Reliable
                              </Badge>
                            </span>
                          ) : (
                            "Upload Video"
                          )}
                        </>
                      )}
                    </Button>

                    {state.uploading && chunkedUploadClient && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (chunkedUploadClient) {
                            chunkedUploadClient.abort();
                          }
                          if (uploadAbortController) {
                            uploadAbortController.abort();
                          }
                          setState((prev) => ({ ...prev, uploading: false }));
                          progressTracker.resetUpload();
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  {/* Upload Tips */}
                  {selectedFile && !state.uploading && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      {selectedFile.size > 100 * 1024 * 1024 ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          Chunked upload will be used for this large file
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-blue-600" />
                          Standard upload will be used for this file
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>Video Management</CardTitle>
              <CardDescription>Manage your uploaded videos</CardDescription>
            </CardHeader>
            <CardContent>
              {state.loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {[...Array(6)].map((_, index) => (
                    <Card
                      key={index}
                      className="overflow-hidden flex flex-col h-full animate-pulse"
                    >
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
                      <CardContent className="p-3 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <div className="h-4 md:h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-10 md:h-12 mb-3">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                          <div className="space-y-1.5 mb-3 md:mb-4">
                            <div className="flex justify-between">
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                            </div>
                            <div className="flex justify-between">
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
                            </div>
                            <div className="flex justify-between">
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 md:gap-2">
                          <div className="h-8 md:h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                          <div className="h-8 md:h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                          <div className="h-8 md:h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : state.videos.length === 0 ? (
                <div className="text-center py-8">
                  <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No videos uploaded yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("upload")}
                  >
                    Upload First Video
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {state.videos.map((video) => (
                    <Card
                      key={video.id}
                      className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-900 rounded-xl"
                    >
                      {/* Thumbnail Section - No padding/gap */}
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FileVideo className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge
                            variant={video.isActive ? "default" : "secondary"}
                            className={cn(
                              "text-xs font-medium px-2 py-1 backdrop-blur-sm border-0",
                              video.isActive
                                ? "bg-green-500/90 text-white"
                                : "bg-gray-500/90 text-white",
                            )}
                          >
                            {video.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-3 left-3">
                          <Badge
                            variant="secondary"
                            className="bg-black/70 text-white border-0 text-xs font-medium px-2 py-1 backdrop-blur-sm"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(video.duration)}
                          </Badge>
                        </div>

                        {/* Views Badge */}
                        {video.totalViews > 0 && (
                          <div className="absolute bottom-3 right-3">
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/80 text-white border-0 text-xs font-medium px-2 py-1 backdrop-blur-sm"
                            >
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {video.totalViews}
                            </Badge>
                          </div>
                        )}

                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                            <Play className="h-8 w-8 text-gray-900 dark:text-white fill-current" />
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <CardContent>
                        <Accordion type="single" collapsible>
                          <AccordionItem value={video.id} title="Video Details">
                            <AccordionTrigger>
                              <div className="flex flex-col gap-2">
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                    {video.title}
                                  </h3>
                                </div>

                                {/* Description */}
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {video.description ||
                                      "No description available"}
                                  </p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                <div className="text-center">
                                  <div className="flex items-center justify-center mb-1">
                                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    ${video.rewardAmount}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Reward
                                  </p>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center mb-1">
                                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {video.totalViews || 0}
                                  </p>
                                  <p className="text-xs text-gray-500">Views</p>
                                </div>
                              </div>

                              {/* Level Info */}
                              <div className="flex items-center justify-center">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-3 py-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                >
                                  {video.positionLevel?.name || "All Levels"}
                                </Badge>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(video.id)}
                            className="flex-1 h-9"
                            title={video.isActive ? "Deactivate" : "Activate"}
                          >
                            {video.isActive ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditVideo(video)}
                            className="flex-1 h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Edit Video"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Delete Video"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5 text-red-600" />
                                  Delete Video
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  <strong>"{video.title}"</strong>? This action
                                  cannot be undone and will permanently remove
                                  the video from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteVideo(video.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Video
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>

                      {/* Hover Effect Border */}
                      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/20 transition-colors pointer-events-none" />
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Video Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Video
            </DialogTitle>
            <DialogDescription>
              Update the details for "{state.editingVideo?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Enter video title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Enter video description"
                rows={3}
              />
            </div>

            {/* Reward Amount and Position Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reward">
                  Reward Amount (Auto-calculated)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-reward"
                    type="number"
                    className="pl-10 bg-gray-50"
                    value={formData.rewardAmount}
                    disabled
                    readOnly
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Reward amount is automatically calculated based on the
                  selected position level's unit price.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-position">Position Level</Label>
                <Select
                  value={formData.positionLevelId}
                  onValueChange={handlePositionLevelChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {state.positionLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Video Status</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control whether this video is visible to users
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setState((prev) => ({ ...prev, editingVideo: null }));
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateVideo}
              disabled={state.uploading || !formData.title.trim()}
            >
              {state.uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Update Video
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
