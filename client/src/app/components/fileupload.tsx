"use client"
import * as React from "react"
import { FileUp, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileUploaded?: (fileName: string) => void
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [uploadStatus, setUploadStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle")
  const [fileName, setFileName] = React.useState<string>("")

  const handleFileUploadButtonClick = () => {
    const el = document.createElement("input")
    el.setAttribute("type", "file")
    el.setAttribute("accept", "application/pdf")
    el.addEventListener("change", async () => {
      if (el.files && el.files.length > 0) {
        const file = el.files.item(0)
        if (file) {
          setFileName(file.name)
          setUploadStatus("uploading")

          try {
            const formData = new FormData()
            formData.append("pdf", file)

            await fetch("http://localhost:8000/upload/pdf", {
              method: "POST",
              body: formData,
            })

            setUploadStatus("success")
            onFileUploaded?.(file.name)
            console.log("File uploaded successfully")
          } catch (error) {
            setUploadStatus("error")
            console.error("Upload failed:", error)
          }
        }
      }
    })
    el.click()
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
        return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />
      default:
        return <FileUp className="h-8 w-8" />
    }
  }

  const getStatusText = () => {
    switch (uploadStatus) {
      case "uploading":
        return "Uploading..."
      case "success":
        return "Upload Complete"
      case "error":
        return "Upload Failed"
      default:
        return "Upload PDF Document"
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">{getStatusIcon()}</div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{getStatusText()}</h3>
              <p className="text-sm text-muted-foreground">Select a PDF file to start chatting with your document</p>
            </div>

            {fileName && (
              <Badge variant="secondary" className="max-w-full truncate">
                {fileName}
              </Badge>
            )}

            <Button
              onClick={handleFileUploadButtonClick}
              disabled={uploadStatus === "uploading"}
              className={cn("w-full", uploadStatus === "success" && "bg-green-600 hover:bg-green-700")}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadStatus === "success" ? "Upload Another" : "Choose File"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FileUpload
