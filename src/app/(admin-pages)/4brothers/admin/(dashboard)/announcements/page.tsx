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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  PlusCircle,
  Edit,
  Trash2,
  CalendarIcon,
  Eye,
  Users,
  Target,
  Gift,
  Plus,
  X,
  Check,
  ChevronsUpDown,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  targetType: string;
  targetId?: string;
  scheduleType: string;
  scheduledAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
}

interface CustomOffer {
  type: "discount" | "bonus" | "cashback" | "free_tasks" | "position_upgrade";
  value: string;
  expiry?: string;
  code?: string;
  description?: string;
}

interface TargetUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  position: string;
  status: string;
}

interface PositionLevel {
  id: string;
  name: string;
  level: number;
  userCount: number;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] =
    useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [targetUsers, setTargetUsers] = useState<TargetUser[]>([]);
  const [positionLevels, setPositionLevels] = useState<PositionLevel[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  const [levelSelectOpen, setLevelSelectOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [offerExpiryDate, setOfferExpiryDate] = useState<Date>();
  const { toast } = useToast();

  // Form state for creating/editing announcements
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    imageUrl: "",
    targetType: "all",
    targetId: "",
    scheduleType: "immediate",
    scheduledAt: "",
    expiresAt: "",
    isActive: true,
    customOffer: null as CustomOffer | null,
  });

  // Custom offer form state
  const [showCustomOffer, setShowCustomOffer] = useState(false);
  const [customOfferData, setCustomOfferData] = useState<CustomOffer>({
    type: "discount",
    value: "",
    expiry: "",
    code: "",
    description: "",
  });

  // Fetch announcements
  const fetchAnnouncements = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/announcements?page=${page}&limit=10`,
      );
      const data = await response.json();

      if (data.success) {
        // Check and update expired announcements
        const updatedAnnouncements = data.data.announcements.map(
          (announcement: Announcement) => {
            if (announcement.expiresAt && announcement.isActive) {
              const expiryDate = new Date(announcement.expiresAt);
              const now = new Date();
              if (expiryDate <= now) {
                return { ...announcement, isActive: false };
              }
            }
            return announcement;
          },
        );
        setAnnouncements(updatedAnnouncements);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch announcements",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch target options (users and position levels)
  const fetchTargetOptions = async (search?: string) => {
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await fetch(
        `/api/admin/announcements/targets?type=all${searchParam}`,
      );
      const data = await response.json();

      if (data.success) {
        setTargetUsers(data.data.users || []);
        setPositionLevels(data.data.levels || []);
      }
    } catch (error) {
      console.error("Error fetching target options:", error);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle custom offer changes
  const handleCustomOfferChange = (field: keyof CustomOffer, value: string) => {
    setCustomOfferData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset selections when target type changes
    if (name === "targetType") {
      setSelectedUsers([]);
      setSelectedLevel("");
      setFormData((prev) => ({ ...prev, targetId: "" }));
    }
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    const newSelectedUsers = selectedUsers.includes(userId)
      ? selectedUsers.filter((id) => id !== userId)
      : [...selectedUsers, userId];

    setSelectedUsers(newSelectedUsers);
    setFormData((prev) => ({ ...prev, targetId: newSelectedUsers.join(",") }));
  };

  // Add new user selection slot
  const addUserSelectionSlot = () => {
    // This will be handled by the multi-select component
  };

  // Handle level selection
  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    setFormData((prev) => ({ ...prev, targetId: levelId }));
  };

  // Handle date formatting
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    return date.toISOString().slice(0, 16);
  };

  // Create new announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const submissionData = {
        ...formData,
        scheduledAt: scheduledDate ? scheduledDate.toISOString() : null,
        expiresAt: expiryDate ? expiryDate.toISOString() : null,
        customOffer: showCustomOffer
          ? {
              ...customOfferData,
              expiry: offerExpiryDate ? offerExpiryDate.toISOString() : "",
            }
          : null,
      };

      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Announcement created successfully",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchAnnouncements(currentPage);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create announcement",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Update announcement
  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAnnouncement) return;
    setIsUpdating(true);

    try {
      const submissionData = {
        ...formData,
        scheduledAt: scheduledDate ? scheduledDate.toISOString() : null,
        expiresAt: expiryDate ? expiryDate.toISOString() : null,
        customOffer: showCustomOffer
          ? {
              ...customOfferData,
              expiry: offerExpiryDate ? offerExpiryDate.toISOString() : "",
            }
          : null,
      };

      const response = await fetch(
        `/api/admin/announcements/${editingAnnouncement.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Announcement updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingAnnouncement(null);
        fetchAnnouncements(currentPage);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update announcement",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  // Delete announcement with delay
  const handleDeleteAnnouncement = async () => {
    if (!deletingAnnouncement) return;

    setIsDeleting(true);

    // Remove from UI immediately
    setAnnouncements((prev) =>
      prev.filter((a) => a.id !== deletingAnnouncement.id),
    );
    setIsDeleteDialogOpen(false);

    toast({
      title: "Deleting...",
      description:
        "Announcement removed from UI. Database deletion in progress...",
    });

    // Delete from database after 5 seconds
    setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/announcements/${deletingAnnouncement.id}`,
          {
            method: "DELETE",
          },
        );

        const data = await response.json();

        if (data.success) {
          toast({
            title: "Success",
            description: "Announcement deleted from database successfully",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to delete from database",
            variant: "destructive",
          });
          // Re-add to UI if database deletion failed
          fetchAnnouncements(currentPage);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete from database",
          variant: "destructive",
        });
        // Re-add to UI if database deletion failed
        fetchAnnouncements(currentPage);
      } finally {
        setIsDeleting(false);
        setDeletingAnnouncement(null);
      }
    }, 5000);
  };

  // Open edit dialog with announcement data
  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);

    // Parse existing custom offer if available
    let existingOffer: CustomOffer | null = null;
    if (announcement.metadata) {
      try {
        const metadata = JSON.parse(announcement.metadata);
        existingOffer = metadata.customOffer as CustomOffer;
      } catch (error) {
        console.error("Error parsing announcement metadata:", error);
      }
    }

    // Set dates
    setScheduledDate(
      announcement.scheduledAt ? new Date(announcement.scheduledAt) : undefined,
    );
    setExpiryDate(
      announcement.expiresAt ? new Date(announcement.expiresAt) : undefined,
    );

    // Set target selections
    if (announcement.targetType === "specific" && announcement.targetId) {
      setSelectedUsers(announcement.targetId.split(","));
    } else if (announcement.targetType === "level" && announcement.targetId) {
      setSelectedLevel(announcement.targetId);
    }

    setFormData({
      title: announcement.title,
      message: announcement.message,
      imageUrl: announcement.imageUrl || "",
      targetType: announcement.targetType,
      targetId: announcement.targetId || "",
      scheduleType: announcement.scheduleType,
      scheduledAt: announcement.scheduledAt || "",
      expiresAt: announcement.expiresAt || "",
      isActive: announcement.isActive,
      customOffer: existingOffer,
    });

    if (existingOffer) {
      setShowCustomOffer(true);
      setCustomOfferData(existingOffer);
      setOfferExpiryDate(
        existingOffer.expiry ? new Date(existingOffer.expiry) : undefined,
      );
    } else {
      setShowCustomOffer(false);
      setCustomOfferData({
        type: "discount",
        value: "",
        expiry: "",
        code: "",
        description: "",
      });
      setOfferExpiryDate(undefined);
    }

    setIsEditDialogOpen(true);
  };

  // Reset form function
  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      imageUrl: "",
      targetType: "all",
      targetId: "",
      scheduleType: "immediate",
      scheduledAt: "",
      expiresAt: "",
      isActive: true,
      customOffer: null,
    });
    setShowCustomOffer(false);
    setCustomOfferData({
      type: "discount",
      value: "",
      expiry: "",
      code: "",
      description: "",
    });
    setSelectedUsers([]);
    setSelectedLevel("");
    setScheduledDate(undefined);
    setExpiryDate(undefined);
    setOfferExpiryDate(undefined);
  };

  // Reset form when dialogs close
  useEffect(() => {
    if (!isCreateDialogOpen) {
      resetForm();
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setEditingAnnouncement(null);
    }
  }, [isEditDialogOpen]);

  // Fetch announcements and target options on page load
  useEffect(() => {
    fetchAnnouncements(currentPage);
    fetchTargetOptions();
  }, [currentPage]);

  // Automatic expiry checker - runs every 60 seconds
  useEffect(() => {
    const checkExpiredAnnouncements = async () => {
      const hasExpiredAnnouncements = announcements.some((announcement) => {
        if (announcement.expiresAt && announcement.isActive) {
          const expiryDate = new Date(announcement.expiresAt);
          const now = new Date();
          return expiryDate <= now;
        }
        return false;
      });

      if (hasExpiredAnnouncements) {
        // Sync with database first
        try {
          await fetch("/api/admin/announcements/expire", {
            method: "POST",
          });
        } catch (error) {
          console.error("Failed to sync expired announcements:", error);
        }

        // Update UI
        setAnnouncements((prev) =>
          prev.map((announcement) => {
            if (announcement.expiresAt && announcement.isActive) {
              const expiryDate = new Date(announcement.expiresAt);
              const now = new Date();
              if (expiryDate <= now) {
                // Auto-expire the announcement
                toast({
                  title: "Announcement Expired",
                  description: `"${announcement.title}" has expired and been deactivated`,
                  variant: "default",
                });
                return { ...announcement, isActive: false };
              }
            }
            return announcement;
          }),
        );
      }
    };

    // Check immediately
    checkExpiredAnnouncements();

    // Set up interval to check every 60 seconds
    const interval = setInterval(checkExpiredAnnouncements, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [announcements, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Manage announcements for your users
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            <div className="relative">
              {isCreating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-3 bg-background p-4 rounded-lg shadow-lg border">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">
                      Creating announcement...
                    </span>
                  </div>
                </div>
              )}
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    disabled={isCreating}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isCreating}
                    required
                  />
                </div>

                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, imageUrl: url }))
                  }
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, imageUrl: "" }))
                  }
                  placeholder="Upload an image for your announcement"
                  disabled={isCreating}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetType">Target Audience</Label>
                    <Select
                      value={formData.targetType}
                      onValueChange={(value) =>
                        handleSelectChange("targetType", value)
                      }
                      disabled={isCreating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="specific">Specific Users</SelectItem>
                        <SelectItem value="level">User Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduleType">Schedule Type</Label>
                    <Select
                      value={formData.scheduleType}
                      onValueChange={(value) =>
                        handleSelectChange("scheduleType", value)
                      }
                      disabled={isCreating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Target Selection */}
                {formData.targetType === "specific" && (
                  <div className="space-y-4">
                    <Label>Select Users</Label>
                    <div className="space-y-2">
                      <Popover
                        open={userSelectOpen}
                        onOpenChange={setUserSelectOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={userSelectOpen}
                            className="w-full justify-between"
                          >
                            {selectedUsers.length > 0
                              ? `${selectedUsers.length} user(s) selected`
                              : "Search and select users..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search users by name, email, or phone..."
                              onValueChange={(value) => {
                                setUserSearch(value);
                                fetchTargetOptions(value);
                              }}
                            />
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {targetUsers.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.id}
                                  onSelect={() => handleUserSelect(user.id)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedUsers.includes(user.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {user.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {user.email || user.phone} •{" "}
                                      {user.position}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.map((userId) => {
                            const user = targetUsers.find(
                              (u) => u.id === userId,
                            );
                            return user ? (
                              <Badge
                                key={userId}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {user.name}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => handleUserSelect(userId)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {formData.targetType === "level" && (
                  <div className="space-y-2">
                    <Label>Select Position Level</Label>
                    <Popover
                      open={levelSelectOpen}
                      onOpenChange={setLevelSelectOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={levelSelectOpen}
                          className="w-full justify-between"
                        >
                          {selectedLevel
                            ? positionLevels.find(
                                (level) => level.id === selectedLevel,
                              )?.name
                            : "Select position level..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search position levels..." />
                          <CommandEmpty>No position levels found.</CommandEmpty>
                          <CommandGroup>
                            {positionLevels.map((level) => (
                              <CommandItem
                                key={level.id}
                                value={level.id}
                                onSelect={() => {
                                  handleLevelSelect(level.id);
                                  setLevelSelectOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedLevel === level.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {level.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {level.userCount} users
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {formData.scheduleType === "scheduled" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scheduled At</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? (
                              scheduledDate.toLocaleDateString()
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Expires At (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiryDate ? (
                              expiryDate.toLocaleDateString()
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={expiryDate}
                            onSelect={setExpiryDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Custom Offer Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showCustomOffer"
                      checked={showCustomOffer}
                      onCheckedChange={setShowCustomOffer}
                      disabled={isCreating}
                    />
                    <Label
                      htmlFor="showCustomOffer"
                      className="flex items-center space-x-2"
                    >
                      <Gift className="h-4 w-4" />
                      <span>Include Custom Offer</span>
                    </Label>
                  </div>

                  {showCustomOffer && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="offerType">Offer Type</Label>
                        <Select
                          value={customOfferData.type}
                          onValueChange={(value: CustomOffer["type"]) =>
                            handleCustomOfferChange("type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="discount">Discount</SelectItem>
                            <SelectItem value="bonus">Bonus</SelectItem>
                            <SelectItem value="cashback">Cashback</SelectItem>
                            <SelectItem value="free_tasks">
                              Free Tasks
                            </SelectItem>
                            <SelectItem value="position_upgrade">
                              Position Upgrade
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="offerValue">Offer Value</Label>
                        <Input
                          id="offerValue"
                          value={customOfferData.value}
                          onChange={(e) =>
                            handleCustomOfferChange("value", e.target.value)
                          }
                          placeholder="e.g., 10%, 50 PKR, 5 tasks"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="offerCode">Offer Code (Optional)</Label>
                        <Input
                          id="offerCode"
                          value={customOfferData.code}
                          onChange={(e) =>
                            handleCustomOfferChange("code", e.target.value)
                          }
                          placeholder="e.g., SAVE10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expires At (Optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {offerExpiryDate ? (
                                offerExpiryDate.toLocaleDateString()
                              ) : (
                                <span>Pick expiry date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={offerExpiryDate}
                              onSelect={setOfferExpiryDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="offerDescription">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="offerDescription"
                          value={customOfferData.description}
                          onChange={(e) =>
                            handleCustomOfferChange(
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Additional details about this offer..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isActive", checked)
                    }
                    disabled={isCreating}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      "Create Announcement"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Announcement List</CardTitle>
          <CardDescription>View and manage all announcements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No announcements found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">
                        {announcement.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {announcement.message}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {announcement.targetType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {announcement.scheduleType === "immediate" ? (
                          <span className="flex items-center">
                            <Eye className="mr-1 h-4 w-4" />
                            Immediate
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <CalendarIcon className="mr-1 h-4 w-4" />
                            Scheduled
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge
                            variant={
                              announcement.isActive ? "default" : "secondary"
                            }
                          >
                            {announcement.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {announcement.expiresAt && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Expires:{" "}
                                {format(
                                  new Date(announcement.expiresAt),
                                  "MMM d, yyyy HH:mm",
                                )}
                              </div>
                              {(() => {
                                const expiryDate = new Date(
                                  announcement.expiresAt,
                                );
                                const now = new Date();
                                const diffMs =
                                  expiryDate.getTime() - now.getTime();
                                const diffHours = Math.floor(
                                  diffMs / (1000 * 60 * 60),
                                );
                                const diffDays = Math.floor(diffHours / 24);

                                if (diffMs <= 0 && announcement.isActive) {
                                  return (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      Expired - Needs Update
                                    </Badge>
                                  );
                                } else if (diffMs <= 0) {
                                  return (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Expired
                                    </Badge>
                                  );
                                } else if (diffHours <= 24) {
                                  return (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                                    >
                                      Expires in {diffHours}h
                                    </Badge>
                                  );
                                } else if (diffDays <= 7) {
                                  return (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      Expires in {diffDays}d
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(announcement.createdAt),
                          "MMM d, yyyy",
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(announcement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(announcement)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Announcement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          {editingAnnouncement && (
            <div className="relative">
              {isUpdating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-3 bg-background p-4 rounded-lg shadow-lg border">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">
                      Updating announcement...
                    </span>
                  </div>
                </div>
              )}
              <form onSubmit={handleUpdateAnnouncement} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    disabled={isUpdating}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-message">Message</Label>
                  <Textarea
                    id="edit-message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isUpdating}
                    required
                  />
                </div>

                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, imageUrl: url }))
                  }
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, imageUrl: "" }))
                  }
                  placeholder="Upload an image for your announcement"
                  disabled={isUpdating}
                />

                {/* Target Selection for Edit */}
                {formData.targetType === "specific" && (
                  <div className="space-y-4">
                    <Label>Select Users</Label>
                    <div className="space-y-2">
                      <Popover
                        open={userSelectOpen}
                        onOpenChange={setUserSelectOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={userSelectOpen}
                            className="w-full justify-between"
                          >
                            {selectedUsers.length > 0
                              ? `${selectedUsers.length} user(s) selected`
                              : "Search and select users..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search users by name, email, or phone..."
                              onValueChange={(value) => {
                                setUserSearch(value);
                                fetchTargetOptions(value);
                              }}
                            />
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {targetUsers.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.id}
                                  onSelect={() => handleUserSelect(user.id)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedUsers.includes(user.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {user.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {user.email || user.phone} •{" "}
                                      {user.position}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.map((userId) => {
                            const user = targetUsers.find(
                              (u) => u.id === userId,
                            );
                            return user ? (
                              <Badge
                                key={userId}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {user.name}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => handleUserSelect(userId)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {formData.targetType === "level" && (
                  <div className="space-y-2">
                    <Label>Select Position Level</Label>
                    <Popover
                      open={levelSelectOpen}
                      onOpenChange={setLevelSelectOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={levelSelectOpen}
                          className="w-full justify-between"
                        >
                          {selectedLevel
                            ? positionLevels.find(
                                (level) => level.id === selectedLevel,
                              )?.name
                            : "Select position level..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search position levels..." />
                          <CommandEmpty>No position levels found.</CommandEmpty>
                          <CommandGroup>
                            {positionLevels.map((level) => (
                              <CommandItem
                                key={level.id}
                                value={level.id}
                                onSelect={() => {
                                  handleLevelSelect(level.id);
                                  setLevelSelectOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedLevel === level.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {level.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {level.userCount} users
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-targetType">Target Audience</Label>
                    <Select
                      value={formData.targetType}
                      onValueChange={(value) =>
                        handleSelectChange("targetType", value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="specific">Specific Users</SelectItem>
                        <SelectItem value="level">User Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-scheduleType">Schedule Type</Label>
                    <Select
                      value={formData.scheduleType}
                      onValueChange={(value) =>
                        handleSelectChange("scheduleType", value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.scheduleType === "scheduled" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scheduled At</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? (
                              scheduledDate.toLocaleDateString()
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Expires At (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiryDate ? (
                              expiryDate.toLocaleDateString()
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={expiryDate}
                            onSelect={setExpiryDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Custom Offer Section for Edit */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-showCustomOffer"
                      checked={showCustomOffer}
                      onCheckedChange={setShowCustomOffer}
                      disabled={isUpdating}
                    />
                    <Label
                      htmlFor="edit-showCustomOffer"
                      className="flex items-center space-x-2"
                    >
                      <Gift className="h-4 w-4" />
                      <span>Include Custom Offer</span>
                    </Label>
                  </div>

                  {showCustomOffer && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-offerType">Offer Type</Label>
                        <Select
                          value={customOfferData.type}
                          onValueChange={(value: CustomOffer["type"]) =>
                            handleCustomOfferChange("type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="discount">Discount</SelectItem>
                            <SelectItem value="bonus">Bonus</SelectItem>
                            <SelectItem value="cashback">Cashback</SelectItem>
                            <SelectItem value="free_tasks">
                              Free Tasks
                            </SelectItem>
                            <SelectItem value="position_upgrade">
                              Position Upgrade
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-offerValue">Offer Value</Label>
                        <Input
                          id="edit-offerValue"
                          value={customOfferData.value}
                          onChange={(e) =>
                            handleCustomOfferChange("value", e.target.value)
                          }
                          placeholder="e.g., 10%, 50 PKR, 5 tasks"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-offerCode">
                          Offer Code (Optional)
                        </Label>
                        <Input
                          id="edit-offerCode"
                          value={customOfferData.code}
                          onChange={(e) =>
                            handleCustomOfferChange("code", e.target.value)
                          }
                          placeholder="e.g., SAVE10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expires At (Optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {offerExpiryDate ? (
                                offerExpiryDate.toLocaleDateString()
                              ) : (
                                <span>Pick expiry date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={offerExpiryDate}
                              onSelect={setOfferExpiryDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="edit-offerDescription">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="edit-offerDescription"
                          value={customOfferData.description}
                          onChange={(e) =>
                            handleCustomOfferChange(
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Additional details about this offer..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isActive", checked)
                    }
                    disabled={isUpdating}
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "Update Announcement"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold text-gray-900">
              Delete Announcement
            </DialogTitle>
            <p className="text-center text-sm text-gray-500">
              This action cannot be undone. This will permanently delete the
              announcement.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {deletingAnnouncement && (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {deletingAnnouncement.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {deletingAnnouncement.message}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      {deletingAnnouncement.targetType}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Created:{" "}
                      {format(
                        new Date(deletingAnnouncement.createdAt),
                        "MMM d, yyyy",
                      )}
                    </span>
                    {deletingAnnouncement.expiresAt && (
                      <span>
                        Expires:{" "}
                        {format(
                          new Date(deletingAnnouncement.expiresAt),
                          "MMM d, yyyy",
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Smart Deletion Process</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      <span>UI removal: Instant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      <span>Database cleanup: 5 seconds delay</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      <span>User notifications: Stopped immediately</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingAnnouncement(null);
                }}
                disabled={isDeleting}
                className="flex-1 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAnnouncement}
                disabled={isDeleting}
                className="flex-1 order-1 sm:order-2"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Permanently</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
