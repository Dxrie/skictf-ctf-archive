"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { IUser } from "@/models/User";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users/all");
        if (response.ok) {
          const data = await response.json();
          const sortedUsers = data.sort(
            (a: IUser, b: IUser) => b.solves.length - a.solves.length,
          );
          setUsers(sortedUsers);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Leaderboard
        </h1>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden border">
          <Table>
            <TableCaption>
              Live player rankings based on challenge scores.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Player Name</TableHead>
                <TableHead className="text-right">Solves</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: IUser, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <Link href={`/teams/${user._id}`}>{user.username}</Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.solves.length}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
