"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Card, Checkbox, and Select are assumed to be available as ShadCN UI components

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

function handleInfluencerSignup(formData: Record<string, any>) {
  // Placeholder for signup logic
  // eslint-disable-next-line no-console
  console.log("Influencer Signup:", formData);
}

export default function InfluencerSignupPage() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    profile_picture: undefined as File | undefined,
    city: "",
    state: "",
    country: "",
    instagram_handle: "",
    instagram_followers: "",
    instagram_engagement: "",
    youtube_handle: "",
    youtube_subscribers: "",
    youtube_avg_views: "",
    tiktok_handle: "",
    tiktok_followers: "",
    tiktok_engagement: "",
    categories: [] as string[],
    rate_per_post: "",
    availability: "Available",
  });

  const isDisabled = !form.name || !form.username || !form.email || !form.password;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type, files, checked } = e.target as any;
    if (type === "file") {
      setForm(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === "checkbox" && name === "categories") {
      setForm(prev => ({
        ...prev,
        categories: checked
          ? [...prev.categories, value]
          : prev.categories.filter((cat: string) => cat !== value),
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDisabled) handleInfluencerSignup(form);
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Create Influencer Account</h1>
      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input name="name" type="text" id="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input name="username" type="text" id="username" value={form.username} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input name="email" type="email" id="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input name="password" type="password" id="password" value={form.password} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input name="phone" type="text" id="phone" value={form.phone} onChange={handleChange} />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea name="bio" id="bio" value={form.bio} onChange={handleChange} />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="profile_picture">Profile Picture</Label>
          <Input name="profile_picture" type="file" id="profile_picture" onChange={handleChange} />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label>Location (City, State, Country)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input name="city" type="text" placeholder="City" value={form.city} onChange={handleChange} />
            <Input name="state" type="text" placeholder="State" value={form.state} onChange={handleChange} />
            <Input name="country" type="text" placeholder="Country" value={form.country} onChange={handleChange} />
          </div>
        </div>
        {/* Instagram Block */}
        <div className="col-span-1 sm:col-span-2 border rounded-lg p-4">
          <div className="font-semibold mb-2 flex items-center gap-2">
            {/* Instagram Icon Placeholder */}
            <span role="img" aria-label="Instagram">📸</span> Instagram
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="instagram_handle">Instagram Handle</Label>
              <Input name="instagram_handle" type="text" id="instagram_handle" value={form.instagram_handle} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="instagram_followers">Followers</Label>
              <Input name="instagram_followers" type="number" id="instagram_followers" value={form.instagram_followers} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="instagram_engagement">Engagement Rate (%)</Label>
              <Input name="instagram_engagement" type="number" step="0.1" id="instagram_engagement" value={form.instagram_engagement} onChange={handleChange} />
            </div>
          </div>
        </div>
        {/* YouTube Block */}
        <div className="col-span-1 sm:col-span-2 border rounded-lg p-4">
          <div className="font-semibold mb-2 flex items-center gap-2">
            {/* YouTube Icon Placeholder */}
            <span role="img" aria-label="YouTube">📺</span> YouTube
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="youtube_handle">YouTube Handle</Label>
              <Input name="youtube_handle" type="text" id="youtube_handle" value={form.youtube_handle} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="youtube_subscribers">Subscribers</Label>
              <Input name="youtube_subscribers" type="number" id="youtube_subscribers" value={form.youtube_subscribers} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="youtube_avg_views">Avg. Views</Label>
              <Input name="youtube_avg_views" type="number" id="youtube_avg_views" value={form.youtube_avg_views} onChange={handleChange} />
            </div>
          </div>
        </div>
        {/* TikTok Block */}
        <div className="col-span-1 sm:col-span-2 border rounded-lg p-4">
          <div className="font-semibold mb-2 flex items-center gap-2">
            {/* TikTok Icon Placeholder */}
            <span role="img" aria-label="TikTok">🎵</span> TikTok
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tiktok_handle">TikTok Handle</Label>
              <Input name="tiktok_handle" type="text" id="tiktok_handle" value={form.tiktok_handle} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="tiktok_followers">Followers</Label>
              <Input name="tiktok_followers" type="number" id="tiktok_followers" value={form.tiktok_followers} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="tiktok_engagement">Engagement Rate (%)</Label>
              <Input name="tiktok_engagement" type="number" step="0.1" id="tiktok_engagement" value={form.tiktok_engagement} onChange={handleChange} />
            </div>
          </div>
        </div>
        {/* Categories */}
        <div className="col-span-1 sm:col-span-2">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-4 mt-2">
            {categoriesList.map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="categories"
                  value={cat}
                  checked={form.categories.includes(cat)}
                  onChange={handleChange}
                  id={`cat-${cat}`}
                  className="accent-primary"
                />
                <Label htmlFor={`cat-${cat}`}>{cat}</Label>
              </div>
            ))}
          </div>
        </div>
        {/* Rate Per Post */}
        <div>
          <Label htmlFor="rate_per_post">Rate per Post (₹)</Label>
          <Input name="rate_per_post" type="number" id="rate_per_post" value={form.rate_per_post} onChange={handleChange} />
        </div>
        {/* Availability */}
        <div>
          <Label htmlFor="availability">Availability</Label>
          <select
            name="availability"
            id="availability"
            value={form.availability}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="On holiday">On holiday</option>
          </select>
        </div>
        {/* Submit Button */}
        <div className="col-span-1 sm:col-span-2 mt-4">
          <Button type="submit" className="w-full" disabled={isDisabled}>
            Sign Up
          </Button>
        </div>
      </form>
    </div>
  );
} 