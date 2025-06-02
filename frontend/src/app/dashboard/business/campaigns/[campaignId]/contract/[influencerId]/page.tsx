// frontend/src/app/dashboard/business/campaigns/[campaignId]/contract/[influencerId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PDFContractViewer from "@/components/PDFContractViewer";
import { Input } from "@/components/ui/input";

// ————— Types —————
interface FinalizedTerms {
  agreed_rate_per_post: number;
  final_deliverable_details: string;
}

interface CampaignInfo {
  id: string;
  title: string;
  business_id: string;
  // other fields as needed…
}

interface InfluencerInfo {
  id: string;
  name: string;
  profile_picture_url?: string;
}

// ————— API Fetchers —————

async function fetchFinalizedTerms(
  campaignId: string,
  influencerId: string
): Promise<FinalizedTerms> {
  const res = await fetch(
    `/api/campaign/${campaignId}/influencers/${influencerId}/terms`
  );
  if (!res.ok) throw new Error("Failed to fetch finalized terms");
  return res.json();
}

async function fetchCampaignInfo(campaignId: string): Promise<CampaignInfo> {
  const res = await fetch(`/api/campaign/${campaignId}`);
  if (!res.ok) throw new Error("Failed to fetch campaign info");
  const json = await res.json();
  return json.campaign;
}

async function fetchInfluencerInfo(influencerId: string): Promise<InfluencerInfo> {
  const res = await fetch(`/api/influencer/${influencerId}`);
  if (!res.ok) throw new Error("Failed to fetch influencer info");
  const json = await res.json();
  return json.influencer;
}

async function signContract({
  campaignId,
  influencerId,
}: {
  campaignId: string;
  influencerId: string;
}) {
  const res = await fetch(
    `/api/campaign/${campaignId}/influencers/${influencerId}/sign`,
    {
      method: "POST",
    }
  );
  if (!res.ok) throw new Error("Failed to sign contract");
  return res.json();
}

// ————— Component —————

export default function DraftContractPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;
  const influencerId = params.influencerId as string;
  const queryClient = useQueryClient();

  // State for PDF blob
  const [contractBlob, setContractBlob] = useState<Blob | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);

  // 1) Fetch campaign info (for title, etc.)
  const {
    data: campaignInfo,
    isLoading: campaignLoading,
    error: campaignError,
  } = useQuery<CampaignInfo>({
    queryKey: ["campaignInfo", campaignId],
    queryFn: () => fetchCampaignInfo(campaignId),
    enabled: !!campaignId,
  });

  // 2) Fetch influencer info (for name/avatar)
  const {
    data: influencerInfo,
    isLoading: inflLoading,
    error: inflError,
  } = useQuery<InfluencerInfo>({
    queryKey: ["influencerInfo", influencerId],
    queryFn: () => fetchInfluencerInfo(influencerId),
    enabled: !!influencerId,
  });

  // 3) Fetch finalized terms (rate + deliverables text)
  const {
    data: finalizedTerms,
    isLoading: termsLoading,
    error: termsError,
  } = useQuery<FinalizedTerms>({
    queryKey: ["finalizedTerms", campaignId, influencerId],
    queryFn: () => fetchFinalizedTerms(campaignId, influencerId),
    enabled: !!campaignId && !!influencerId,
  });

  // 4) Once we know campaignId & influencerId, fetch the draft contract PDF
  useEffect(() => {
    if (!campaignId || !influencerId) return;

    async function getContract() {
      try {
        setIsLoadingContract(true);
        // We include both IDs so the backend can merge the finalized terms
        const response = await fetch(
          `/api/contract/generate?campaign_id=${campaignId}&influencer_id=${influencerId}`
        );
        if (!response.ok) {
          console.error("Failed to generate contract");
          setIsLoadingContract(false);
          return;
        }
        const blob = await response.blob();
        setContractBlob(blob);
      } catch (e) {
        console.error("Error generating contract:", e);
      } finally {
        setIsLoadingContract(false);
      }
    }

    getContract();
  }, [campaignId, influencerId]);

  // 5) Mutation to “sign” the contract (updates status → "Signed")
  const signMutation = useMutation({
    mutationFn: () => signContract({ campaignId, influencerId }),
    onSuccess: () => {
      // Invalidate any lists so that the Business sees the influencer under “Signed”
      queryClient.invalidateQueries({
        queryKey: ["invitedInfluencers", campaignId],
      });
      router.push(`/campaign/${campaignId}`); // go back to campaign page
    },
  });

  // 6) Loading & error handling
  if (campaignLoading || inflLoading || termsLoading) {
    return <div className="p-8 text-center">Loading…</div>;
  }
  if (campaignError || inflError || termsError) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading data.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header: Campaign + Influencer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Draft Contract: {campaignInfo?.title} &ndash;{" "}
            {influencerInfo?.name}
          </h1>
          <p className="text-sm text-gray-600">
            Agreed Rate: ₹{finalizedTerms?.agreed_rate_per_post.toLocaleString()}
            <br />
            Deliverables: {finalizedTerms?.final_deliverable_details}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push(`/campaign/${campaignId}`)}
        >
          Back to Campaign
        </Button>
      </div>

      {/* Contract Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Contract</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {isLoadingContract ? (
            <div className="text-center py-8">Loading contract…</div>
          ) : contractBlob ? (
            <PDFContractViewer blob={contractBlob} />
          ) : (
            <p className="text-gray-600">
              Contract preview unavailable.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="text-center">
        <Button
          onClick={() => signMutation.mutate()}
          disabled={signMutation.isPending}
        >
          {signMutation.isPending ? "Signing…" : "Sign & Finalize Contract"}
        </Button>
      </div>

      {signMutation.isError && (
        <p className="text-center text-red-600">
          Failed to sign contract. Please try again.
        </p>
      )}
    </div>
  );
}
