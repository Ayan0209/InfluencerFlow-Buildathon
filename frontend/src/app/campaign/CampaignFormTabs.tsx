"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase_client";

interface CampaignFormTabsProps {
  id: string; // "new" or existing campaign ID
}

const categoriesList = ["Fashion", "Tech", "Fitness", "Travel"];
const platformsList = ["Instagram", "YouTube", "TikTok"];
const campaignTypes = ["Sponsored Post", "Giveaway", "Brand Ambassador"];
const statusList = ["Draft", "Open", "Closed"];

export default function CampaignFormTabs({ id }: CampaignFormTabsProps) {
  const router = useRouter();
  const isEdit = id !== "new";

  // ─── STEP 0: Get current user ID ────────────────────────────────────────────
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        setUserId(user.id);
      } else {
        router.push("/login");
      }
    }
    fetchUser();
  }, [router]);

  // ─── STEP 1: Form state ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "",
    description: "",
    campaign_type: "",
    categories: [] as string[],
    platform_targets: [] as string[],
    budget: "",
    start_date: "",
    end_date: "",
    status: "Draft",
    // We’ll leave out influencer_ids and contract_fields entirely for “new”
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("details");
  // We won’t fetch influencers or contract data right now

  // ─── STEP 2: If editing, fetch existing campaign ────────────────────────────
  useEffect(() => {
    if (!isEdit) return;

    setLoading(true);
    fetch(`/api/campaign/${id}`)
      .then((res) => res.json())
      .then((data) => {
        // Deconstruct fields from the backend response:
        setForm((prev) => ({
          ...prev,
          title: data.campaign.title || "",
          description: data.campaign.description || "",
          campaign_type: data.campaign.campaign_type || "",
          categories: data.campaign.categories || [],
          platform_targets: data.campaign.platform_targets || [],
          budget: data.campaign.budget?.toString() || "",
          start_date: data.campaign.proposed_dates?.start_date || "",
          end_date: data.campaign.proposed_dates?.end_date || "",
          status: data.campaign.status || "Draft",
          // we skip influencer_ids  / contract_fields for now
        }));
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // ─── Handlers for form changes ─────────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleArrayField(
    key: "categories" | "platform_targets",
    value: string
  ) {
    setForm((prev) => {
      const arr = prev[key];
      const next = arr.includes(value)
        ? arr.filter((s) => s !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
  }

  // ─── STEP 3: Save or Publish ────────────────────────────────────────────────
  async function handleSave(status: "Draft" | "Open") {
    if (!userId) {
      alert("You must be logged in to save a campaign.");
      return;
    }
    setLoading(true);

    // Build payload exactly matching the backend’s Pydantic model
    const payload: any = {
      business_id: userId,
      title: form.title,
      description: form.description || null,
      campaign_type: form.campaign_type || null,
      categories: form.categories,
      platform_targets: form.platform_targets,
      deliverables: [], // empty array; back‐end can accept [] if optional
      budget: parseFloat(form.budget),
      proposed_dates: {
        start_date: form.start_date,
        end_date: form.end_date,
      },
      status,
      influencer_ids: [], // omit for “new”; empty list is allowed if optional
    };

    // If editing, we call PUT /api/campaign/{id}; otherwise POST /api/campaign
    const endpoint = isEdit ? `/api/campaign/${id}` : "/api/campaign";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      alert("Error saving campaign: " + (json.detail || "Unknown error"));
      setLoading(false);
      return;
    }

    // After creation/edit, redirect to business dashboard’s campaign list
    router.push("/dashboard/business/campaigns");
  }

  // ─── Conditional Tab List ──────────────────────────────────────────────────
  // For “new,” we only show Details + Budget; for edit, show both + Performance
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">
        {isEdit ? "Edit Campaign" : "Create New Campaign"}
      </h1>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="budget">Budget & Schedule</TabsTrigger>
          {isEdit && <TabsTrigger value="performance">Performance</TabsTrigger>}
        </TabsList>

        {/* ─── DETAILS TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="details">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                name="title"
                id="title"
                value={form.title}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                name="description"
                id="description"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Campaign Type</Label>
              <Select
                value={form.campaign_type}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, campaign_type: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {campaignTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {categoriesList.map((cat) => (
                  <label key={cat} className="flex items-center space-x-1">
                    <Checkbox
                      checked={form.categories.includes(cat)}
                      onCheckedChange={() => toggleArrayField("categories", cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {platformsList.map((plat) => (
                  <label key={plat} className="flex items-center space-x-1">
                    <Checkbox
                      checked={form.platform_targets.includes(plat)}
                      onCheckedChange={() =>
                        toggleArrayField("platform_targets", plat)
                      }
                    />
                    <span>{plat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── BUDGET & SCHEDULE TAB ──────────────────────────────────────────── */}
        <TabsContent value="budget">
          <div className="space-y-4">
            <div>
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                name="budget"
                id="budget"
                type="number"
                value={form.budget}
                onChange={handleChange}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  name="start_date"
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  name="end_date"
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusList.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* ─── PERFORMANCE TAB (only in Edit mode) ─────────────────────────────── */}
        {isEdit && (
          <TabsContent value="performance">
            <div className="space-y-4">
              <div className="h-32 bg-gray-100 flex items-center justify-center rounded">
                [Performance Chart Placeholder]
              </div>
              <div className="h-16 bg-gray-100 flex items-center justify-center rounded">
                [Metrics Placeholder]
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ─── ACTION BUTTONS ──────────────────────────────────────────────────── */}
      <div className="flex gap-4 justify-end mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave("Draft")}
          disabled={loading}
        >
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSave("Open")}
          disabled={loading}
        >
          {isEdit ? "Update" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
