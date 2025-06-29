"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Challenge {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  fileUrls: string[];
  solveCount: number;
  solves: string[];
  flag?: string;
  isSolved?: boolean;
  published: boolean;
  author: {
    _id: string;
    username: string;
  };
}

export default function ChallengePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );
  const [bruh, setBruh] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [flagInput, setFlagInput] = useState("");
  const [flagStatus, setFlagStatus] = useState<"" | "correct" | "incorrect">(
    "",
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Define the order of difficulties for sorting
  const difficultyOrder = ["Easy", "Medium", "Hard", "Insane"];

  // Define the order of categories for display
  const categoryOrder = [
    "Miscellaneous",
    "Steganography",
    "OSINT",
    "Digital Forensics",
    "Cryptography",
    "Reverse Engineering",
    "Web Exploitation",
    "Binary Exploitation",
  ];

  // Function to get difficulty weight for sorting
  const getDifficultyWeight = (difficulty: string): number => {
    return difficultyOrder.indexOf(difficulty);
  };

  const groupChallengesByCategory = (challenges: Challenge[]) => {
    const uniqueCategories = Array.from(
      new Set(challenges.map((c) => c.category)),
    ).sort((a, b) => {
      return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
    });
    setCategories(uniqueCategories);
  };

  useEffect(() => {
    if (!session) return router.push("/auth/login");
    fetchChallenges();
  }, [session]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!challenges) return;

    const filtered = challenges
      .filter((challenge) => {
        const matchesCategory = selectedCategory
          ? challenge.category === selectedCategory
          : true;
        const matchesSearch =
          challenge.title
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          challenge.description
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const difficultyDiff =
          getDifficultyWeight(a.difficulty) - getDifficultyWeight(b.difficulty);
        return difficultyDiff;
      });

    setFilteredChallenges(filtered);
  }, [debouncedSearchTerm, challenges, selectedCategory]);

  const fetchChallenges = async () => {
    try {
      const response = await fetch("/api/challenges");
      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
        groupChallengesByCategory(data);
      } else {
        const errorData = await response.json();
        if (response.status === 403) {
          setBruh(errorData.message);
        }
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Loading challenges...</div>
      </div>
    );
  }

  const categoriesToDisplay = selectedCategory
    ? [selectedCategory]
    : categories;

  return bruh ? (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-8 text-center md:text-left">
          {bruh}
        </h1>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-8 text-center md:text-left">
          Challenges
        </h1>

        <div className="mb-8 space-y-4">
          <Input
            type="search"
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedCategory(null)}
              variant={!selectedCategory ? "default" : "outline"}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {categoriesToDisplay.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges
                .filter((challenge) => challenge.category === category)
                .map((challenge) => (
                  <Dialog
                    key={challenge._id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setSelectedChallenge(null);
                        setFlagInput("");
                        setFlagStatus("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <div
                        className={`flex flex-col items-center justify-center p-6 rounded-lg shadow-lg space-y-3 hover:shadow-xl transition-shadow duration-200 cursor-pointer border ${challenge.isSolved
                          ? "bg-green-100/10 border-green-500/50"
                          : "bg-card"
                          }`}
                        onClick={() => setSelectedChallenge(challenge)}
                      >
                        <div className="space-y-2">
                          <p className="font-semibold break-words text-center">
                            {challenge.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${challenge.difficulty === "Easy"
                              ? "bg-green-100/20 text-green-500"
                              : challenge.difficulty === "Medium"
                                ? "bg-yellow-100/20 text-yellow-500"
                                : challenge.difficulty === "Hard"
                                  ? "bg-orange-100/20 text-orange-500"
                                  : "bg-red-100/20 text-red-500"
                              }`}
                          >
                            {challenge.difficulty}
                          </span>
                        </div>
                      </div>
                    </DialogTrigger>

                    {selectedChallenge &&
                      selectedChallenge._id === challenge._id && (
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                          <DialogHeader className="pb-4">
                            <DialogTitle className="text-2xl break-words">
                              {selectedChallenge.title}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 px-1 overflow-hidden">
                            <p className="text-muted-foreground whitespace-pre-wrap break-words">
                              {selectedChallenge.description}
                            </p>
                            {selectedChallenge.fileUrls &&
                              selectedChallenge.fileUrls.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Attachments
                                  </Label>
                                  <div className="space-y-1 flex gap-2">
                                    {selectedChallenge.fileUrls.map(
                                      (url, index) => (
                                        <a
                                          key={url}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          <Button className="cursor-pointer">
                                            Attachment {index + 1}
                                          </Button>
                                        </a>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            <div className="flex flex-wrap gap-3 text-sm items-center">
                              <span
                                className={`px-3 py-1.5 rounded-full text-sm font-medium ${selectedChallenge.difficulty === "Easy"
                                  ? "bg-green-100/20 text-green-500"
                                  : selectedChallenge.difficulty === "Medium"
                                    ? "bg-yellow-100/20 text-yellow-500"
                                    : selectedChallenge.difficulty === "Hard"
                                      ? "bg-orange-100/20 text-orange-500"
                                      : "bg-red-100/20 text-red-500"
                                  }`}
                              >
                                {selectedChallenge.difficulty}
                              </span>
                              <span className="text-muted-foreground">
                                Author: {selectedChallenge.author.username}
                              </span>
                              <span className="text-muted-foreground">
                                Solved by {selectedChallenge.solves.length}{" "}
                                player(s)
                              </span>
                            </div>
                            <div className="space-y-4 pt-4 border-t">
                              <Label
                                htmlFor="flag"
                                className="text-sm font-medium"
                              >
                                Submit Flag
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id="flag"
                                  value={flagInput}
                                  onChange={(e) => {
                                    setFlagInput(e.target.value);
                                    setFlagStatus("");
                                  }}
                                  placeholder="SKICTF{...}"
                                  className="flex-1"
                                />
                                <Button
                                  disabled={submitting}
                                  onClick={async () => {
                                    try {
                                      setSubmitting(true);
                                      const response = await fetch(
                                        `/api/challenges/${selectedChallenge._id}/submit`,
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            flag: flagInput.trim(),
                                          }),
                                        },
                                      );

                                      if (response.ok) {
                                        setFlagStatus("correct");
                                        toast(
                                          <span>
                                            Challenge{" "}
                                            <b>{selectedChallenge.title}</b> has
                                            been solved.
                                          </span>,
                                        );
                                        setChallenges((prevChallenges) =>
                                          prevChallenges.map((c) =>
                                            c._id === selectedChallenge._id
                                              ? {
                                                ...c,
                                                isSolved: true,
                                                solveCount: c.solveCount + 1,
                                              }
                                              : c,
                                          ),
                                        );
                                      } else {
                                        const r = await response.json();
                                        setError(r.message);
                                        setFlagStatus("incorrect");
                                      }
                                      setSubmitting(false);
                                    } catch (error) {
                                      console.error(
                                        "Error submitting flag:",
                                        error,
                                      );
                                      setFlagStatus("incorrect");
                                      setSubmitting(false);
                                    }
                                  }}
                                >
                                  {submitting ? "Submitting..." : "Submit"}
                                </Button>
                              </div>
                              {flagStatus === "correct" && (
                                <p className="text-green-500 text-sm">
                                  Correct flag! Challenge completed!
                                </p>
                              )}
                              {flagStatus === "incorrect" && (
                                <p className="text-red-500 text-sm">{error}</p>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      )}
                  </Dialog>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
