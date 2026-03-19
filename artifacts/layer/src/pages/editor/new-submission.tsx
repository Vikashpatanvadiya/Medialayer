import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { X, Loader2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useCreateVideo, useListCreators } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Provide a brief description"),
  videoUrl: z.string().url("Must be a valid URL"),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  creatorId: z.string().min(1, "Please select a creator"),
  tags: z.string().optional(),
});

export default function NewSubmissionModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: creatorsData, isLoading: isLoadingCreators } = useListCreators();
  
  const createMutation = useCreateVideo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
        toast({ title: "Success!", description: "Video submitted for review." });
        onClose();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit video.", variant: "destructive" });
      }
    }
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", description: "", videoUrl: "", thumbnailUrl: "", creatorId: "", tags: ""
    }
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    await createMutation.mutateAsync({
      data: {
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        thumbnailUrl: data.thumbnailUrl || undefined
      }
    });
  };

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
          <h2 className="text-xl font-display font-bold">New Video Submission</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="submission-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Select Creator</label>
              <select 
                {...form.register("creatorId")}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground input-ring appearance-none"
              >
                <option value="">-- Choose a creator to review --</option>
                {creatorsData?.users?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {form.formState.errors.creatorId && <p className="text-sm text-destructive">{form.formState.errors.creatorId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Title</label>
              <input 
                {...form.register("title")}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground input-ring"
                placeholder="e.g. VLOG: My trip to Japan"
              />
              {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Description</label>
              <textarea 
                {...form.register("description")}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground input-ring resize-none"
                placeholder="Notes for the creator, context about the edit..."
              />
              {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Video URL
                </label>
                <input 
                  {...form.register("videoUrl")}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground input-ring"
                  placeholder="YouTube unlisted / Frame.io link"
                />
                {form.formState.errors.videoUrl && <p className="text-sm text-destructive">{form.formState.errors.videoUrl.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Thumbnail URL <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </label>
                <input 
                  {...form.register("thumbnailUrl")}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground input-ring"
                  placeholder="Image link"
                />
                {form.formState.errors.thumbnailUrl && <p className="text-sm text-destructive">{form.formState.errors.thumbnailUrl.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Tags <span className="text-xs font-normal text-muted-foreground">(Comma separated)</span></label>
              <input 
                {...form.register("tags")}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground input-ring"
                placeholder="vlog, travel, 4k"
              />
            </div>

          </form>
        </div>
        
        <div className="p-6 border-t border-border/50 bg-secondary/30 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-6">Cancel</Button>
          <Button type="submit" form="submission-form" disabled={createMutation.isPending || isLoadingCreators} className="btn-primary-gradient rounded-xl px-8">
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Video"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
