// frontend/src/lib/fetchRecommendations.ts
export async function fetchRecommendations(
    campaignId: string,
    influencers: any[]
  ): Promise<string> {
    const res = await fetch("/api/influencers-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, influencers }),
    });
  
    if (!res.ok) {
      throw new Error("Failed to fetch recommendations");
    }
    const json = await res.json() as { recommendation: string };
    return json.recommendation;
  }
  