import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { X, Loader2, Image as ImageIcon, Upload, Film, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type LinkedCreator = { id: string; name: string; email: string };

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Provide a brief description"),
  tags: z.string().optional(),
  creatorId: z.string().min(1, "Please select a creator"),
});

export default function NewSubmissionModal({ onClose, linkedCreators }: { onClose: () => void; linkedCreators: LinkedCreator[] }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [uploadedCloudinaryUrl, setUploadedCloudinaryUrl] = useState<string | null>(null);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", tags: "", creatorId: linkedCreators.length === 1 ? linkedCreators[0].id : "" },
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
    setUploadedCloudinaryUrl(null);
    setUploadProgress(0);
    setUploadStage("idle");
  };

  // Direct upload to Cloudinary using backend-signed params — fast + secure
  const uploadFile = (): Promise<{ filename: string; cloudinaryUrl: string }> => {
    if (!selectedFile) return Promise.reject(new Error("No file selected"));
    setIsUploading(true);
    setUploadStage("uploading");
    setUploadProgress(0);

    return new Promise(async (resolve, reject) => {
      try {
        const token = localStorage.getItem("layer_token");
        const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "mp4";

        // Step 1 — get signed params (tiny request, no file data)
        const signRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/upload/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ext }),
        });
        if (!signRes.ok) {
          const errBody = await signRes.json().catch(() => ({}));
          throw new Error(errBody.error || `Signature request failed (${signRes.status})`);
        }
        const { signature, timestamp, public_id, api_key, cloud_name, filename } = await signRes.json();

        // Step 2 — upload directly from browser to Cloudinary (no Render hop)
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("api_key", api_key);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signature);
        formData.append("public_id", public_id);
        formData.append("type", "authenticated");
        formData.append("overwrite", "true");

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
            if (pct === 100) setUploadStage("processing");
          }
        });

        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText);
            const cloudinaryUrl = result.secure_url;

            // Step 3 — confirm with backend (just logging, no file bytes)
            await fetch(`${import.meta.env.VITE_API_URL || ""}/api/upload/confirm`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ filename, cloudinaryUrl, originalName: selectedFile.name, size: selectedFile.size }),
            });

            setIsUploading(false);
            setUploadedFilename(filename);
            setUploadedCloudinaryUrl(cloudinaryUrl);
            setUploadStage("done");
            resolve({ filename, cloudinaryUrl });
          } else {
            setIsUploading(false);
            setUploadStage("idle");
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error?.message || err.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          setIsUploading(false);
          setUploadStage("idle");
          reject(new Error("Network error during upload"));
        });

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`);
        xhr.send(formData);
      } catch (err: any) {
        setIsUploading(false);
        setUploadStage("idle");
        reject(err);
      }
    });
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    setThumbnailFile(file);
    setThumbnailUrl(null);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    setIsUploadingThumbnail(true);
    try {
      const token = localStorage.getItem("layer_token");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

      const signRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/upload/thumbnail-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ext }),
      });
      if (!signRes.ok) throw new Error("Failed to get thumbnail upload signature");
      const { signature, timestamp, public_id, api_key, cloud_name } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("public_id", public_id);
      formData.append("overwrite", "true");
      // No "type: authenticated" — must be public so YouTube can fetch it

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Thumbnail upload to Cloudinary failed");
      const result = await res.json();
      return result.secure_url as string;
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleRealSubmit = async (data: z.infer<typeof schema>) => {
    if (!selectedFile) {
      toast({ title: "No video", description: "Please select a video file to upload.", variant: "destructive" });
      return;
    }
    // Guard against double-submit
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      // Always upload first (or reuse already-uploaded result)
      let filename = uploadedFilename;
      let cloudinaryUrl = uploadedCloudinaryUrl;

      if (!filename || !cloudinaryUrl) {
        const result = await uploadFile();
        filename = result.filename;
        cloudinaryUrl = result.cloudinaryUrl;
      }

      // Upload thumbnail if selected and not yet uploaded
      let finalThumbnailUrl = thumbnailUrl;
      if (thumbnailFile && !thumbnailUrl) {
        finalThumbnailUrl = await uploadThumbnail(thumbnailFile);
        setThumbnailUrl(finalThumbnailUrl);
      }

      const token = localStorage.getItem("layer_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
          videoUrl: cloudinaryUrl,
          storedFilename: filename,
          thumbnailUrl: finalThumbnailUrl || undefined,
          fileSize: selectedFile.size,
          creatorId: data.creatorId,
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
      isSubmittingRef.current = false;
      toast({ title: "Error", description: err.message || "Submission failed", variant: "destructive" });
    }
  };

  const fileSizeMB = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
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
                  selectedFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50"
                }`}
              >
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
                {!selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <Upload className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Click to upload video</p>
                      <p className="text-sm text-muted-foreground mt-1">MP4, MOV — up to 2GB</p>
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

              {(isUploading || uploadStage === "processing") && (
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {uploadStage === "processing" ? "Saving to cloud storage…" : "Uploading to server…"}
                    </span>
                    <span className="font-medium text-primary">
                      {uploadStage === "processing" ? <Loader2 className="w-4 h-4 animate-spin inline" /> : `${uploadProgress}%`}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${uploadStage === "processing" ? "bg-primary animate-pulse w-full" : "bg-primary"}`}
                      style={{ width: uploadStage === "processing" ? "100%" : `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadStage === "done" && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 mt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Video uploaded — ready to submit</span>
                </div>
              )}
            </div>

            {/* Creator picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Send to Creator</label>
              {linkedCreators.length === 0 ? (
                <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700">
                  No creators linked yet. Go back and add a creator first.
                </div>
              ) : linkedCreators.length === 1 ? (
                <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Submitting to <span className="font-semibold">{linkedCreators[0].name}</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {linkedCreators.map(c => (
                    <label key={c.id} className={`cursor-pointer border rounded-xl p-3 flex items-center gap-2 transition-all ${form.watch("creatorId") === c.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-secondary"}`}>
                      <input type="radio" value={c.id} {...form.register("creatorId")} className="hidden" />
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${form.watch("creatorId") === c.id ? "text-primary" : "text-muted-foreground opacity-30"}`} />
                      <span className="text-sm font-medium truncate">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {form.formState.errors.creatorId && <p className="text-sm text-destructive">{form.formState.errors.creatorId.message}</p>}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Video Title</label>
              <input
                {...form.register("title")}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground"
                placeholder="e.g. VLOG: My trip to Japan"
              />
              {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
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
              {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
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
                  <ImageIcon className="w-4 h-4" /> Thumbnail
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
                {thumbnailPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border group cursor-pointer" onClick={() => thumbnailInputRef.current?.click()}>
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-28 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">Change image</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload thumbnail</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG — recommended 1280×720</p>
                    </div>
                  </div>
                )}
                {isUploadingThumbnail && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading thumbnail…
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-border/50 bg-secondary/30 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-6">Cancel</Button>
          <Button
            type="submit"
            form="submission-form"
            disabled={isUploading || uploadStage === "processing" || isUploadingThumbnail || !selectedFile || form.formState.isSubmitting}
            className="rounded-xl px-8"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading…</>
            ) : uploadStage === "processing" ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving to cloud…</>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
