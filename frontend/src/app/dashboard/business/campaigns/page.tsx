"use client";
import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase_client";

// If you have a ShadCN Alert component, import it here:
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

function parsePostgresRange(range: string): { startDate: string; endDate: string } {
  // Example: "[2025-06-01,2025-06-30]"
  const match = range.match(/\[(.*?),(.*?)\]/);
  if (!match) return { startDate: "", endDate: "" };
  return { startDate: match[1], endDate: match[2] };
}

// API response interface
interface ApiCampaign {
  id: string;
  title: string;
  status: string;
  proposed_dates: string;
  budget: number;
  invited_count: number;
  accepted_count: number;
}

// UI interface
interface Campaign {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  invitedCount: number;
  acceptedCount: number;
}

function useBusinessId() {
  const router = useRouter();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user && isMounted) {
        router.replace("/login");
      } else if (user && isMounted) {
        setBusinessId(user.id);
      }
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [router]);

  return { businessId, loading };
}

function fetchCampaigns(businessId: string): Promise<Campaign[]> {
  return fetch(`/api/business/${businessId}/campaigns`)
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    })
    .then((data: { campaigns: ApiCampaign[] }) => {
      return data.campaigns.map((c) => {
        const { startDate, endDate } = parsePostgresRange(c.proposed_dates);
        return {
          id: c.id,
          title: c.title,
          status: c.status,
          startDate,
          endDate,
          budget: c.budget,
          invitedCount: c.invited_count,
          acceptedCount: c.accepted_count,
        };
      });
    });
}

export default function BusinessCampaignsPage() {
  const router = useRouter();
  const { businessId, loading: authLoading } = useBusinessId();

  const {
    data: campaigns,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["business-campaigns", businessId],
    queryFn: () => fetchCampaigns(businessId!),
    enabled: !!businessId,
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Business Campaigns</h1>
        <Button asChild>
          <Link href="/campaign/create">Create New Campaign</Link>
        </Button>
      </div>
      {/* Error Alert (replace with ShadCN Alert if available) */}
      {error && (
        <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start → End</TableHead>
              <TableHead>₹ Budget</TableHead>
              <TableHead># Invited</TableHead>
              <TableHead># Accepted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authLoading || isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading…</TableCell>
              </TableRow>
            ) : campaigns && campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        campaign.status === "active"
                          ? "default"
                          : campaign.status === "draft"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.startDate} → {campaign.endDate}
                  </TableCell>
                  <TableCell>₹{campaign.budget.toLocaleString()}</TableCell>
                  <TableCell>{campaign.invitedCount}</TableCell>
                  <TableCell>{campaign.acceptedCount}</TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/campaign/${campaign.id}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/campaign/${campaign.id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">No campaigns found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
