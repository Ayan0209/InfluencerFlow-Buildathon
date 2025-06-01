import React from "react";

interface Creator {
  id: string;
  name: string;
  bio?: string;
  categories?: string[];
  profile_picture_url?: string;
  // add any other real fields here
}

export const CreatorCard = ({ creator }: { creator: Creator }) => (
  <div className="p-4 border rounded shadow-sm bg-white flex gap-4 items-start">
    {creator.profile_picture_url && (
      <img
        src={creator.profile_picture_url}
        alt={creator.name}
        className="w-16 h-16 object-cover rounded-full"
      />
    )}
    <div>
      <div className="font-semibold text-lg">{creator.name}</div>
      {creator.bio && (
        <div className="mt-2 text-sm text-gray-800">
          <strong>Bio:</strong> {creator.bio}
        </div>
      )}
      {creator.categories && creator.categories.length > 0 && (
        <div className="mt-2 text-sm text-gray-800">
          <strong>Categories:</strong> {creator.categories.join(", ")}
        </div>
      )}
    </div>
  </div>
);