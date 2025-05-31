"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { Card, Badge } from "@/components/ui/card"; // If you have these components
// import Image from "next/image";

// Placeholder for Supabase client and user
const user = { id: 1 };

const mockInfluencer = {
  id: 1,
  name: "Jane Doe",
  username: "janedoe",
  bio: "Fashion and lifestyle influencer.",
  profile_picture_url: "",
  city: "Los Angeles",
  state: "CA",
  country: "USA",
  categories: ["Fashion", "Lifestyle"],
  rate_per_post: 8000,
  availability: "Available",
  social_media: [
    {
      platform: "instagram",
      handle: "@janedoe",
      followers: 120000,
      engagement: 3.2,
      url: "https://instagram.com/janedoe",
    },
    {
      platform: "youtube",
      handle: "JaneDoeYT",
      subscribers: 50000,
      avg_views: 15000,
      url: "https://youtube.com/janedoe",
    },
    {
      platform: "tiktok",
      handle: "@janedoe",
      followers: 90000,
      engagement: 4.1,
      url: "https://tiktok.com/@janedoe",
    },
  ],
};

const mockCampaigns = [
  {
    campaign: {
      id: 1,
      title: "Spring Collection Launch",
      business_name: "Acme Corp",
      status: "Active",
      deliverables: ["Instagram Post", "Story"],
      payment_status: "Paid",
    },
  },
  {
    campaign: {
      id: 2,
      title: "Summer Fitness Promo",
      business_name: "FitBrand",
      status: "Completed",
      deliverables: ["YouTube Video"],
      payment_status: "Pending",
    },
  },
];

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${color || "bg-muted text-foreground"}`}>{children}</span>
  );
}

function SocialCard({ sm }: { sm: any }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: <span role="img" aria-label="Instagram">📸</span>,
    youtube: <span role="img" aria-label="YouTube">📺</span>,
    tiktok: <span role="img" aria-label="TikTok">🎵</span>,
  };
  return (
    <div className="border rounded-lg p-3 flex items-center gap-3 bg-card">
      <a href={sm.url} target="_blank" rel="noopener noreferrer" className="text-xl">{icons[sm.platform]}</a>
      <div className="flex-1">
        <div className="font-semibold">{sm.handle}</div>
        {sm.followers && <div className="text-xs">Followers: {sm.followers.toLocaleString()}</div>}
        {sm.subscribers && <div className="text-xs">Subscribers: {sm.subscribers.toLocaleString()}</div>}
        {sm.avg_views && <div className="text-xs">Avg. Views: {sm.avg_views.toLocaleString()}</div>}
        {sm.engagement && <div className="text-xs">Engagement: {sm.engagement}%</div>}
      </div>
    </div>
  );
}

export default function InfluencerDashboard() {
  const [influencer, setInfluencer] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Replace with real Supabase calls
      // const { data: influencer } = await supabase.from("influencer").select("*").eq("id", user.id).single();
      // const { data: campaigns } = await supabase.from("campaign_influencer").select("campaign(*)").eq("influencer_id", user.id);
      setInfluencer(mockInfluencer);
      setCampaigns(mockCampaigns);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!influencer) return <div className="p-8">Influencer not found.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
      {/* Left Panel: Profile Overview */}
      <div>
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            {influencer.profile_picture_url ? (
              // <Image src={influencer.profile_picture_url} alt="Profile" width={64} height={64} className="rounded-full" />
              <img src={influencer.profile_picture_url} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl">
                <span role="img" aria-label="User">👤</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{influencer.name}</h2>
              <p className="text-sm text-gray-500">@{influencer.username}</p>
            </div>
          </div>
          <p className="mb-2 text-muted-foreground">{influencer.bio}</p>
          <div className="mb-2">
            <span className="font-semibold">Location:</span> {influencer.city}, {influencer.state}, {influencer.country}
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {influencer.categories.map((cat: string) => (
              <Badge key={cat} color="bg-blue-100 text-blue-800">{cat}</Badge>
            ))}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Rate per Post:</span> ₹{influencer.rate_per_post.toLocaleString()}
          </div>
          <div className="mb-4">
            <span className="font-semibold">Availability:</span>{" "}
            <Badge color={influencer.availability === "Available" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {influencer.availability}
            </Badge>
          </div>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {influencer.social_media.map((sm: any) => (
              <SocialCard key={sm.platform} sm={sm} />
            ))}
          </div>
          <Button onClick={() => alert("Edit Profile not yet implemented")}>Edit Profile</Button>
        </div>
      </div>
      {/* Right Panel: My Campaigns */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">My Campaigns</h3>
        </div>
        {campaigns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">You have not been invited to any campaigns yet.</div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c: any) => (
              <div key={c.campaign.id} className="border rounded-lg p-4 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-lg">{c.campaign.title}</div>
                  <div className="text-sm text-muted-foreground">{c.campaign.business_name}</div>
                  <div className="text-sm">Status: {c.campaign.status}</div>
                  <div className="text-sm">Deliverables: {c.campaign.deliverables.join(", ")}</div>
                  <div className="text-sm">Payment: {c.campaign.payment_status}</div>
                </div>
                <Link href={`/campaigns/${c.campaign.id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 