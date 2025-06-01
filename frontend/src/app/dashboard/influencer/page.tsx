// frontend/src/app/dashboard/influencer/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase_client";

interface Influencer {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  location: any;
  social_media: any;
  categories: string[] | null;
  rate_per_post: number | null;
  availability: string | null;
}

interface Campaign {
  id: string;
  title: string;
  business_id: string;
  status: string;
  deliverables: string[] | null;
  payment_status: string | null;
}

export default function InfluencerDashboardPage() {
  const router = useRouter();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const user = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const influencerId = user.data.user?.id;

      // 1) Fetch influencer row
      const res1 = await fetch(`/api/influencer/${influencerId}`);
      const json1 = await res1.json();
      if (!res1.ok) {
        console.error(json1.error);
        setLoading(false);
        return;
      }
      setInfluencer(json1.influencer);

      // 2) Fetch joined campaigns
      const res2 = await fetch(`/api/influencer/${influencerId}/campaigns`);
      const json2 = await res2.json();
      if (!res2.ok) {
        console.error(json2.error);
        setLoading(false);
        return;
      }
      setCampaigns(json2.campaigns);
      setLoading(false);
    }
    fetchData();
  }, [router]);

  if (loading) return <div>Loading…</div>;
  if (!influencer) return <div>Error loading influencer profile.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{influencer.name} (@{influencer.username})</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {influencer.profile_picture_url ? (
              <Image
                src={influencer.profile_picture_url}
                alt={influencer.name}
                width={120}
                height={120}
                className="rounded-full"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full" />
            )}
          </div>
          <div>
            <p>{influencer.bio}</p>
            <p>
              Location:{" "}
              {influencer.location
                ? `${influencer.location.city}, ${influencer.location.state}, ${influencer.location.country}`
                : "N/A"}
            </p>
            <p>Rate per post: ₹{influencer.rate_per_post || "N/A"}</p>
            <p>Availability: {influencer.availability || "N/A"}</p>
          </div>
        </CardContent>
        <div className="p-4 space-y-2">
          <div>
            <h4 className="font-medium">Categories:</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {influencer.categories?.map((cat) => (
                <Badge key={cat}>{cat}</Badge>
              )) || <span>N/A</span>}
            </div>
          </div>
          <div>
            <h4 className="font-medium">Social Media:</h4>
            <ul className="mt-1 space-y-1">
              {influencer.social_media?.instagram?.handle && (
                <li>
                  Instagram: {influencer.social_media.instagram.handle} (
                  {influencer.social_media.instagram.followers?.toLocaleString() ||
                    "N/A"} followers,{" "}
                  {influencer.social_media.instagram.engagement_rate || "N/A"}
                  %)
                </li>
              )}
              {influencer.social_media?.youtube?.handle && (
                <li>
                  YouTube: {influencer.social_media.youtube.handle} (
                  {influencer.social_media.youtube.subscribers?.toLocaleString() ||
                    "N/A"} subscribers, avg views 
                  {influencer.social_media.youtube.avg_views || "N/A"})
                </li>
              )}
              {influencer.social_media?.tiktok?.handle && (
                <li>
                  TikTok: {influencer.social_media.tiktok.handle} (
                  {influencer.social_media.tiktok.followers?.toLocaleString() ||
                    "N/A"} followers,{" "}
                  {influencer.social_media.tiktok.engagement_rate || "N/A"}%)
                </li>
              )}
            </ul>
          </div>
          <Button onClick={() => alert("Edit Profile not yet implemented")}>
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* My Campaigns */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Campaigns</h2>
        {campaigns.length === 0 ? (
          <p>You have not been invited to any campaigns yet.</p>
        ) : (
          <ul className="space-y-4">
            {campaigns.map((camp) => (
              <Card key={camp.id}>
                <CardHeader>
                  <CardTitle>{camp.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>Status: {camp.status}</div>
                  <div>Payment: {camp.payment_status || "Pending"}</div>
                </CardContent>
                <div className="p-4">
                  <Button
                    variant="link"
                    onClick={() => router.push(`/campaigns/${camp.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
