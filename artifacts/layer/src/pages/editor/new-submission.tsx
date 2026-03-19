import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { X, Loader2, Image as ImageIcon, Upload, Film, CheckCircle2 } from "lucide-react";
import { useCreateVideo, useListCreators } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Provide a brief description"),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  creatorId: z.string().min(1, "Please select a creator"),
  tags: z.string().optional(),
});

export default function NewSubmissionModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  const { data: creatorsData, isLoading: isLoadingCreators } = useListCreators();

  const createMutation = useCreateVideo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
        toast({ title: "Success!", description: "Video submitted for review." });
        onClose();
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.error || "Failed to submit video.", variant: "destructive" });
      },
    },
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", thumbnailUrl: "", creatorId: "", tags: "" },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select a video file.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setUploadedFilename(null);
    setUploadProgress(0);
  };

  const uploadFile = async (): Promise<string> => {
    if (!selectedFile) throw new Error("No file selected");

    setIsUploading(true);
    setUploadProgress(0);

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("video", selectedFile);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          setUploadedFilename(res.filename);
          setIsUploading(false);
          resolve(res.filename);
        } else {
          setIsUploading(false);
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => {
        setIsUploading(false);
        reject(new Error("Upload failed"));
      });

      const token = localStorage.getItem("layer_token");
      xhr.open("POST", "/api/upload/video");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (!selectedFile) {
      toast({ title: "No video", description: "Please select a video file to upload.", variant: "destructive" });
      return;
    }

    try {
      const filename = uploadedFilename || (await uploadFile());
      await createMutation.mutateAsync({
        data: {
          title: data.title,
          description: data.description,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
          videoUrl: `/api/stream/${filename}`,
          thumbnailUrl: data.thumbnailUrl || undefined,
          creatorId: data.creatorId,
          fileSize: selectedFile.size,
        },
        ...(({ storedFilename: filename } as any)),
      });

      await (createMutation as any).mutateAsync({
        data: {
          title: data.title,
          description: data.description,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
          videoUrl: `/api/stream/${filename}`,
          thumbnailUrl: data.thumbnailUrl || undefined,
          creatorId: data.creatorId,
          fileSize: selectedFile.size,
        },
      });
    } catch (err: any) {
      if (!createMutation.isError) {
        toast({ title: "Upload failed", description: err.message || "Could not upload video", variant: "destructive" });
      }
    }
  };

  const handleRealSubmit = async (data: z.infer<typeof schema>) => {
    if (!selectedFile) {
      toast({ title: "No video", description: "Please select a video file to upload.", variant: "destructive" });
      return;
    }

    try {
      let filename = uploadedFilename;
      if (!filename) {
        filename = await uploadFile();
      }

      const token = localStorage.getItem("layer_token");
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
          videoUrl: `/api/stream/${filename}`,
          storedFilename: filename,
          thumbnailUrl: data.thumbnailUrl || undefined,
          creatorId: data.creatorId,
          fileSize: selectedFile.size,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Submitted!", description: "Video sent for creator review." });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Submission failed", variant: "destructive" });
    }
  };

  const fileSizeMB = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/30">
          <h2 className="text-xl font-bold">New Video Submission</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="submission-form" onSubmit={form.handleSubmit(handleRealSubmit)} className="space-y-6">

            {/* Video File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Video File</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <Upload className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Click to upload video</p>
                      <p className="text-sm text-muted-foreground mt-1">MP4, MOV, AVI, WebM — up to 10GB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Film className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{fileSizeMB} MB — click to change</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload progress */}
              {isUploading && (
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uploading to server…</span>
                    <span className="font-medium text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadedFilename && !isUploading && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 mt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Video uploaded to server — ready to submit</span>
                </div>
              )}
            </div>

            {/* Creator */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Select Creator</label>
              <select
                {...form.register("creatorId")}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground appearance-none"
              >
                <option value="">— Choose a creator to review —</option>
                {creatorsData?.users?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.creatorId && (
                <p className="text-sm text-destructive">{form.formState.errors.creatorId.message}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Video Title</label>
              <input
                {...form.register("title")}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground"
                placeholder="e.g. VLOG: My trip to Japan"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Description</label>
              <textarea
                {...form.register("description")}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground resize-none"
                placeholder="YouTube description, notes for creator..."
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Tags & Thumbnail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Tags <span className="text-xs font-normal text-muted-foreground">(comma separated)</span>
                </label>
                <input
                  {...form.register("tags")}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="vlog, travel, 4k"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Thumbnail URL
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  {...form.register("thumbnailUrl")}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="https://..."
                />
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-border/50 bg-secondary/30 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
            Cancel
          </Button>
          <Button
            type="submit"
            form="submission-form"
            disabled={isUploading || isLoadingCreators || !selectedFile}
            className="rounded-xl px-8"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading…</>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
