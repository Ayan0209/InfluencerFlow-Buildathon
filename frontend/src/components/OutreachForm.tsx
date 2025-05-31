"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";


export default function OutreachForm() {
  const [campaignId, setCampaignId] = useState(1);
  const [creatorId, setCreatorId] = useState(1);
  const [brief, setBrief] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: { campaign_id: number; creator_id: number; brief: string }) => {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send outreach");
      return res.json();
    },
  });

  return (
    <form
      className="space-y-4 max-w-md mx-auto"
      onSubmit={e => {
        e.preventDefault();
        mutation.mutate({ campaign_id: campaignId, creator_id: creatorId, brief });
      }}
    >
      <div>
        <Label htmlFor="campaignId">Campaign ID</Label>
        <Input
          id="campaignId"
          type="number"
          value={campaignId}
          onChange={e => setCampaignId(Number(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="creatorId">Creator ID</Label>
        <Input
          id="creatorId"
          type="number"
          value={creatorId}
          onChange={e => setCreatorId(Number(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="brief">Brief</Label>
        <Textarea
          id="brief"
          value={brief}
          onChange={e => setBrief(e.target.value)}
          rows={4}
        />
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Sending..." : "Send Outreach Email"}
      </Button>
      {mutation.data && (
        <div className="mt-6 p-4 border rounded bg-muted">
          <div>
            <Label>Subject</Label>
            <Input value={mutation.data.subject} readOnly className="mb-2" />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={mutation.data.body} readOnly rows={6} />
          </div>
        </div>
      )}
      {mutation.error && <div className="text-red-500">{mutation.error.message}</div>}
    </form>
  );
} 