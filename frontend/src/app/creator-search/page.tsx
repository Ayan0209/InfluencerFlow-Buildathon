'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreatorCard } from "@/components/CreatorCard";

interface Creator {
  id: number;
  name: string;
  niche: string;
  followers: number;
  platform: string;
}

interface ApiResponse {
  creators: Creator[];
  gpt_summary: string;
}

function fetchCreators(prompt: string): Promise<ApiResponse> {
  return fetch(`/api/creator/search?prompt=${encodeURIComponent(prompt)}`)
    .then((res) => res.json());
}

export default function CreatorSearchPage() {
  const [prompt, setPrompt] = useState("");
  const [searchPrompt, setSearchPrompt] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["creators", searchPrompt],
    queryFn: () => fetchCreators(searchPrompt),
    enabled: !!searchPrompt,
  });

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Creator Search</h1>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          className="input input-bordered flex-1 px-3 py-2 rounded border"
          placeholder="Enter campaign prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="btn btn-primary px-4 py-2 rounded bg-black text-white"
          onClick={() => setSearchPrompt(prompt)}
          disabled={!prompt}
        >
          Search
        </button>
      </div>
      {isLoading && <div>Loading...</div>}
      {isError && <div className="text-red-500">Error fetching creators.</div>}
      {data && (
        <>
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <strong>GPT Summary:</strong> {data.gpt_summary}
          </div>
          <div className="grid gap-4">
            {data.creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
              // <div
              //   key={creator.id}
              //   className="p-4 border rounded shadow-sm bg-white"
              // >
              //   <div className="font-semibold text-lg">{creator.name}</div>
              //   <div className="text-sm text-gray-600">{creator.platform} &mdash; {creator.niche}</div>
              //   <div className="text-sm">Followers: {creator.followers.toLocaleString()}</div>
              // </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 




