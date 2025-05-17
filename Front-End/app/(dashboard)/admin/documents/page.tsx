"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { FileText, Upload, Download, Share2, Trash2, FolderOpen, Search } from "lucide-react"

interface Document {
  id: string
  name: string
  description: string
  category: string
  fileUrl: string
  fileType: string
  fileSize: number
  version: number
  uploadedBy: string
  uploadedAt: Date
  lastModified: Date
  sharedWith: string[]
  tags: string[]
}

interface Category {
  id: string
  name: string
  description: string
  documentCount: number
}

interface TeamMember {
  id: string
  fullName: string
  email: string
  role: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login/admin")
      return
    }
    loadDocumentsData()
  }, [user, router])

  const loadDocumentsData = async () => {
    try {
      // Load documents
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("*")

      if (documentError) throw documentError

      // Load categories
      const { data: categoryData, error: categoryError } = await supabase
        .from("document_categories")
        .select("*")

      if (categoryError) throw categoryError

      // Load team members
      const { data: teamData, error: teamError } = await supabase
        .from("team_members")
        .select("*")

      if (teamError) throw teamError

      // Process documents
      const processedDocuments = documentData.map((doc: any) => ({
        ...doc,
        uploadedAt: new Date(doc.uploaded_at),
        lastModified: new Date(doc.last_modified),
      }))

      setDocuments(processedDocuments)
      setCategories(categoryData)
      setTeamMembers(teamData)
    } catch (error) {
      console.error("Error loading documents data:", error)
      toast({
        title: "Error",
        description: "Failed to load documents data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadDocument = async (formData: FormData) => {
    try {
      const file = formData.get("file") as File
      const name = formData.get("name") as string
      const description = formData.get("description") as string
      const category = formData.get("category") as string
      const tags = (formData.get("tags") as string).split(",").map((tag) => tag.trim())

      // Upload file to storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from("documents")
        .upload(fileName, file)

      if (fileError) throw fileError

      // Get file URL
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName)

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            name,
            description,
            category,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            version: 1,
            uploaded_by: user?.id,
            uploaded_at: new Date().toISOString(),
            last_modified: new Date().toISOString(),
            shared_with: [],
            tags,
          },
        ])
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })

      setIsUploadDialogOpen(false)
      loadDocumentsData()
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      })
    }
  }

  const handleShareDocument = async (formData: FormData) => {
    if (!selectedDocument) return

    try {
      const sharedWith = formData.getAll("sharedWith") as string[]

      const { error } = await supabase
        .from("documents")
        .update({ shared_with: sharedWith })
        .eq("id", selectedDocument.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Document shared successfully",
      })

      setIsShareDialogOpen(false)
      loadDocumentsData()
    } catch (error) {
      console.error("Error sharing document:", error)
      toast({
        title: "Error",
        description: "Failed to share document",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Document deleted successfully",
      })

      loadDocumentsData()
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document to the system
              </DialogDescription>
            </DialogHeader>
            <form action={handleUploadDocument}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">File</Label>
                  <Input id="file" name="file" type="file" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" name="tags" placeholder="e.g. report, draft, final" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Upload</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="shared">Shared with Me</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>View and manage all documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Shared With</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {doc.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories.find((cat) => cat.id === doc.category)?.name}
                      </TableCell>
                      <TableCell>v{doc.version}</TableCell>
                      <TableCell>
                        {format(doc.lastModified, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {doc.sharedWith.length} users
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.fileUrl, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc)
                              setIsShareDialogOpen(true)
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared">
          <Card>
            <CardHeader>
              <CardTitle>Shared with Me</CardTitle>
              <CardDescription>Documents shared with you</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Shared By</TableHead>
                    <TableHead>Shared On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments
                    .filter((doc) => doc.sharedWith.includes(user?.id || ""))
                    .map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {doc.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {categories.find((cat) => cat.id === doc.category)?.name}
                        </TableCell>
                        <TableCell>{doc.uploadedBy}</TableCell>
                        <TableCell>
                          {format(doc.uploadedAt, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.fileUrl, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {category.documentCount} documents
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>Share Document</DialogTitle>
                <DialogDescription>
                  Share "{selectedDocument.name}" with team members
                </DialogDescription>
              </DialogHeader>
              <form action={handleShareDocument}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Share with</Label>
                    <Select name="sharedWith">
                      <SelectTrigger>
                        <SelectValue placeholder="Select team members" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member: TeamMember) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Share</Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 
