"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreatorCard } from "@/components/CreatorCard";
// import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
// import { Spinner } from "@/components/ui/spinner";

const categoriesList = [
  "Fashion",
  "Tech",
  "Fitness",
  "Travel",
  "Beauty",
  "Food",
  "Lifestyle",
  "Gaming",
  "Education",
];

const platforms = ["instagram", "youtube", "tiktok"];

const mockInfluencers = [
  {
    id: 1,
    name: "Jane Doe",
    platform: "Instagram",
    followers: 120000,
    niche: "Fashion",
    language: "English",
  },
  {
    id: 2,
    name: "John Smith",
    platform: "TikTok",
    followers: 90000,
    niche: "Tech",
    language: "English",
  },
];

const mockCampaigns = [
  { id: 1, title: "Spring Launch" },
  { id: 2, title: "Summer Promo" },
];

function Spinner() {
  return <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full mx-auto my-8" />;
}

function Checkbox({ checked, onChange, id, children }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} id={id} className="accent-primary" />
      {children}
    </label>
  );
}

function Dialog({ open, onClose, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-6 min-w-[300px] shadow-lg relative">
        <button className="absolute top-2 right-2 text-gray-400" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
}

function inviteToCampaign(influencerId: number, campaignId: number) {
  // Placeholder for invite logic
  // eslint-disable-next-line no-console
  console.log("Invite", influencerId, "to campaign", campaignId);
}

export default function DiscoverPage() {
  const [filters, setFilters] = useState({
    search: "",
    categories: [] as string[],
    city: "",
    state: "",
    country: "",
    platforms: [] as string[],
    followersMin: "",
    followersMax: "",
    engagementMin: "",
    engagementMax: "",
    rateMin: "",
    rateMax: "",
    availability: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [inviteDialog, setInviteDialog] = useState<{ open: boolean; influencerId?: number }>({ open: false });
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);

  // Simulate data fetch
  const influencers = mockInfluencers;

  function handleFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFilters(prev => ({
        ...prev,
        [name as keyof typeof prev]: checked
          ? [...(prev[name as keyof typeof prev] as string[]), value]
          : (prev[name as keyof typeof prev] as string[]).filter((v: string) => v !== value),
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleCategoryChange(cat: string, checked: boolean) {
    setFilters(prev => ({
      ...prev,
      categories: checked ? [...prev.categories, cat] : prev.categories.filter(c => c !== cat),
    }));
  }

  function handlePlatformChange(platform: string, checked: boolean) {
    setFilters(prev => ({
      ...prev,
      platforms: checked ? [...prev.platforms, platform] : prev.platforms.filter(p => p !== platform),
    }));
  }

  function handleAvailabilityChange(status: string, checked: boolean) {
    setFilters(prev => ({
      ...prev,
      availability: checked ? [...prev.availability, status] : prev.availability.filter(a => a !== status),
    }));
  }

  function handleInvite(influencerId: number) {
    setInviteDialog({ open: true, influencerId });
    setSelectedCampaign(null);
  }

  function handleSendInvite() {
    if (inviteDialog.influencerId && selectedCampaign) {
      inviteToCampaign(inviteDialog.influencerId, selectedCampaign);
      setInviteDialog({ open: false });
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">Discover Influencers</h1>
      {/* Accordion for Filters */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="border rounded-lg bg-card">
          <div className="p-4 border-b">
            <span className="font-semibold">Filters</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Search by name or bio…"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {categoriesList.map(cat => (
                  <Checkbox
                    key={cat}
                    checked={filters.categories.includes(cat)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCategoryChange(cat, e.target.checked)}
                    id={`cat-${cat}`}
                  >
                    <Label htmlFor={`cat-${cat}`}>{cat}</Label>
                  </Checkbox>
                ))}
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input name="city" placeholder="City" value={filters.city} onChange={handleFilterChange} />
                <Input name="state" placeholder="State" value={filters.state} onChange={handleFilterChange} />
                <Input name="country" placeholder="Country" value={filters.country} onChange={handleFilterChange} />
              </div>
            </div>
            <div>
              <Label>Platform</Label>
              <div className="flex gap-4 mt-1">
                {platforms.map(platform => (
                  <Checkbox
                    key={platform}
                    checked={filters.platforms.includes(platform)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePlatformChange(platform, e.target.checked)}
                    id={`platform-${platform}`}
                  >
                    <Label htmlFor={`platform-${platform}`}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Label>
                  </Checkbox>
                ))}
              </div>
            </div>
            <div>
              <Label>Followers</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  name="followersMin"
                  value={filters.followersMin}
                  onChange={handleFilterChange}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  name="followersMax"
                  value={filters.followersMax}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <Label>Engagement %</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  name="engagementMin"
                  value={filters.engagementMin}
                  onChange={handleFilterChange}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  name="engagementMax"
                  value={filters.engagementMax}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <Label>Rate (₹)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  name="rateMin"
                  value={filters.rateMin}
                  onChange={handleFilterChange}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  name="rateMax"
                  value={filters.rateMax}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div>
              <Label>Availability</Label>
              <div className="flex gap-4 mt-1">
                <Checkbox
                  checked={filters.availability.includes("Available")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAvailabilityChange("Available", e.target.checked)}
                  id="avail-available"
                >
                  <Label htmlFor="avail-available">Available</Label>
                </Checkbox>
                <Checkbox
                  checked={filters.availability.includes("Busy")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAvailabilityChange("Busy", e.target.checked)}
                  id="avail-busy"
                >
                  <Label htmlFor="avail-busy">Busy</Label>
                </Checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Loading Spinner */}
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
          {influencers.map(influencer => (
            <div key={influencer.id} className="relative">
              <CreatorCard creator={influencer} />
              <Button className="absolute top-4 right-4" size="sm" onClick={() => handleInvite(influencer.id)}>
                Invite
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Invite Dialog */}
      <Dialog open={inviteDialog.open} onClose={() => setInviteDialog({ open: false })}>
        <div className="mb-4">
          <Label htmlFor="campaign-select">Select Campaign</Label>
          <select
            id="campaign-select"
            className="w-full border rounded px-3 py-2 mt-1"
            value={selectedCampaign ?? ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCampaign(Number(e.target.value))}
          >
            <option value="" disabled>Select a campaign…</option>
            {mockCampaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleSendInvite} disabled={!selectedCampaign} className="w-full">Send Invite</Button>
      </Dialog>
    </div>
  );
} 