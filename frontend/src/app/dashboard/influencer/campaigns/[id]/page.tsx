// frontend/src/app/dashboard/influencer/campaigns/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase_client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PDFContractViewer from "@/components/PDFContractViewer";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: string;
  title: string;
  business_id: string;
  deliverables: string[];
  proposed_dates: { start_date: string; end_date: string };
}

interface JoinRow {
  status: "Pending" | "Accepted" | "Completed" | "Rejected";
  deliverables_submitted: Record<string, string>; // { [deliverable_type]: submission_url }
}

interface Business {
  id: string;
  name: string;
}

interface PaymentStatus {
  paid: boolean;
}

interface Performance {
  views: number;
  likes: number;
}

const queryClient = new QueryClient();

export default function InfluencerCampaignPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <InfluencerCampaignPage />
    </QueryClientProvider>
  );
}

function InfluencerCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;
  const [influencerId, setInfluencerId] = useState<string | null>(null);

  // 1) Get influencerId from Supabase auth on mount
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error || !data.user) {
          router.push("/login");
        } else {
          setInfluencerId(data.user.id);
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  // 2) Fetch campaign details
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useQuery<Campaign>({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaign/${campaignId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch campaign");
      }
      const json = await res.json();
      return json.campaign as Campaign;
    },
    enabled: Boolean(campaignId),
  });

  // 3) Fetch join row for this influencer
  const {
    data: joinRow,
    isLoading: joinLoading,
    error: joinError,
  } = useQuery<JoinRow>({
    queryKey: ["joinRow", campaignId, influencerId],
    queryFn: async () => {
      const res = await fetch(
        `/api/campaign/${campaignId}/influencers/${influencerId}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch join data");
      }
      const json = await res.json();
      return json.join as JoinRow;
    },
    enabled: Boolean(campaignId && influencerId),
  });

  // 4) Fetch business name
  const {
    data: business,
    isLoading: businessLoading,
    error: businessError,
  } = useQuery<Business>({
    queryKey: ["business", campaign?.business_id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${campaign?.business_id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch business");
      }
      const json = await res.json();
      return json.business as Business;
    },
    enabled: Boolean(campaign?.business_id),
  });

  // 5) Fetch payment status
  const {
    data: paymentStatus,
    isLoading: payLoading,
    error: payError,
  } = useQuery<PaymentStatus>({
    queryKey: ["paymentStatus", influencerId, campaignId],
    queryFn: async () => {
      const res = await fetch(
        `/api/influencer/${influencerId}/campaign/${campaignId}/payment-status`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch payment status");
      }
      const json = await res.json();
      return json as PaymentStatus;
    },
    enabled: Boolean(influencerId && campaignId),
  });

  // 6) Fetch performance (extract json.performance)
  const {
    data: performance,
    isLoading: perfLoading,
    error: perfError,
  } = useQuery<Performance>({
    queryKey: ["performance", influencerId, campaignId],
    queryFn: async () => {
      const res = await fetch(
        `/api/campaign/${campaignId}/influencers/${influencerId}/performance`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch performance");
      }
      const json = await res.json();
      // json looks like { performance: { views: 123, likes: 45 } }
      return json.performance as Performance;
    },
    enabled: Boolean(influencerId && campaignId),
  });

  // 7) Local state for deliverable submissions
  const [submissions, setSubmissions] = useState<Record<string, string>>({});

  // 8) When joinRow loads, populate submissions with existing URLs
  useEffect(() => {
    if (joinRow?.deliverables_submitted) {
      setSubmissions({ ...joinRow.deliverables_submitted });
    }
  }, [joinRow]);

  // 9) Mutation to submit a single deliverable
  const deliverableMutation = useMutation({
    mutationFn: async ({
      deliverable_type,
      url,
    }: {
      deliverable_type: string;
      url: string;
    }) => {
      const res = await fetch("/api/deliverable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          influencer_id: influencerId,
          deliverable_type,
          submission_url: url,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to submit deliverable");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["joinRow", campaignId, influencerId],
      });
    },
  });

  // 10) Mutation to mark as complete
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/influencer/${influencerId}/campaign/${campaignId}/complete`,
        { method: "POST" }
      );
      if (!res.ok) {
        throw new Error("Failed to mark complete");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["joinRow", campaignId, influencerId],
      });
    },
  });

  // 11) Check if all deliverables have been submitted
  const allSubmitted =
    campaign?.deliverables.every(
      (d) => !!submissions[d] && submissions[d].trim().length > 0
    ) ?? false;

  // 12) Loading / Error states
  if (
    campaignLoading ||
    joinLoading ||
    businessLoading ||
    payLoading ||
    perfLoading
  ) {
    return <div>Loading…</div>;
  }
  if (campaignError || joinError || businessError || payError || perfError) {
    return <div>Error loading data</div>;
  }

  // 13) “Due by” – show the end_date of the date range
  const dueBy = campaign?.proposed_dates?.end_date
    ? new Date(campaign.proposed_dates.end_date).toLocaleDateString()
    : "N/A";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{campaign?.title}</h1>
        <p className="text-lg text-muted-foreground">
          Brand: {business?.name}
        </p>
        <p className="text-sm text-gray-500">Due by: {dueBy}</p>
      </header>

      {/* Contract Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <PDFContractViewer
            url={`/api/contract/generate?campaign_id=${campaignId}&creator_id=${influencerId}`}
          />
        </CardContent>
      </Card>

      {/* Deliverable Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Deliverables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign?.deliverables.map((type) => (
            <div key={type} className="space-y-1">
              <label className="font-medium">{type}</label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Paste post URL or upload screenshot"
                  value={submissions[type] || ""}
                  onChange={(e) =>
                    setSubmissions((prev) => ({
                      ...prev,
                      [type]: e.target.value,
                    }))
                  }
                />
                <Button
                  onClick={() =>
                    deliverableMutation.mutate({
                      deliverable_type: type,
                      url: submissions[type] || "",
                    })
                  }
                  disabled={
                    !submissions[type]?.trim().length ||
                    deliverableMutation.isPending
                  }
                >
                  {deliverableMutation.isPending &&
                  deliverableMutation.variables?.deliverable_type === type
                    ? "Submitting…"
                    : "Submit"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentStatus?.paid ? (
            <Badge className="bg-green-100 text-green-800">Paid</Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">
              Awaiting Payment
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Performance Preview */}
      {performance && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              <li>Views: {performance.views.toLocaleString()}</li>
              <li>Likes: {performance.likes.toLocaleString()}</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Mark as Complete Button */}
      {allSubmitted && joinRow?.status !== "Completed" && (
        <div className="text-center">
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? "Marking…" : "Mark as Complete"}
          </Button>
        </div>
      )}
    </div>
  );
}
