"use client"
import { useState } from "react"
import FileUpload from "@/app/components/fileupload"
import ChatComponent from "./components/chat"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<string>("")

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b glass-effect sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                PDF Chat Assistant
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {uploadedFile && (
                <Badge variant="secondary" className="max-w-xs truncate">
                  <FileText className="h-3 w-3 mr-1" />
                  {uploadedFile}
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Upload Section */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <Card className="flex-1 glass-effect border-0 shadow-xl">
              <div className="p-6 h-full flex flex-col justify-center">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Get Started</h2>
                  <p className="text-muted-foreground">Upload your PDF document to begin an intelligent conversation</p>
                </div>
                <FileUpload onFileUploaded={setUploadedFile} />

                {/* Features */}
                <div className="mt-8 space-y-3">
                  <h3 className="font-semibold">Features:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      Ask questions about document content
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      Get page references and citations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      Intelligent document analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      Real-time responses
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2 min-h-0">
            <Card className="h-full glass-effect border-0 shadow-xl">
              <ChatComponent />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
