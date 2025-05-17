"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ArrowLeft, MessageSquare, Paperclip, Send, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    full_name: string;
    profile_picture?: string;
  };
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

interface TicketDetails {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  assigned_to?: {
    id: string;
    full_name: string;
    profile_picture?: string;
  };
  created_by: {
    id: string;
    full_name: string;
    profile_picture?: string;
  };
  comments: Comment[];
  attachments: Attachment[];
}

export default function TicketDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    // TODO: Implement data fetching from Supabase
    // For now, using mock data
    setTicket({
      id: id as string,
      title: "System access issue",
      description: "Unable to access the development environment. Getting permission denied error.",
      status: "open",
      priority: "high",
      created_at: "2024-03-20T10:00:00",
      updated_at: "2024-03-20T10:00:00",
      created_by: {
        id: "1",
        full_name: "John Doe",
      },
      comments: [
        {
          id: "1",
          user_id: "1",
          content: "I've tried restarting my computer but the issue persists.",
          created_at: "2024-03-20T10:05:00",
          user: {
            full_name: "John Doe",
          },
        },
      ],
      attachments: [],
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement comment submission to Supabase
      const comment: Comment = {
        id: Date.now().toString(),
        user_id: user?.id || "",
        content: newComment,
        created_at: new Date().toISOString(),
        user: {
          full_name: user?.full_name || "",
          profile_picture: user?.profile_picture,
        },
      };

      setTicket(prev => prev ? {
        ...prev,
        comments: [...prev.comments, comment],
      } : null);
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      // TODO: Implement file upload to Supabase storage
      const attachment: Attachment = {
        id: Date.now().toString(),
        filename: selectedFile.name,
        url: "#", // Replace with actual URL after upload
        size: selectedFile.size,
        type: selectedFile.type,
        uploaded_at: new Date().toISOString(),
      };

      setTicket(prev => prev ? {
        ...prev,
        attachments: [...prev.attachments, attachment],
      } : null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Ticket Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{ticket.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        ticket.status === 'open' ? 'default' :
                        ticket.status === 'in_progress' ? 'secondary' :
                        ticket.status === 'resolved' ? 'success' : 'outline'
                      }>
                        {ticket.status}
                      </Badge>
                      <Badge variant={
                        ticket.priority === 'high' ? 'destructive' :
                        ticket.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p>{ticket.description}</p>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Created by {ticket.created_by.full_name} on {format(new Date(ticket.created_at), 'MMM d, yyyy')}</p>
                    <p>Last updated on {format(new Date(ticket.updated_at), 'MMM d, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <AnimatePresence>
                      {ticket.comments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex space-x-4"
                        >
                          <div className="flex-shrink-0">
                            {comment.user.profile_picture ? (
                              <img
                                src={comment.user.profile_picture}
                                alt={comment.user.full_name}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{comment.user.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="file" className="cursor-pointer">
                            <Paperclip className="h-4 w-4" />
                          </Label>
                          <Input
                            id="file"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          {selectedFile && (
                            <span className="text-sm text-muted-foreground">
                              {selectedFile.name}
                            </span>
                          )}
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ticket.attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attachments yet</p>
                    ) : (
                      <div className="space-y-2">
                        {ticket.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-2 rounded-md bg-muted"
                          >
                            <div className="flex items-center space-x-2">
                              <Paperclip className="h-4 w-4" />
                              <span className="text-sm">{attachment.filename}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline">
                      Update Status
                    </Button>
                    <Button className="w-full" variant="outline">
                      Assign Ticket
                    </Button>
                    <Button className="w-full" variant="destructive">
                      Close Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
} 