"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import PDFContractViewer from "@/components/PDFContractViewer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";


export default function ContractPage() {
  const [campaignId, setCampaignId] = useState(1);
  const [creatorId, setCreatorId] = useState(1);
  const [terms, setTerms] = useState<string>(
    JSON.stringify({ deliverables: "1 video, 2 posts", rate: "$1000", timeline: "June 2024", milestone: "content approval" }, null, 2)
  );
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: { campaign_id: number; creator_id: number; terms: any }) => {
      const res = await fetch("/api/contract/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate contract");
      const blob = await res.blob();
      setPdfBlob(blob);
      return blob;
    },
  });

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generate Contract</h1>
      <form
        className="space-y-4"
        onSubmit={e => {
          e.preventDefault();
          let parsedTerms;
          try {
            parsedTerms = JSON.parse(terms);
          } catch {
            alert("Invalid JSON in terms");
            return;
          }
          mutation.mutate({ campaign_id: campaignId, creator_id: creatorId, terms: parsedTerms });
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
          <Label htmlFor="terms">Terms (JSON)</Label>
          <Textarea
            id="terms"
            value={terms}
            onChange={e => setTerms(e.target.value)}
            rows={6}
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Generating..." : "Generate Contract"}
        </Button>
      </form>
      <div className="mt-8 min-h-[600px]">
        {pdfBlob && <PDFContractViewer blob={pdfBlob} />}
        {mutation.error && <div className="text-red-500">{mutation.error.message}</div>}
      </div>
    </div>
  );
} 