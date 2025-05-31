"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const categoriesList = [
  "Fashion",
  "Tech",
  "Fitness",
  "Travel",
  "Beauty",
  "Food",
  "Lifestyle",
  "Gaming",
  "Education",
];
const platforms = ["Instagram", "YouTube", "TikTok"];
const deliverablesList = [
  "Instagram Post",
  "Reel",
  "YouTube Video",
  "TikTok Video",
];

const mockInfluencers = [
  { id: 1, name: "Jane Doe", avatar: "", platform: "Instagram" },
  { id: 2, name: "John Smith", avatar: "", platform: "TikTok" },
];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-6 text-center text-muted-foreground font-medium">
      Step {step} of 4
    </div>
  );
}

export default function CreateCampaignPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    campaign_type: "Sponsored Post",
    categories: [] as string[],
    platform_targets: [] as string[],
    deliverables: [] as string[],
    budget: "",
    start_date: "",
    end_date: "",
    status: "Open",
  });
  const [selectedInfluencers, setSelectedInfluencers] = useState<any[]>([]);
  const [inviteDisabled, setInviteDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({
        ...prev,
        [name]: checked
          ? [...(prev[name as keyof typeof prev] as string[]), value]
          : (prev[name as keyof typeof prev] as string[]).filter((v: string) => v !== value),
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleInvite(influencer: any) {
    if (!selectedInfluencers.some((inf) => inf.id === influencer.id)) {
      setSelectedInfluencers((prev) => [...prev, influencer]);
    }
  }
  function handleRemoveInfluencer(id: number) {
    setSelectedInfluencers((prev) => prev.filter((inf) => inf.id !== id));
  }

  async function handleSubmit() {
    setSubmitting(true);
    // Placeholder for Supabase insert logic
    // eslint-disable-next-line no-console
    console.log("Create campaign:", form, selectedInfluencers);
    setTimeout(() => {
      setSubmitting(false);
      alert("Campaign created successfully.");
      // window.location.href = `/campaigns/123`;
    }, 1200);
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Create Campaign</h1>
      <StepIndicator step={step} />
      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input name="title" id="title" value={form.title} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea name="description" id="description" value={form.description} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="campaign_type">Type</Label>
              <select name="campaign_type" id="campaign_type" value={form.campaign_type} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option>Sponsored Post</option>
                <option>Giveaway</option>
                <option>Brand Ambassador</option>
              </select>
            </div>
            <div>
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {categoriesList.map(cat => (
                  <label key={cat} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="categories"
                      value={cat}
                      checked={form.categories.includes(cat)}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Platforms</Label>
              <div className="flex gap-4 mt-2">
                {platforms.map(platform => (
                  <label key={platform} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="platform_targets"
                      value={platform}
                      checked={form.platform_targets.includes(platform)}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <span>{platform}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label>Deliverables</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {deliverablesList.map(deliv => (
                  <label key={deliv} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="deliverables"
                      value={deliv}
                      checked={form.deliverables.includes(deliv)}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <span>{deliv}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input name="budget" id="budget" type="number" value={form.budget} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input name="start_date" id="start_date" type="date" value={form.start_date} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input name="end_date" id="end_date" type="date" value={form.end_date} onChange={handleChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select name="status" id="status" value={form.status} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option>Open</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="mb-2 font-semibold">Selected Influencers</div>
              <div className="flex flex-wrap gap-3 mb-4">
                {selectedInfluencers.map(inf => (
                  <div key={inf.id} className="flex items-center gap-2 border rounded px-3 py-1 bg-muted">
                    <span className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">{inf.name[0]}</span>
                    <span>{inf.name}</span>
                    <button type="button" className="ml-1 text-red-500" onClick={() => handleRemoveInfluencer(inf.id)} disabled={inviteDisabled}>&times;</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 font-semibold">Invite Influencers</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockInfluencers.map(inf => (
                  <div key={inf.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg">{inf.name[0]}</span>
                      <span>{inf.name}</span>
                    </div>
                    <Button size="sm" onClick={() => handleInvite(inf)} disabled={inviteDisabled || selectedInfluencers.some(i => i.id === inf.id)}>
                      {selectedInfluencers.some(i => i.id === inf.id) ? "Invited" : "Invite"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => { setInviteDisabled(true); setStep(4); }} disabled={selectedInfluencers.length === 0}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6">
            <div className="font-semibold text-lg mb-2">Review & Submit</div>
            <div className="space-y-2">
              <div><span className="font-semibold">Title:</span> {form.title}</div>
              <div><span className="font-semibold">Description:</span> {form.description}</div>
              <div><span className="font-semibold">Type:</span> {form.campaign_type}</div>
              <div><span className="font-semibold">Categories:</span> {form.categories.join(", ")}</div>
              <div><span className="font-semibold">Platforms:</span> {form.platform_targets.join(", ")}</div>
              <div><span className="font-semibold">Deliverables:</span> {form.deliverables.join(", ")}</div>
              <div><span className="font-semibold">Budget:</span> ₹{form.budget}</div>
              <div><span className="font-semibold">Dates:</span> {form.start_date} to {form.end_date}</div>
              <div><span className="font-semibold">Status:</span> {form.status}</div>
              <div><span className="font-semibold">Invited Influencers:</span> {selectedInfluencers.map(i => i.name).join(", ")}</div>
            </div>
            <div className="flex justify-between gap-4">
              <Button type="button" variant="outline" onClick={() => { setStep(3); setInviteDisabled(false); }}>
                Back
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </div>
        )}
        {/* Step navigation */}
        {step < 3 && (
          <div className="flex justify-between gap-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 