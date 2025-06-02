// frontend/src/app/dashboard/business/campaigns/[campaignId]/negotiation/[influencerId]/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

// ————— Types —————
interface NegotiationMessage {
  id: string;
  campaign_id: string;
  influencer_id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

interface NegotiationResponse {
  // The GET endpoint returns an array of negotiation rows
  messages: NegotiationMessage[];
}

interface CampaignSummary {
  id: string;
  title: string;
  budget: number;
  deliverables: string[];
  proposed_dates: { start_date: string; end_date: string };
}

// ————— Fetchers / Mutations —————

async function fetchNegotiations(
  campaignId: string,
  influencerId: string
): Promise<NegotiationResponse> {
  const res = await fetch(
    `/api/campaign/${campaignId}/negotiation/${influencerId}`
  );
  if (!res.ok) throw new Error("Failed to fetch negotiations");
  return { messages: await res.json() };
}

async function sendNegotiationMessage({
  campaignId,
  influencerId,
  senderType,
  message,
}: {
  campaignId: string;
  influencerId: string;
  senderType: string;
  message: string;
}) {
  const res = await fetch(
    `/api/campaign/${campaignId}/negotiation/${influencerId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_type: senderType, message }),
    }
  );
  if (!res.ok) throw new Error("Failed to send message");
  return await res.json();
}

async function fetchCampaignSummary(
  campaignId: string
): Promise<CampaignSummary> {
  const res = await fetch(`/api/campaign/${campaignId}`);
  if (!res.ok) throw new Error("Failed to fetch campaign");
  const json = await res.json();
  return json.campaign as CampaignSummary;
}

async function finalizeTerms({
  campaignId,
  influencerId,
  agreedRate,
  finalDeliverableDetails,
}: {
  campaignId: string;
  influencerId: string;
  agreedRate: number;
  finalDeliverableDetails: string;
}) {
  const res = await fetch(
    `/api/campaign/${campaignId}/influencers/${influencerId}/finalize`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agreed_rate_per_post: agreedRate,
        final_deliverable_details: finalDeliverableDetails,
      }),
    }
  );
  if (!res.ok) throw new Error("Failed to finalize terms");
  return await res.json();
}

// ————— Component —————

export default function NegotiationChatPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const influencerId = params.influencerId as string;
  const queryClient = useQueryClient();
  const router = useRouter();

  // Typing state for chat
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  // Typing state for “Finalize Terms” form
  const [agreedRate, setAgreedRate] = useState<number | "">("");
  const [finalDeliverableDetails, setFinalDeliverableDetails] = useState("");

  // TODO: Replace with actual user type logic (e.g. from auth context)
  const senderType = "business";

  // 1) Fetch negotiation messages
  const {
    data: negotiationData,
    isLoading: negotiationLoading,
    error: negotiationError,
  } = useQuery<NegotiationResponse>({
    queryKey: ["negotiation", campaignId, influencerId],
    queryFn: () => fetchNegotiations(campaignId, influencerId),
  });

  // 2) Mutation: send negotiation message
  const chatMutation = useMutation({
    mutationFn: ({ message }: { message: string }) =>
      sendNegotiationMessage({ campaignId, influencerId, senderType, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["negotiation", campaignId, influencerId],
      });
      setChatInput("");
    },
  });

  // 3) Fetch campaign summary (title, budget, etc.)
  const {
    data: campaignSummary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery<CampaignSummary>({
    queryKey: ["campaignSummary", campaignId],
    queryFn: () => fetchCampaignSummary(campaignId),
  });

  // 4) Mutation: finalize terms
  const finalizeMutation = useMutation({
    mutationFn: ({
      agreedRate,
      finalDeliverableDetails,
    }: {
      agreedRate: number;
      finalDeliverableDetails: string;
    }) =>
      finalizeTerms({ campaignId, influencerId, agreedRate, finalDeliverableDetails }),
    onSuccess: () => {
      // Invalidate both the join‐row (so "Ready to Sign Contract" status shows up elsewhere)
      // and the negotiation fetch (if you want to show a badge or so).
      queryClient.invalidateQueries({
        queryKey: ["negotiation", campaignId, influencerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["campaignSummary", campaignId],
      });
    },
  });

  // 5) Auto‑scroll chat to bottom whenever new data arrives
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [negotiationData]);

  // 6) Loading & error states
  if (negotiationLoading || summaryLoading) {
    return <div className="p-8 text-center">Loading…</div>;
  }
  if (negotiationError || summaryError) {
    return <div className="p-8 text-center text-red-600">Error loading data</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ——— Left Column: Campaign Summary & Finalize Terms Form ——— */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Summary</CardTitle>
          </CardHeader>
          <Button
            variant="secondary"
            onClick={() => router.push(`/campaign/${campaignId}`)}
          >
            Back to Campaign
          </Button>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">{campaignSummary?.title}</h3>
              <p className="text-sm text-gray-600">
                Budget: ₹{campaignSummary?.budget.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Dates:{" "}
                {campaignSummary?.proposed_dates.start_date} –{" "}
                {campaignSummary?.proposed_dates.end_date}
              </p>
              <div className="mt-2">
                <span className="font-medium">Deliverables:</span>
                <ul className="list-disc pl-5">
                  {campaignSummary?.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <hr />

            <div className="space-y-2">
              <h3 className="font-semibold">Finalize Terms</h3>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Agreed Rate (per post, ₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={agreedRate}
                  onChange={(e) => setAgreedRate(Number(e.target.value))}
                  placeholder="e.g. 4500"
                  disabled={finalizeMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Final Deliverable Details
                </label>
                <Input
                  type="text"
                  value={finalDeliverableDetails}
                  onChange={(e) => setFinalDeliverableDetails(e.target.value)}
                  placeholder="e.g. Instagram Reel + 3 Stories"
                  disabled={finalizeMutation.isPending}
                />
              </div>
              <Button
                className="mt-2"
                onClick={() =>
                  finalizeMutation.mutate({ agreedRate: Number(agreedRate), finalDeliverableDetails })
                }
                disabled={
                  finalizeMutation.isPending ||
                  agreedRate === "" ||
                  finalDeliverableDetails.trim().length === 0
                }
              >
                {finalizeMutation.isPending
                  ? "Finalizing…"
                  : "Finalize & Send to Contract"}
              </Button>

              {finalizeMutation.isSuccess && (
                <Badge className="bg-green-100 text-green-800 mt-2">
                  Ready to Sign Contract
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ——— Right Column: Chat Feed ——— */}
        <Card className="flex flex-col h-[550px]">
          <CardHeader>
            <CardTitle>Negotiation Chat</CardTitle>
          </CardHeader>
          <CardContent
            className="flex-1 flex flex-col p-4 overflow-y-auto space-y-2"
            ref={chatRef}
          >
            {negotiationData?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender_type === "business" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-xs shadow text-sm ${
                    msg.sender_type === "business"
                      ? "bg-blue-50 text-black"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {msg.sender_type === "business" ? "Business" : "Influencer"}
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>{msg.message}</div>
                </div>
              </div>
            ))}
          </CardContent>
          <form
            className="flex gap-2 p-4 border-t"
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                chatMutation.mutate({ message: chatInput });
              }
            }}
          >
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message…"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!chatInput.trim() || chatMutation.isPending}
            >
              {chatMutation.isPending ? "Sending…" : "Send"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
