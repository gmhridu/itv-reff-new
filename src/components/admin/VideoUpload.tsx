"use client"

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CloudUpload, FileUp, Youtube, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { VideoUploadMethod } from '@/types/admin-enums'

interface VideoMetadata {
  title: string
  description: string
  tags: string
  category: string
}

interface VideoUploadProps {
  onFileUpload: (file: File, metadata: VideoMetadata) => Promise<void>
  onYouTubeUpload: (url: string, metadata: VideoMetadata) => Promise<void>
  allowedFileTypes: string[]
  maxFileSize: number
  youtubeEmbedEnabled: boolean
}

export default function VideoUpload({
  onFileUpload,
  onYouTubeUpload,
  allowedFileTypes,
  maxFileSize,
  youtubeEmbedEnabled
}: VideoUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<VideoUploadMethod>(VideoUploadMethod.FILE_UPLOAD)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [dragActive, setDragActive] = useState(false)

  const form = useForm<VideoMetadata & { youtubeUrl?: string }>({
    defaultValues: {
      title: '',
      description: '',
      tags: '',
      category: '',
      youtubeUrl: ''
    }
  })

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      handleFileSelection(file)
    }
  }, [])

  const handleFileSelection = (file: File) => {
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedFileTypes.includes(fileExtension)) {
      setUploadStatus('error')
      return
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setUploadStatus('error')
      return
    }

    setSelectedFile(file)
    setUploadStatus('idle')
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleSubmit = async (data: VideoMetadata & { youtubeUrl?: string }) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      if (uploadMethod === VideoUploadMethod.FILE_UPLOAD && selectedFile) {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return prev + 10
          })
        }, 200)

        await onFileUpload(selectedFile, {
          title: data.title,
          description: data.description,
          tags: data.tags,
          category: data.category
        })

        clearInterval(progressInterval)
        setUploadProgress(100)
      } else if (uploadMethod === VideoUploadMethod.YOUTUBE_EMBED && data.youtubeUrl) {
        await onYouTubeUpload(data.youtubeUrl, {
          title: data.title,
          description: data.description,
          tags: data.tags,
          category: data.category
        })
      }

      setUploadStatus('success')
      form.reset()
      setSelectedFile(null)
    } catch (error) {
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Video Upload</h1>
        <p className="text-muted-foreground">Upload and manage video content for your platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Video</CardTitle>
          <CardDescription>
            Choose your preferred upload method and provide video details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs
                value={uploadMethod}
                onValueChange={(value) => setUploadMethod(value as VideoUploadMethod)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value={VideoUploadMethod.FILE_UPLOAD}>
                    <FileUp className="w-4 h-4 mr-2" />
                    File Upload
                  </TabsTrigger>
                  <TabsTrigger 
                    value={VideoUploadMethod.YOUTUBE_EMBED}
                    disabled={!youtubeEmbedEnabled}
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube Embed
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={VideoUploadMethod.FILE_UPLOAD} className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-primary bg-primary/5'
                        : selectedFile
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {selectedFile ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <CloudUpload className="w-12 h-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">Drag and drop your video here</p>
                          <p className="text-muted-foreground">or click to browse files</p>
                        </div>
                        <input
                          type="file"
                          accept={allowedFileTypes.join(',')}
                          onChange={handleFileInput}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button type="button" variant="outline" asChild>
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </label>
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          Supported formats: {allowedFileTypes.join(', ')} • Max size: {formatFileSize(maxFileSize)}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUploading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value={VideoUploadMethod.YOUTUBE_EMBED} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="youtubeUrl"
                    rules={{
                      required: uploadMethod === VideoUploadMethod.YOUTUBE_EMBED ? 'YouTube URL is required' : false,
                      pattern: {
                        value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
                        message: 'Please enter a valid YouTube URL'
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* Video Metadata Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter video title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter video description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tags separated by commas"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Messages */}
              {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-300">Video uploaded successfully!</span>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 dark:text-red-300">Upload failed. Please try again.</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isUploading ||
                    (uploadMethod === VideoUploadMethod.FILE_UPLOAD && !selectedFile) ||
                    (uploadMethod === VideoUploadMethod.YOUTUBE_EMBED && !form.watch('youtubeUrl'))
                  }
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}