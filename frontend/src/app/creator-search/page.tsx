"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CreatorCard } from "@/components/CreatorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

// 1) New import
import { fetchRecommendations } from "@/lib/fetchRecommendations";

export default function CreatorSearchPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaignId") || "";
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [searchPrompt, setSearchPrompt] = useState("");

  // React Query to fetch influencers
  async function fetchInfluencersByPrompt(prompt: string) {
    const res = await fetch("/api/influencers-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: prompt }),
    });
    if (!res.ok) throw new Error("Failed to search influencers");
    return res.json() as Promise<{ influencers: any[] }>;
  }

  const {
    data,
    isLoading: isFetchingInfluencers,
    isError: errorFetchingInfluencers,
  } = useQuery({
    queryKey: ["influencers", searchPrompt],
    queryFn: () => fetchInfluencersByPrompt(searchPrompt),
    enabled: !!searchPrompt,
  });

  // 2) State to hold GPT’s recommendation text
  const [recommendationText, setRecommendationText] = useState<string | null>(null);
  const [isFetchingRecommendation, setIsFetchingRecommendation] = useState(false);
  const [errorFetchingRecommendation, setErrorFetchingRecommendation] = useState<string | null>(null);

  // 3) useEffect: whenever data.influencers changes, kick off GPT call
  useEffect(() => {
    if (data?.influencers && data.influencers.length > 0 && campaignId) {
      setIsFetchingRecommendation(true);
      setErrorFetchingRecommendation(null);

      // Call the new API route
      fetchRecommendations(campaignId, data.influencers)
        .then((text) => {
          setRecommendationText(text);
        })
        .catch((err) => {
          console.error("Error fetching recommendation:", err);
          setErrorFetchingRecommendation("Failed to get GPT recommendation.");
        })
        .finally(() => {
          setIsFetchingRecommendation(false);
        });
    }
  }, [data?.influencers, campaignId]);

  // 4) Invite function (unchanged)
  const inviteInfluencer = async (influencerId: string) => {
    if (!campaignId) {
      alert("No campaign selected to invite to.");
      return;
    }
    const resp = await fetch(`/api/campaign/${campaignId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ influencer_id: influencerId }),
    });
    if (!resp.ok) {
      alert("Failed to send invite.");
    } else {
      alert("Invitation sent!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Creator Search</h1>
      <Button
          variant="secondary"
          onClick={() => router.push(`/campaign/${campaignId}`)}
        >
          Back to Campaign
        </Button>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search influencers by name, category…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button disabled={!prompt} onClick={() => setSearchPrompt(prompt)}>
          Search
        </Button>
      </div>

      {campaignId && (
        <p className="text-sm text-gray-600">
          Inviting into campaign <strong>{campaignId}</strong>
        </p>
      )}

      {isFetchingInfluencers && <div>Loading influencers…</div>}
      {errorFetchingInfluencers && (
        <div className="text-red-500">Error loading influencers.</div>
      )}

      {data && data.influencers && (
        <>
          <div className="grid gap-4">
            {data.influencers.map((inf: any) => (
              <div
                key={inf.id}
                className="flex items-center justify-between p-4 border rounded shadow-sm bg-white"
              >
                <div>
                  <p className="font-semibold">{inf.name}</p>
                  <p className="text-sm text-gray-600">
                    {inf.categories?.join(", ")}
                  </p>
                </div>
                <Button size="sm" onClick={() => inviteInfluencer(inf.id)}>
                  Invite
                </Button>
              </div>
            ))}
          </div>

          {/* 5) Display the GPT recommendation below the list */}
          <div className="pt-6">
            {isFetchingRecommendation && <div>Generating recommendation…</div>}
            {errorFetchingRecommendation && (
              <div className="text-red-500">{errorFetchingRecommendation}</div>
            )}
            {recommendationText && (
              <div className="p-4 border rounded bg-gray-50">
                <h2 className="text-lg font-semibold mb-2">GPT Recommendation</h2>
                <p>{recommendationText}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
