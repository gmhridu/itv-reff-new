"use client";

import { useState } from "react";
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
import { CloudUpload } from "lucide-react";

interface VideoUploadFormProps {
  onDirectUpload: (data: {
    file: File | null;
    title: string;
    description: string;
    tags: string;
  }) => void;
  onYouTubeEmbed: (data: {
    url: string;
    title: string;
    description: string;
    tags: string;
  }) => void;
}

export default function VideoUploadForm({ onDirectUpload, onYouTubeEmbed }: VideoUploadFormProps) {
  const [directUploadData, setDirectUploadData] = useState({
    file: null as File | null,
    title: "",
    description: "",
    tags: "",
  });

  const [youtubeData, setYouTubeData] = useState({
    url: "",
    title: "",
    description: "",
    tags: "",
  });

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDirectUploadData(prev => ({
        ...prev,
        file: e.dataTransfer.files[0]
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDirectUploadData(prev => ({
        ...prev,
        file: e.target.files![0]
      }));
    }
  };

  const handleDirectUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDirectUpload(directUploadData);
  };

  const handleYouTubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onYouTubeEmbed(youtubeData);
  };

  return (
    <Tabs defaultValue="direct-upload" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="direct-upload">Direct Upload</TabsTrigger>
        <TabsTrigger value="youtube-link">YouTube Link</TabsTrigger>
      </TabsList>
      
      <TabsContent value="direct-upload">
        <Card>
          <CardHeader>
            <CardTitle>Direct File Upload</CardTitle>
            <CardDescription>
              Drag and drop your video file here or click to browse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDirectUploadSubmit} className="space-y-4">
              <div
                className={`flex items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("dropzone-file")?.click()}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <CloudUpload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP4, AVI, MOV (MAX. 800MB)
                  </p>
                  {directUploadData.file && (
                    <p className="mt-2 text-sm font-medium text-primary">
                      Selected: {directUploadData.file.name}
                    </p>
                  )}
                </div>
                <Input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter video title"
                    value={directUploadData.title}
                    onChange={(e) =>
                      setDirectUploadData(prev => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter video description"
                    value={directUploadData.description}
                    onChange={(e) =>
                      setDirectUploadData(prev => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Enter tags, comma separated"
                    value={directUploadData.tags}
                    onChange={(e) =>
                      setDirectUploadData(prev => ({ ...prev, tags: e.target.value }))
                    }
                  />
                </div>
                <Button type="submit" disabled={!directUploadData.file || !directUploadData.title}>
                  Upload Video
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="youtube-link">
        <Card>
          <CardHeader>
            <CardTitle>YouTube Embedded Link</CardTitle>
            <CardDescription>
              Paste a YouTube video link to embed it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleYouTubeSubmit} className="space-y-4">
              <div>
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeData.url}
                  onChange={(e) =>
                    setYouTubeData(prev => ({ ...prev, url: e.target.value }))
                  }
                  required
                />
              </div>
              
              {youtubeData.url && (
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Video preview will appear here</p>
                </div>
              )}
              
              <div>
                <Label htmlFor="title-yt">Title</Label>
                <Input
                  id="title-yt"
                  placeholder="Enter video title"
                  value={youtubeData.title}
                  onChange={(e) =>
                    setYouTubeData(prev => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description-yt">Description</Label>
                <Textarea
                  id="description-yt"
                  placeholder="Enter video description"
                  value={youtubeData.description}
                  onChange={(e) =>
                    setYouTubeData(prev => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="tags-yt">Tags</Label>
                <Input
                  id="tags-yt"
                  placeholder="Enter tags, comma separated"
                  value={youtubeData.tags}
                  onChange={(e) =>
                    setYouTubeData(prev => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" disabled={!youtubeData.url || !youtubeData.title}>
                Embed Video
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}