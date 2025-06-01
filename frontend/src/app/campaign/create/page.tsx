// frontend/src/app/campaign/create/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase_client";

export default function CampaignCreatePage() {
  const router = useRouter();

  // STEP 0: fetch the current user’s ID on the client
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        setUserId(user.id);
      } else {
        // If no user is signed in, you may want to redirect to login
        router.push("/login");
      }
    }
    fetchUser();
  }, [router]);

  // STEP 1: form state and step state
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    campaign_type: "",
    categories: [] as string[],
    platform_targets: [] as string[],
    deliverables: [] as string[],
    budget: "",
    start_date: "",
    end_date: "",
    status: "Open",
    selectedInfluencers: [] as { id: string; name: string }[],
  });

  const [availableInfluencers, setAvailableInfluencers] = useState<
    { id: string; name: string }[]
  >([]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleArrayField(
    key: "categories" | "platform_targets" | "deliverables",
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

  // STEP 2: fetch influencers once when component mounts
  useEffect(() => {
    async function getInfluencers() {
      const res = await fetch("/api/influencers-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      setAvailableInfluencers(
        (json.influencers as any[]).map((inf) => ({
          id: inf.id,
          name: inf.name,
        }))
      );
    }
    getInfluencers();
  }, []);

  function toggleSelectedInfluencer(inf: { id: string; name: string }) {
    setForm((prev) => {
      const exists = prev.selectedInfluencers.find((i) => i.id === inf.id);
      const next = exists
        ? prev.selectedInfluencers.filter((i) => i.id !== inf.id)
        : [...prev.selectedInfluencers, inf];
      return { ...prev, selectedInfluencers: next };
    });
  }

  async function handleSubmit() {
    // Prevent submission until we have a userId
    if (!userId) {
      alert("You must be logged in to create a campaign.");
      return;
    }

    // Build payload
    const payload = {
      business_id: userId,
      title: form.title,
      description: form.description,
      campaign_type: form.campaign_type,
      categories: form.categories,
      platform_targets: form.platform_targets,
      deliverables: form.deliverables,
      budget: parseFloat(form.budget),
      proposed_dates: {
        start_date: form.start_date,
        end_date: form.end_date,
      },
      status: form.status,
      influencer_ids: form.selectedInfluencers.map((i) => i.id),
    };

    const res = await fetch("/api/campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      alert("Error creating campaign: " + (json.error ?? "Unknown error"));
      return;
    }
    router.push(`/campaigns/${json.campaign.id}`);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Create New Campaign</h1>

      {/* Step Indicators */}
      <div className="flex justify-between mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 text-center py-2 border-b-2 ${
              step === i ? "border-blue-600 font-bold" : "border-gray-300"
            }`}
          >
            Step {i}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
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
                <SelectItem value="Sponsored Post">
                  Sponsored Post
                </SelectItem>
                <SelectItem value="Giveaway">Giveaway</SelectItem>
                <SelectItem value="Brand Ambassador">
                  Brand Ambassador
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Fashion", "Tech", "Fitness", "Travel"].map((cat) => (
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
              {["Instagram", "YouTube", "TikTok"].map((plat) => (
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
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 2: Deliverables & Dates */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Deliverables</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                "Instagram Post",
                "Reel",
                "YouTube Video",
                "TikTok Video",
              ].map((d) => (
                <label key={d} className="flex items-center space-x-1">
                  <Checkbox
                    checked={form.deliverables.includes(d)}
                    onCheckedChange={() => toggleArrayField("deliverables", d)}
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input
              name="budget"
              type="number"
              id="budget"
              value={form.budget}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                name="start_date"
                type="date"
                id="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                name="end_date"
                type="date"
                id="end_date"
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
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between">
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 3: Invite Influencers */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium mb-2">Select Influencers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
            {availableInfluencers.map((inf) => (
              <div
                key={inf.id}
                className={`p-3 rounded border cursor-pointer ${
                  form.selectedInfluencers.find((i) => i.id === inf.id)
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white"
                }`}
                onClick={() => toggleSelectedInfluencer(inf)}
              >
                {inf.name}
              </div>
            ))}
          </div>
          {form.selectedInfluencers.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">Selected</h3>
              <ul className="list-disc list-inside">
                {form.selectedInfluencers.map((i) => (
                  <li key={i.id}>{i.name}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-between">
            <Button onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => setStep(4)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium mb-4">Review & Submit</h2>
          <div className="space-y-2">
            <p>
              <strong>Title:</strong> {form.title}
            </p>
            <p>
              <strong>Description:</strong> {form.description}
            </p>
            <p>
              <strong>Type:</strong> {form.campaign_type}
            </p>
            <p>
              <strong>Categories:</strong>{" "}
              {form.categories.length ? form.categories.join(", ") : "None"}
            </p>
            <p>
              <strong>Platforms:</strong>{" "}
              {form.platform_targets.length
                ? form.platform_targets.join(", ")
                : "None"}
            </p>
            <p>
              <strong>Deliverables:</strong>{" "}
              {form.deliverables.length
                ? form.deliverables.join(", ")
                : "None"}
            </p>
            <p>
              <strong>Budget:</strong> ₹{form.budget}
            </p>
            <p>
              <strong>Date Range:</strong> {form.start_date} – {form.end_date}
            </p>
            <p>
              <strong>Invited Influencers:</strong>{" "}
              {form.selectedInfluencers.length
                ? form.selectedInfluencers.map((i) => i.name).join(", ")
                : "None"}
            </p>
          </div>
          <div className="flex justify-between">
            <Button onClick={() => setStep(3)}>Back</Button>
            <Button onClick={handleSubmit}>Create Campaign</Button>
          </div>
        </div>
      )}
    </div>
  );
}
