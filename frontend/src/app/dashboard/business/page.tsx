// frontend/src/app/dashboard/business/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase_client";

interface Business {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  industry: string | null;
  social_links: any;
  location: any;
  email: string;
  phone: string | null;
}

interface Campaign {
  id: string;
  title: string;
  status: string;
  budget: number;
  proposed_dates: { start_date: string; end_date: string };
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1) Get the currently logged in user (we need their UID)
      const user = await supabase.auth.getUser();
      if (!user) {
        router.push("/login"); // if not logged in, redirect
        return;
      }
      const businessId = user.data.user?.id;

      // 2) Fetch business profile
      const res1 = await fetch(`/api/business/${businessId}`);
      const json1 = await res1.json();
      if (!res1.ok) {
        console.error(json1.error);
        setLoading(false);
        return;
      }
      setBusiness(json1.business);

      // 3) Fetch that business’s campaigns
      const res2 = await fetch(`/api/business/${businessId}/campaigns`);
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
  if (!business) return <div>Error loading profile.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{business.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>{business.description}</p>
            {business.website_url && (
              <p>
                <a
                  href={business.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {business.website_url}
                </a>
              </p>
            )}
            <p>Industry: {business.industry || "N/A"}</p>
            <p>
              Location:{" "}
              {business.location
                ? `${business.location.city}, ${business.location.state}, ${business.location.country}`
                : "N/A"}
            </p>
            <p>Email: {business.email}</p>
            <p>Phone: {business.phone || "N/A"}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Social Links</h4>
            {business.social_links?.instagram && (
              <p>
                <a
                  href={business.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Instagram
                </a>
              </p>
            )}
            {business.social_links?.facebook && (
              <p>
                <a
                  href={business.social_links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Facebook
                </a>
              </p>
            )}
            {business.social_links?.twitter && (
              <p>
                <a
                  href={business.social_links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Twitter
                </a>
              </p>
            )}
          </div>
        </CardContent>
        <div className="p-4">
          <Button onClick={() => alert("Edit Profile not implemented")}>
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Past Campaigns */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Past Campaigns</h2>
        <Button onClick={() => router.push("/campaign/create")}>
          Create New Campaign
        </Button>
      </div>
      {campaigns.length === 0 ? (
        <p>You have no campaigns yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Budget (₹)</TableCell>
              <TableCell>Date Range</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((camp) => (
              <TableRow key={camp.id}>
                <TableCell>{camp.title}</TableCell>
                <TableCell>{camp.status}</TableCell>
                <TableCell>{camp.budget}</TableCell>
                <TableCell>
                  {camp.proposed_dates.start_date} – {camp.proposed_dates.end_date}
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    onClick={() => router.push(`/dashboard/business/campaigns`)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
