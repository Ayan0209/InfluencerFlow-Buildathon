"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Placeholder for Supabase client and user
type Business = typeof mockBusiness;
type Campaign = typeof mockCampaigns[number];

const supabase = {
  from: (_table: string) => ({
    select: (_sel: string) => ({
      eq: (_col: string, _val: any) => ({
        single: async () => ({ data: mockBusiness }),
      }),
    }),
  }),
};
const user = { id: 1 };

const mockBusiness = {
  id: 1,
  name: "Acme Corp",
  description: "We connect brands with top influencers.",
  website_url: "https://acme.com",
  industry: "Tech",
  location: { city: "San Francisco", state: "CA", country: "USA" },
  social_links: {
    instagram: "https://instagram.com/acme",
    facebook: "https://facebook.com/acme",
    twitter: "https://twitter.com/acme",
  },
  email: "contact@acme.com",
  phone: "+1 555-1234",
};

const mockCampaigns = [
  {
    id: 1,
    title: "Spring Launch",
    status: "Active",
    budget: 50000,
    proposed_dates: "2024-05-01 to 2024-06-01",
  },
  {
    id: 2,
    title: "Summer Promo",
    status: "Completed",
    budget: 30000,
    proposed_dates: "2023-07-01 to 2023-08-01",
  },
];

function SocialIcon({ type, url }: { type: "instagram" | "facebook" | "twitter"; url: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: <span role="img" aria-label="Instagram">📸</span>,
    facebook: <span role="img" aria-label="Facebook">📘</span>,
    twitter: <span role="img" aria-label="Twitter">🐦</span>,
  };
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-2xl mr-3 hover:opacity-80">
      {icons[type]}
    </a>
  );
}

export default function BusinessDashboard() {
  const [business, setBusiness] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Replace with real Supabase calls
      const { data: business } = await supabase.from("business").select("*").eq("id", user.id).single();
      // const { data: campaigns } = await supabase.from("campaign").select("*").eq("business_id", user.id);
      setBusiness(business);
      setCampaigns(mockCampaigns); // Replace with real campaigns
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!business) return <div className="p-8">Business not found.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-8">
      {/* Left Panel: Profile Overview */}
      <div className="lg:w-1/3 w-full">
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-2xl font-bold mb-2">{business.name}</h2>
          <p className="mb-2 text-muted-foreground">{business.description}</p>
          <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block mb-2">
            {business.website_url}
          </a>
          <div className="mb-2">
            <span className="font-semibold">Industry:</span> {business.industry}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Location:</span> {business.location.city}, {business.location.state}, {business.location.country}
          </div>
          <div className="flex items-center mb-2">
            {business.social_links.instagram && <SocialIcon type="instagram" url={business.social_links.instagram} />}
            {business.social_links.facebook && <SocialIcon type="facebook" url={business.social_links.facebook} />}
            {business.social_links.twitter && <SocialIcon type="twitter" url={business.social_links.twitter} />}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Email:</span> {business.email}
          </div>
          <div className="mb-4">
            <span className="font-semibold">Phone:</span> {business.phone}
          </div>
          <Button onClick={() => alert("Edit Profile not implemented")}>Edit Profile</Button>
        </div>
      </div>
      {/* Right Panel: Past Campaigns Table */}
      <div className="flex-1 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Past Campaigns</h3>
          <Link href="/campaign/create">
            <Button>Create New Campaign</Button>
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">You have no campaigns yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg bg-card">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Budget (₹)</th>
                  <th className="px-4 py-2 text-left">Date Range</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2">{c.title}</td>
                    <td className="px-4 py-2">{c.status}</td>
                    <td className="px-4 py-2">₹{c.budget.toLocaleString()}</td>
                    <td className="px-4 py-2">{c.proposed_dates}</td>
                    <td className="px-4 py-2">
                      <Link href={`/campaigns/${c.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 