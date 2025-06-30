"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Challenge {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  fileUrls: string[];
  flag: string;
  published: boolean;
}

export default function AdminChallengePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null,
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const groupChallengesByCategory = (challenges: Challenge[]) => {
    const uniqueCategories = Array.from(
      new Set(challenges.map((c) => c.category)),
    );
    setCategories(uniqueCategories);
  };

  const getDifficultyOrder = (difficulty: string): number => {
    switch (difficulty) {
      case "Easy":
        return 0;
      case "Medium":
        return 1;
      case "Hard":
        return 2;
      case "Insane":
        return 3;
      default:
        return 1;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (!session.user.isAdmin) {
      router.push("/");
      return;
    }
    fetchChallenges();
  }, [session]);

  const fetchChallenges = async () => {
    try {
      const response = await fetch("/api/admin/challenges");
      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
        groupChallengesByCategory(data);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const fileUrls = Array.from(formData.getAll("fileUrls")).filter(
      (url) => url !== "",
    );
    const challengeData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      difficulty: formData.get("difficulty"),
      category: formData.get("category") as string,
      fileUrls,
      flag: formData.get("flag") as string,
    };

    try {
      const url = editingChallenge
        ? `/api/challenges/${editingChallenge._id}`
        : "/api/challenges";
      const method = editingChallenge ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(challengeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save challenge");
      }

      setShowDialog(false);
      setEditingChallenge(null);
      fetchChallenges();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setShowDialog(true);
  };

  const handleDelete = async (challengeId: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete challenge");
      }

      fetchChallenges();
    } catch (error) {
      console.error("Error deleting challenge:", error);
    }
  };

  const filteredCategories = selectedCategory
    ? categories.filter((category) => category === selectedCategory)
    : categories;

  const filteredChallenges = challenges
    .filter((challenge) => {
      const matchesCategory = selectedCategory
        ? challenge.category === selectedCategory
        : true;
      const matchesSearch =
        challenge.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        challenge.description
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      // First sort by difficulty
      const difficultyDiff =
        getDifficultyOrder(a.difficulty) - getDifficultyOrder(b.difficulty);
      return difficultyDiff;
    });

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Challenge Management
            </h1>
            <Dialog
              open={showDialog}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingChallenge(null);
                  setShowDialog(false);
                } else {
                  setEditingChallenge(editingChallenge);
                  setShowDialog(true);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setShowDialog(true)}>
                  Add Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingChallenge ? "Edit Challenge" : "Add New Challenge"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingChallenge?.title}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      defaultValue={editingChallenge?.description}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      name="category"
                      defaultValue={editingChallenge?.category}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a category</option>
                      <option value="Digital Forensics">
                        Digital Forensics
                      </option>
                      <option value="Steganography">Steganography</option>
                      <option value="OSINT">OSINT</option>
                      <option value="Web Exploitation">Web Exploitation</option>
                      <option value="Binary Exploitation">
                        Binary Exploitation
                      </option>
                      <option value="Reverse Engineering">
                        Reverse Engineering
                      </option>
                      <option value="Cryptography">Cryptography</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <select
                      id="difficulty"
                      name="difficulty"
                      defaultValue={editingChallenge?.difficulty}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a difficulty</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Insane">Insane</option>
                    </select>
                  </div>

                  <div>
                    <Label>File URLs</Label>
                    {[0, 1, 2].map((index) => (
                      <Input
                        key={index}
                        name="fileUrls"
                        defaultValue={editingChallenge?.fileUrls?.[index] || ""}
                        className="mt-1"
                        placeholder={`File URL ${index + 1} (optional)`}
                      />
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="flag">Correct Flag</Label>
                    <Input
                      id="flag"
                      name="flag"
                      type="text"
                      defaultValue={editingChallenge?.flag}
                      required
                      className="mt-1"
                      placeholder="SKICTF{...}"
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading
                      ? editingChallenge
                        ? "Updating..."
                        : "Creating..."
                      : editingChallenge
                        ? "Update Challenge"
                        : "Create Challenge"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCategories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges
                .filter((challenge) => challenge.category === category)
                .map((challenge) => (
                  <div
                    key={challenge._id}
                    className="p-6 rounded-lg shadow-lg space-y-3 border bg-card"
                  >
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold break-words">
                        {challenge.title}
                      </h2>
                      <p className="text-muted-foreground break-words line-clamp-1">
                        {challenge.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="text-muted-foreground font-medium">
                        Difficulty: {challenge.difficulty}
                      </span>
                      <span className="text-muted-foreground">
                        Category: {challenge.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {challenge.fileUrls && challenge.fileUrls.length > 0 && (
                        <span className="text-muted-foreground">
                          {challenge.fileUrls.length} file(s) attached
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(challenge)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(challenge._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
