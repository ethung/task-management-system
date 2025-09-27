"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Eye, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Win {
  id: string;
  title: string;
  description?: string;
  date: string;
  tags: string[];
  visibility: "PRIVATE" | "PUBLIC";
  createdAt: string;
  updatedAt: string;
}

interface WinsListProps {
  onEdit: (win: Win) => void;
  refreshTrigger?: number;
}

export function WinsList({ onEdit, refreshTrigger }: WinsListProps) {
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [winToDelete, setWinToDelete] = useState<Win | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchWins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }

      if (selectedTags.length > 0) {
        params.append("tags", selectedTags.join(","));
      }

      if (visibilityFilter) {
        params.append("visibility", visibilityFilter);
      }

      const response = await fetch(`/api/career-wins?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch career wins");
      }

      const data = await response.json();
      setWins(data.careerWins);
      setTotalPages(data.totalPages);

      // Extract all unique tags for filtering
      const tagsSet = new Set<string>();
      data.careerWins.forEach((win: Win) => {
        win.tags.forEach((tag) => tagsSet.add(tag));
      });
      setAllTags(Array.from(tagsSet));
    } catch (error) {
      console.error("Error fetching wins:", error);
      toast.error("Failed to load career wins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWins();
  }, [
    currentPage,
    searchQuery,
    selectedTags,
    visibilityFilter,
    refreshTrigger,
  ]);

  const handleDelete = async (win: Win) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`/api/career-wins/${win.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete career win");
      }

      toast.success("Career win deleted successfully");
      setDeleteDialogOpen(false);
      setWinToDelete(null);
      fetchWins();
    } catch (error) {
      console.error("Error deleting win:", error);
      toast.error("Failed to delete career win");
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-3/4 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Search career wins..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={visibilityFilter}
            onValueChange={(value) => {
              setVisibilityFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
            </SelectContent>
          </Select>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTagFilter(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {allTags.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{allTags.length - 10} more
                </Badge>
              )}
            </div>
          )}

          {(selectedTags.length > 0 || visibilityFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTags([]);
                setVisibilityFilter("");
                setCurrentPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Wins List */}
      {wins.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery || selectedTags.length > 0 || visibilityFilter
                ? "No career wins found matching your filters."
                : "No career wins yet. Create your first one to get started!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {wins.map((win) => (
            <Card key={win.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-lg">{win.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{format(new Date(win.date), "MMM d, yyyy")}</span>
                    <Badge
                      variant={
                        win.visibility === "PUBLIC" ? "default" : "secondary"
                      }
                    >
                      {win.visibility.toLowerCase()}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(win)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setWinToDelete(win);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {win.description && (
                  <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                    {win.description}
                  </p>
                )}
                {win.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {win.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Career Win</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{winToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setWinToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => winToDelete && handleDelete(winToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
