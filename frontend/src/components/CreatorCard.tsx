import * as React from "react";

export interface Creator {
  id: number;
  name: string;
  platform: string;
  followers: number;
  niche: string;
  language?: string;
}

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div className="font-semibold text-lg mb-1">{creator.name}</div>
      <div className="text-sm text-muted-foreground mb-1">
        {creator.platform} &mdash; {creator.niche}
      </div>
      <div className="text-sm mb-1">Followers: {creator.followers.toLocaleString()}</div>
      {creator.language && (
        <div className="text-sm text-gray-500">Language: {creator.language}</div>
      )}
    </div>
  );
} 