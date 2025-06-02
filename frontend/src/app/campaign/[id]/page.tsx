// frontend/src/app/campaign/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

// ShadCN UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// PDF viewer
import PDFContractViewer from "@/components/PDFContractViewer";

// Helper fetchers
async function fetchCampaign(id: string) {
  const res = await fetch(`/api/campaign/${id}`);
  if (!res.ok) throw new Error("Failed to fetch campaign");
  return res.json();
}

async function fetchBusiness(businessId: string) {
  const res = await fetch(`/api/business/${businessId}`);
  if (!res.ok) throw new Error("Failed to fetch business");
  return res.json();
}

async function fetchInvitedInfluencers(campaignId: string) {
  const res = await fetch(`/api/campaign/${campaignId}/influencers`);
  if (!res.ok) throw new Error("Failed to fetch influencers");
  return res.json();
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // State for rendering PDF contract (campaign-wide)
  const [contractBlob, setContractBlob] = useState<Blob | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);

  // 1) Fetch campaign data
  const {
    data: campaignData,
    isLoading: isLoadingCampaign,
    error: campaignError,
  } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
  });

  // 2) Fetch business name once campaign data is available
  const businessId = campaignData?.campaign.business_id || "";
  const {
    data: businessData,
    isLoading: isLoadingBusiness,
    error: businessError,
  } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => fetchBusiness(businessId),
    enabled: !!businessId,
  });

  // 3) Fetch all influencers linked to this campaign
  const {
    data: influencersData,
    isLoading: isLoadingInfluencers,
    error: influencersError,
  } = useQuery({
    queryKey: ["invitedInfluencers", id],
    queryFn: () => fetchInvitedInfluencers(id),
    enabled: !!id,
  });

  // 4) Generate or fetch the campaign‐wide contract PDF
  useEffect(() => {
    if (!id) return;
    async function getContract() {
      try {
        setIsLoadingContract(true);
        const response = await fetch(
          `/api/contract/generate?campaign_id=${id}`
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
  }, [id]);

  if (isLoadingCampaign) {
    return <div className="text-center py-8">Loading campaign details…</div>;
  }
  if (campaignError) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading campaign: {campaignError.message}
      </div>
    );
  }

  const campaign = campaignData.campaign;
  const infls: {
    id: string;
    name: string;
    profile_picture_url?: string;
    invite_status: string;
  }[] = influencersData?.influencers || [];

  // Separate influencers by status
  const signedInfluencers = infls.filter((i) => i.invite_status === "Signed");
  const ongoingInfluencers = infls.filter(
    (i) =>
      i.invite_status === "Ready to Sign Contract" ||
      i.invite_status === "Accepted"
  );
  const invitedInfluencers = infls.filter((i) => i.invite_status === "Pending");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header: Title + Status + Edit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <Badge
            variant={
              campaign.status === "Open"
                ? "default"
                : campaign.status === "Draft"
                ? "secondary"
                : "outline"
            }
          >
            {campaign.status}
          </Badge>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/campaign/${id}/edit`}>Edit Campaign</Link>
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push(`/dashboard/business/campaigns`)}
        >
          Back to All Campaigns
        </Button>
      </div>

      {/* Top Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <p>
                <span className="font-semibold">Description:</span>{" "}
                {campaign.description || "—"}
              </p>
              <p>
                <span className="font-semibold">Type:</span>{" "}
                {campaign.campaign_type || "—"}
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-semibold">Categories:</span>
                {campaign.categories && campaign.categories.length > 0 ? (
                  campaign.categories.map((cat: string) => (
                    <Badge key={cat} variant="outline">
                      {cat}
                    </Badge>
                  ))
                ) : (
                  <span>—</span>
                )}
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-semibold">Platforms:</span>
                {campaign.platform_targets &&
                campaign.platform_targets.length > 0 ? (
                  campaign.platform_targets.map((plat: string) => (
                    <Badge key={plat} variant="outline">
                      {plat}
                    </Badge>
                  ))
                ) : (
                  <span>—</span>
                )}
              </p>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <p>
                <span className="font-semibold">Budget:</span> ₹
                {campaign.budget.toLocaleString()}
              </p>
              <p>
                <span className="font-semibold">Date Range:</span>{" "}
                {campaign.proposed_dates.start_date} –{" "}
                {campaign.proposed_dates.end_date}
              </p>
              <p>
                <span className="font-semibold">Business:</span>{" "}
                {isLoadingBusiness
                  ? "Loading…"
                  : businessError
                  ? "Error"
                  : businessData.business.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={`/creator-search?campaignId=${id}`}>
            Influencer Search
          </Link>
        </Button>
      </div>

      {/* ——— Manage Influencers Section ——— */}
      <div className="space-y-8">
        {/* Signed Influencers */}
        <Card>
          <CardHeader>
            <CardTitle>Signed Influencers</CardTitle>
          </CardHeader>
          <CardContent>
            {signedInfluencers.length === 0 ? (
              <p className="text-gray-600">No signed influencers yet.</p>
            ) : (
              <ul className="space-y-4">
                {signedInfluencers.map((inf) => (
                  <li
                    key={inf.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        {inf.profile_picture_url ? (
                          <AvatarImage src={inf.profile_picture_url} />
                        ) : (
                          <AvatarFallback>{inf.name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold">{inf.name}</p>
                        <p className="text-sm text-gray-600">
                          Status: <Badge variant="default">Signed</Badge>
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/dashboard/business/campaigns/${id}/performance/${inf.id}`
                          )
                        }
                      >
                        View Performance
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/dashboard/business/campaigns/${id}/contract/${inf.id}`
                          )
                        }
                      >
                        View Contract
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          router.push(
                            `/dashboard/business/campaigns/${id}/payment/${inf.id}`
                          )
                        }
                      >
                        Payments
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Ongoing Negotiations */}
        <Card>
          <CardHeader>
            <CardTitle>Ongoing Negotiations</CardTitle>
          </CardHeader>
          <CardContent>
            {ongoingInfluencers.length === 0 ? (
              <p className="text-gray-600">No ongoing negotiations.</p>
            ) : (
              <ul className="space-y-4">
                {ongoingInfluencers.map((inf) => (
                  <li
                    key={inf.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        {inf.profile_picture_url ? (
                          <AvatarImage src={inf.profile_picture_url} />
                        ) : (
                          <AvatarFallback>{inf.name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold">{inf.name}</p>
                        <p className="text-sm text-gray-600">
                          Status:{" "}
                          {inf.invite_status === "Accepted" ? (
                            <Badge variant="secondary">Accepted</Badge>
                          ) : (
                            <Badge variant="outline">Ready to Sign</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/dashboard/business/campaigns/${id}/negotiation/${inf.id}`
                          )
                        }
                      >
                        View Negotiations
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/dashboard/business/campaigns/${id}/contract/${inf.id}`
                          )
                        }
                      >
                        Draft Contract
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Invited Influencers */}
        <Card>
          <CardHeader>
            <CardTitle>Invited Influencers</CardTitle>
          </CardHeader>
          <CardContent>
            {invitedInfluencers.length === 0 ? (
              <p className="text-gray-600">No invited influencers.</p>
            ) : (
              <ul className="space-y-4">
                {invitedInfluencers.map((inf) => (
                  <li
                    key={inf.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        {inf.profile_picture_url ? (
                          <AvatarImage src={inf.profile_picture_url} />
                        ) : (
                          <AvatarFallback>{inf.name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold">{inf.name}</p>
                        <p className="text-sm text-gray-600">
                          Status: <Badge variant="outline">Pending</Badge>
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const resp = await fetch("/api/outreach/send", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            campaign_id: id,
                            creator_id: inf.id,
                            brief: `Reminder: Please respond to your invitation for "${campaign.title}".`,
                          }),
                        });
                        if (!resp.ok) {
                          alert("Failed to send reminder.");
                        } else {
                          alert("Reminder sent!");
                        }
                      }}
                    >
                      Send Reminder
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
