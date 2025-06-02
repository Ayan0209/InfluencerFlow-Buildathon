// frontend/src/app/dashboard/business/campaigns/[campaignId]/performance/[influencerId]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface PerformanceData {
  [key: string]: number;
}

interface PerformanceResponse {
  performance: PerformanceData;
}

async function fetchPerformance(
  campaignId: string,
  influencerId: string
): Promise<PerformanceResponse> {
  const res = await fetch(
    `/api/campaign/${campaignId}/influencers/${influencerId}/performance`
  );
  if (!res.ok) throw new Error("Failed to fetch performance");
  return res.json();
}

export default function PerformancePage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.campaignId as string;
  const influencerId = params?.influencerId as string;

  const {
    data: perfData,
    isLoading,
    error,
  } = useQuery<PerformanceResponse>({
    queryKey: ["performance", campaignId, influencerId],
    queryFn: () => fetchPerformance(campaignId, influencerId),
    enabled: Boolean(campaignId && influencerId),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading performance…</div>;
  }
  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading performance.
      </div>
    );
  }

  const performance = perfData?.performance || {};

  // Convert each metric into an array of { name, value }
  const metrics = Object.entries(performance).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Influencer Performance</h1>
        <p className="text-sm text-gray-600">
          Campaign ID: {campaignId} &nbsp;|&nbsp; Influencer ID: {influencerId}
        </p>
        <Button
          variant="secondary"
          onClick={() => router.push(`/campaign/${campaignId}`)}
        >
          Back to Campaign
        </Button>
      </header>

      {/* Metrics Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <p className="text-gray-600">No performance data available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {metrics.map((metric) => (
                <div
                  key={metric.name}
                  className="p-4 bg-gray-50 rounded-lg text-center shadow-sm"
                >
                  <p className="text-sm text-gray-500 capitalize">
                    {metric.name.replace(/_/g, " ")}
                  </p>
                  <p className="text-2xl font-semibold">
                    {metric.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screenshots Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Screenshots</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <p className="text-gray-500 italic">
            Screenshots placeholder (coming soon)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
