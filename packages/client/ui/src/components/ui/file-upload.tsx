"use client"

import * as React from "react"
import { useDropzone, type DropzoneOptions } from "react-dropzone"
import { UploadCloudIcon, XIcon, FileIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

type FileUploadProps = DropzoneOptions & {
  className?: string
  value?: File[]
  onValueChange?: (files: File[]) => void
}

function FileUpload({
  className,
  value = [],
  onValueChange,
  ...dropzoneOptions
}: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    ...dropzoneOptions,
    onDrop: (accepted) => {
      onValueChange?.(dropzoneOptions.multiple === false ? accepted : [...value, ...accepted])
    },
  })

  const removeFile = (index: number) => {
    onValueChange?.(value.filter((_, i) => i !== index))
  }

  return (
    <div data-slot="file-upload" className="w-full space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input px-6 py-8 text-center transition-colors hover:bg-accent/50",
          isDragActive && "border-ring bg-accent/50",
          className
        )}
      >
        <input {...getInputProps()} />
        <UploadCloudIcon className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop files here, or click to browse
        </p>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
              >
                <XIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { FileUpload }
