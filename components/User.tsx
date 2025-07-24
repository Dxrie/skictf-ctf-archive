"use client";

import { IUser } from "@/models/User";
import { useEffect, useState } from "react";

interface Challenge {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
}

export default function User({ teamId }: { teamId: string }) {
  const [user, setUser] = useState<IUser | undefined>(undefined);
  const [solved, setSolved] = useState<Challenge[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      const response = await fetch(`/api/user/${teamId}`);
      const data = await response.json();

      if (!response.ok) {
        setError("Team not found.");
        return;
      }

      setUser(data);
      const solves: [Challenge] = data.solves;
      solves.reverse();
      setSolved(solves);
    }

    fetchTeam();
  }, [teamId]);

  return (
    <div className="min-h-screen px-4 py-8 bg-background text-foreground">
      <div className="max-w-3xl mx-auto space-y-6">
        {user ? (
          <>
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {user.username}
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Total Solves:{" "}
                <span className="font-semibold">{user.solves.length}</span>
              </p>
            </div>

            <div className="bg-card rounded-xl shadow-md p-6 border">
              <h2 className="text-2xl font-semibold mb-4">Solved Challenges</h2>
              {solved.length > 0 ? (
                <ul className="space-y-3">
                  {solved.map((challenge) => (
                    <li
                      key={challenge._id}
                      className="border-b pb-2 flex justify-between"
                    >
                      <div>
                        <p className="font-medium">{challenge.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Difficulty: {challenge.difficulty}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {challenge.category}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  No challenges solved yet.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-lg text-muted-foreground">
            {error || "Loading user data..."}
          </div>
        )}
      </div>
    </div>
  );
}
