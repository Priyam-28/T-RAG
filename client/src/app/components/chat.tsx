"use client"
import * as React from "react"
import { Send, FileText, User, Bot, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Doc {
  pageContent?: string
  metadata?: {
    loc?: {
      pageNumber?: number
    }
    source?: string
  }
}

interface IMessage {
  role: "user" | "assistant"
  content: string
  documents?: Doc[]
  timestamp?: Date
}

const SUGGESTED_PROMPTS = [
  "What is the main topic of this document?",
  "Can you summarize the key points?",
  "What are the conclusions mentioned?",
  "Are there any important dates or numbers?",
  "What methodology was used?",
  "Who are the main authors or contributors?",
]

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>("")
  const [messages, setMessages] = React.useState<IMessage[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendChatMessage = async (messageText?: string) => {
    const textToSend = messageText || message
    if (!textToSend.trim()) return

    const userMessage: IMessage = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)

    try {
      const res = await fetch(`http://localhost:8000/chat?message=${encodeURIComponent(textToSend)}`)
      const data = await res.json()

      const assistantMessage: IMessage = {
        role: "assistant",
        content: data?.message || "Sorry, I could not process your request.",
        documents: data?.docs || [],
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: IMessage = {
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendChatMessage()
    }
  }

  const handlePromptClick = (prompt: string) => {
    handleSendChatMessage(prompt)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Chat Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 custom-scrollbar">
          <div className="space-y-6 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready to chat with your PDF</h3>
                <p className="text-muted-foreground mb-6">
                  Upload a PDF document and start asking questions about its content.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Try these prompts:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePromptClick(prompt)}
                        className="text-left justify-start h-auto py-2 px-3 text-xs btn-outline"
                        disabled={isLoading}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 dark:bg-primary/20">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "order-first" : ""}`}>
                  <Card
                    className={`${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 dark:bg-slate-800/50"}`}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.timestamp && (
                        <p
                          className={`text-xs mt-2 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {msg.documents && msg.documents.length > 0 && (
                    <Card className="document-reference bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Document References
                          </span>
                        </div>
                        <div className="space-y-2">
                          {msg.documents.map((doc, docIndex) => (
                            <div key={docIndex} className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                {doc.metadata?.loc?.pageNumber && (
                                  <Badge variant="outline" className="text-xs">
                                    Page {doc.metadata.loc.pageNumber}
                                  </Badge>
                                )}
                                {doc.metadata?.source && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {doc.metadata.source.split("/").pop()}
                                  </span>
                                )}
                              </div>
                              {doc.pageContent && (
                                <p className="text-xs text-muted-foreground bg-background/50 dark:bg-slate-900/50 p-2 rounded border line-clamp-3">
                                  {doc.pageContent.substring(0, 200)}...
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {msg.role === "user" && (
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary dark:bg-primary/90">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 dark:bg-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-muted/50 dark:bg-slate-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="flex-shrink-0" />

        <div className="p-6 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about your PDF..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => handleSendChatMessage()} disabled={!message.trim() || isLoading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </div>
  )
}

export default ChatComponent
