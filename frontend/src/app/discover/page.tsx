// frontend/src/app/discover/page.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Influencer {
  id: string;
  name: string;
  username: string;
  profile_picture_url: string | null;
  location: any;
  social_media: any;
  categories: string[] | null;
  rate_per_post: number | null;
  availability: string | null;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<{
    search: string;
    categories: string[];
    city: string;
    state: string;
    country: string;
    platforms: string[];
    followersMin: number | "";
    followersMax: number | "";
    engagementMin: number | "";
    engagementMax: number | "";
    rateMin: number | "";
    rateMax: number | "";
    availability: string;
  }>({
    search: "",
    categories: [],
    city: "",
    state: "",
    country: "",
    platforms: [],
    followersMin: "",
    followersMax: "",
    engagementMin: "",
    engagementMax: "",
    rateMin: "",
    rateMax: "",
    availability: "",
  });
  const [results, setResults] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function toggleArrayField(key: keyof typeof filters, value: string) {
    setFilters((prev) => {
      const arr = prev[key] as unknown as string[];
      const next = arr.includes(value)
        ? arr.filter((s) => s !== value)
        : [...arr, value];
      return { ...prev, [key]: next } as any;
    });
  }

  async function applyFilters() {
    setLoading(true);
    const body = {
      search: filters.search || null,
      categories: filters.categories.length ? filters.categories : null,
      city: filters.city || null,
      state: filters.state || null,
      country: filters.country || null,
      platforms: filters.platforms.length ? filters.platforms : null,
      followersMin:
        filters.followersMin !== "" ? filters.followersMin : undefined,
      followersMax:
        filters.followersMax !== "" ? filters.followersMax : undefined,
      engagementMin:
        filters.engagementMin !== "" ? filters.engagementMin : undefined,
      engagementMax:
        filters.engagementMax !== "" ? filters.engagementMax : undefined,
      rateMin: filters.rateMin !== "" ? filters.rateMin : undefined,
      rateMax: filters.rateMax !== "" ? filters.rateMax : undefined,
      availability: filters.availability || null,
    };
    const res = await fetch("/api/influencers-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert("Error fetching influencers: " + json.error);
      return;
    }
    setResults(json.influencers);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">Discover Influencers</h1>

      {/* Filters */}
      <div className="bg-gray-50 p-6 rounded-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search by Name or Username</Label>
            <Input
              name="search"
              type="text"
              id="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Enter keyword…"
            />
          </div>
          {/* Categories */}
          <div>
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Fashion", "Tech", "Fitness", "Travel"].map((cat) => (
                <label key={cat} className="flex items-center space-x-1">
                  <Checkbox
                    checked={filters.categories.includes(cat)}
                    onCheckedChange={() => toggleArrayField("categories", cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Location */}
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              name="city"
              type="text"
              id="city"
              value={filters.city}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              name="state"
              type="text"
              id="state"
              value={filters.state}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              name="country"
              type="text"
              id="country"
              value={filters.country}
              onChange={handleChange}
            />
          </div>
          {/* Platforms */} 
          <div>
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["instagram", "youtube", "tiktok"].map((plat) => (
                <label key={plat} className="flex items-center space-x-1">
                  <Checkbox
                    checked={filters.platforms.includes(plat)}
                    onCheckedChange={() => toggleArrayField("platforms", plat)}
                  />
                  <span className="capitalize">{plat}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Followers Range */}
          <div>
            <Label>Followers Min</Label>
            <Input
              name="followersMin"
              type="number"
              value={filters.followersMin}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  followersMin: e.target.value === "" ? "" : parseInt(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <Label>Followers Max</Label>
            <Input
              name="followersMax"
              type="number"
              value={filters.followersMax}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  followersMax: e.target.value === "" ? "" : parseInt(e.target.value),
                }))
              }
            />
          </div>
          {/* Engagement Range */}
          <div>
            <Label>Engagement Min (%)</Label>
            <Input
              name="engagementMin"
              type="number"
              step="0.1"
              value={filters.engagementMin}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  engagementMin: e.target.value === "" ? "" : parseFloat(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <Label>Engagement Max (%)</Label>
            <Input
              name="engagementMax"
              type="number"
              step="0.1"
              value={filters.engagementMax}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  engagementMax: e.target.value === "" ? "" : parseFloat(e.target.value),
                }))
              }
            />
          </div>
          {/* Rate Range */}
          <div>
            <Label>Rate Min (₹)</Label>
            <Input
              name="rateMin"
              type="number"
              value={filters.rateMin}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  rateMin: e.target.value === "" ? "" : parseFloat(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <Label>Rate Max (₹)</Label>
            <Input
              name="rateMax"
              type="number"
              value={filters.rateMax}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  rateMax: e.target.value === "" ? "" : parseFloat(e.target.value),
                }))
              }
            />
          </div>
          {/* Availability */}
          <div>
            <Label>Availability</Label>
            <div className="flex items-center space-x-2 mt-2">
              {["Available", "Busy"].map((status) => (
                <label key={status} className="flex items-center space-x-1">
                  <Checkbox
                    checked={filters.availability === status}
                    onCheckedChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        availability: prev.availability === status ? "" : status,
                      }))
                    }
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Apply Filters Button */}
          <div className="col-span-1 sm:col-span-2 text-right">
            <Button onClick={() => applyFilters()} disabled={loading}>
              {loading ? "Searching…" : "Apply Filters"}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {results.length === 0 ? (
        <div>No influencers match your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((inf) => (
            <div
              key={inf.id}
              className="p-4 border rounded-md bg-white flex flex-col"
            >
              <div className="mb-4 flex items-center space-x-3">
                {inf.profile_picture_url ? (
                  <Image
                    src={inf.profile_picture_url}
                    alt={inf.name}
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded-full" />
                )}
                <div>
                  <h3 className="font-semibold">{inf.name}</h3>
                  <p className="text-sm text-gray-500">@{inf.username}</p>
                </div>
              </div>
              <div className="mb-2">
                {inf.categories?.map((cat) => (
                  <Badge key={cat} className="mr-1">
                    {cat}
                  </Badge>
                )) || <span className="text-gray-500">No categories</span>}
              </div>
              <div className="mb-2 text-sm">
                Location:{" "}
                {inf.location
                  ? `${inf.location.city}, ${inf.location.state}, ${inf.location.country}`
                  : "N/A"}
              </div>
              <div className="mb-2 text-sm">
                Rate per post: ₹{inf.rate_per_post || "N/A"}
              </div>
              <div className="mb-4 text-sm">
                Availability: {inf.availability || "N/A"}
              </div>
              <div className="mt-auto">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Invite</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <h2 className="text-xl font-semibold mb-4">
                      Invite {inf.name} to Campaign
                    </h2>
                    {/* Here you would embed a dropdown of this business’s campaigns */}
                    {/* For MVP, just show a stub */}
                    <p>Campaign selection not implemented yet.</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        alert(`Invited ${inf.name} (stub)`);
                      }}
                    >
                      Confirm Invite
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
