"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageUpload } from "./ImageUpload";
import { useCreateIssue } from "../hooks/useCreateIssue";
import { useGeolocation } from "../hooks/useGeolocation";
import { uploadIssueImage } from "../services/uploadService";
import {
  createIssueSchema,
  ISSUE_CATEGORIES,
  type CreateIssueInput,
} from "../types";

export function IssueForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const createIssue = useCreateIssue();
  const geo = useGeolocation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateIssueInput>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Pothole",
    },
  });

  async function onSubmit(values: CreateIssueInput) {
    if (!geo.latitude || !geo.longitude) {
      geo.requestLocation();
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (selectedFile) {
        imageUrl = await uploadIssueImage(selectedFile);
      }

      await createIssue.mutateAsync({
        title: values.title,
        description: values.description,
        category: values.category,
        image_url: imageUrl,
        latitude: geo.latitude,
        longitude: geo.longitude,
      });

      reset();
      setSelectedFile(null);
    } catch {
      // error state is handled via mutation
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Report Road Issue</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Large pothole near bus stop"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue, impact, and exact location"
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register("category")}
            >
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <ImageUpload onFileSelect={setSelectedFile} />

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={geo.requestLocation}
              disabled={geo.loading}
            >
              {geo.loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {geo.latitude ? "Location captured" : "Get my location"}
            </Button>
            {geo.latitude && geo.longitude && (
              <p className="text-xs text-muted-foreground">
                {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
              </p>
            )}
            {geo.error && (
              <p className="text-xs text-destructive">{geo.error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !geo.latitude}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>

          {createIssue.isError && (
            <p className="text-sm text-destructive">
              Failed to submit. Please try again.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
