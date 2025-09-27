"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { SimpleTagInput } from "./SimpleTagInput";
import { CareerWinSmartInput } from "./CareerWinSmartInput";
import type { CreateWinInput } from "@/lib/career-wins/win-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import { createWinSchema } from "@/lib/career-wins/win-validation";
import { CRUDConfirmationDialog } from "@/components/ai/CRUDConfirmationDialog";

interface WinCaptureFormProps {
  win?: any;
  onSubmit: (data: CreateWinInput) => void;
  onCancel?: () => void;
}

export function WinCaptureForm({
  win,
  onSubmit,
  onCancel,
}: WinCaptureFormProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<CreateWinInput | null>(null);

  const form = useForm<CreateWinInput>({
    resolver: zodResolver(createWinSchema),
    defaultValues: win
      ? {
          title: win.title,
          description: win.description || "",
          date: win.date
            ? new Date(win.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          tags: win.tags || [],
          category: win.category || "",
          framework: win.framework || "",
          visibility: win.visibility || "PRIVATE",
        }
      : {
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          tags: [],
          category: "",
          framework: "",
          visibility: "PRIVATE",
        },
  });

  const handleFormSubmit = (data: CreateWinInput) => {
    setFormData(data);
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = () => {
    if (formData) {
      onSubmit(formData);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <CareerWinSmartInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter career win title (e.g., Led team to deliver critical project ahead of schedule)"
                    type="title"
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <MarkdownEditor
                    placeholder="Describe your career win in detail..."
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date.toISOString().split("T")[0]);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                  <SimpleTagInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <CareerWinSmartInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Enter category (e.g., Leadership, Technical Achievement, Process Improvement)"
                    type="category"
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="framework"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Framework/Methodology</FormLabel>
                <FormControl>
                  <Input
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Enter framework or methodology (e.g., STAR, Agile, Lean Six Sigma)"
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PRIVATE">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        Private
                      </div>
                    </SelectItem>
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                        Public
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit">{win ? "Update Win" : "Create Win"}</Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>

      <CRUDConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        action={win ? "update" : "create"}
        entity="career win"
        changes={formData || {}}
        onConfirm={handleConfirmSubmit}
        onCancel={() => {
          setShowConfirmation(false);
          setFormData(null);
        }}
      />
    </>
  );
}
