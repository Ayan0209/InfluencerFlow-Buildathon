// frontend/src/app/signup/influencer/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { supabase } from "@/lib/supabase_client";

export default function InfluencerSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    profile_picture_url: "",
    instagram_handle: "",
    instagram_followers: "",
    instagram_engagement: "",
    youtube_handle: "",
    youtube_subscribers: "",
    youtube_avg_views: "",
    tiktok_handle: "",
    tiktok_followers: "",
    tiktok_engagement: "",
    city: "",
    state: "",
    country: "",
    categories: [] as string[],
    rate_per_post: "",
    availability: "", // e.g. "Available"
  });
  const [isLoading, setIsLoading] = useState(false);

  const isDisabled =
    !form.name || !form.username || !form.email || !form.password;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCategoryToggle(category: string) {
    setForm((prev) => {
      const cats = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: cats };
    });
  }

  async function handleInfluencerSignup(e: React.FormEvent) {
    e.preventDefault();
    if (isDisabled) return;

    setIsLoading(true);

    // 1) Create Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (authError) {
      alert("Error signing up: " + authError.message);
      setIsLoading(false);
      return;
    }
    const userId = authData.user?.id!;
    if (!userId) {
      alert("User ID missing after signup");
      setIsLoading(false);
      return;
    }

    // Build the social_media JSON
    const social_media = {
      instagram: {
        handle: form.instagram_handle,
        followers: form.instagram_followers
          ? parseInt(form.instagram_followers, 10)
          : null,
        engagement_rate: form.instagram_engagement
          ? parseFloat(form.instagram_engagement)
          : null,
        url: form.instagram_handle
          ? `https://instagram.com/${form.instagram_handle}`
          : null,
      },
      youtube: {
        handle: form.youtube_handle,
        subscribers: form.youtube_subscribers
          ? parseInt(form.youtube_subscribers, 10)
          : null,
        avg_views: form.youtube_avg_views
          ? parseInt(form.youtube_avg_views, 10)
          : null,
        url: form.youtube_handle
          ? `https://youtube.com/@${form.youtube_handle}`
          : null,
      },
      tiktok: {
        handle: form.tiktok_handle,
        followers: form.tiktok_followers
          ? parseInt(form.tiktok_followers, 10)
          : null,
        engagement_rate: form.tiktok_engagement
          ? parseFloat(form.tiktok_engagement)
          : null,
        url: form.tiktok_handle
          ? `https://tiktok.com/@${form.tiktok_handle}`
          : null,
      },
    };

    // 2) Call API to insert into 'influencer'
    const response = await fetch("/api/influencer-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone || null,
        bio: form.bio || null,
        profile_picture_url: form.profile_picture_url || null,
        social_media,
        categories: form.categories,
        rate_per_post: form.rate_per_post
          ? parseFloat(form.rate_per_post)
          : null,
        availability: form.availability || null,
        location: {
          city: form.city,
          state: form.state,
          country: form.country,
        },
      }),
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      alert("Error creating influencer profile: " + result.error);
      return;
    }

    alert("Influencer account created successfully!");
    router.push("/dashboard/influencer");
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Create Influencer Account
      </h1>
      <form
        onSubmit={handleInfluencerSignup}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        {/* Name & Username */}
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            name="name"
            type="text"
            id="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            name="username"
            type="text"
            id="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>
        {/* Email & Password */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            name="email"
            type="email"
            id="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            name="password"
            type="password"
            id="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        {/* Phone & Bio */}
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            name="phone"
            type="text"
            id="phone"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            name="bio"
            id="bio"
            value={form.bio}
            onChange={handleChange}
          />
        </div>
        {/* Profile Picture */}
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
          <Input
            name="profile_picture_url"
            type="url"
            id="profile_picture_url"
            value={form.profile_picture_url}
            onChange={handleChange}
          />
        </div>
        {/* Location */}
        <div className="col-span-1 sm:col-span-2">
          <Label>Location (City, State, Country)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              name="city"
              type="text"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
            />
            <Input
              name="state"
              type="text"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
            />
            <Input
              name="country"
              type="text"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* Social Media Blocks */}
        {/* Instagram */}
        <div className="col-span-1 sm:col-span-2 p-4 border rounded-md">
          <h3 className="font-semibold mb-2">Instagram</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label htmlFor="instagram_handle">Handle</Label>
              <Input
                name="instagram_handle"
                type="text"
                id="instagram_handle"
                value={form.instagram_handle}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="instagram_followers">Followers</Label>
              <Input
                name="instagram_followers"
                type="number"
                id="instagram_followers"
                value={form.instagram_followers}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="instagram_engagement">
                Engagement Rate (%)
              </Label>
              <Input
                name="instagram_engagement"
                type="number"
                step="0.1"
                id="instagram_engagement"
                value={form.instagram_engagement}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        {/* YouTube */}
        <div className="col-span-1 sm:col-span-2 p-4 border rounded-md">
          <h3 className="font-semibold mb-2">YouTube</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label htmlFor="youtube_handle">Handle</Label>
              <Input
                name="youtube_handle"
                type="text"
                id="youtube_handle"
                value={form.youtube_handle}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="youtube_subscribers">Subscribers</Label>
              <Input
                name="youtube_subscribers"
                type="number"
                id="youtube_subscribers"
                value={form.youtube_subscribers}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="youtube_avg_views">Avg Views</Label>
              <Input
                name="youtube_avg_views"
                type="number"
                id="youtube_avg_views"
                value={form.youtube_avg_views}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        {/* TikTok */}
        <div className="col-span-1 sm:col-span-2 p-4 border rounded-md">
          <h3 className="font-semibold mb-2">TikTok</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label htmlFor="tiktok_handle">Handle</Label>
              <Input
                name="tiktok_handle"
                type="text"
                id="tiktok_handle"
                value={form.tiktok_handle}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="tiktok_followers">Followers</Label>
              <Input
                name="tiktok_followers"
                type="number"
                id="tiktok_followers"
                value={form.tiktok_followers}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="tiktok_engagement">Engagement Rate (%)</Label>
              <Input
                name="tiktok_engagement"
                type="number"
                step="0.1"
                id="tiktok_engagement"
                value={form.tiktok_engagement}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        {/* Categories */}
        <div className="col-span-1 sm:col-span-2">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Fashion", "Tech", "Fitness", "Travel"].map((cat) => (
              <label key={cat} className="flex items-center space-x-1">
                <Checkbox
                  checked={form.categories.includes(cat)}
                  onCheckedChange={() => handleCategoryToggle(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Rate & Availability */}
        <div>
          <Label htmlFor="rate_per_post">Rate per Post (₹)</Label>
          <Input
            name="rate_per_post"
            type="number"
            id="rate_per_post"
            value={form.rate_per_post}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="availability">Availability</Label>
          <Select
            value={form.availability}
            onValueChange={(val) =>
              setForm((prev) => ({ ...prev, availability: val }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Busy">Busy</SelectItem>
              <SelectItem value="On holiday">On holiday</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Submit */}
        <div className="col-span-1 sm:col-span-2 mt-4">
          <Button type="submit" className="w-full" disabled={isDisabled || isLoading}>
            {isLoading ? "Creating…" : "Sign Up"}
          </Button>
        </div>
      </form>
    </div>
  );
}
