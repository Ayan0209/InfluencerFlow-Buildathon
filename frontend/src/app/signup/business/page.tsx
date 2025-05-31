"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function handleBusinessSignup(formData: Record<string, string>) {
  // Placeholder for signup logic
  // eslint-disable-next-line no-console
  console.log("Business Signup:", formData);
}

export default function BusinessSignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    description: "",
    website_url: "",
    industry: "",
    city: "",
    state: "",
    country: "",
    social_instagram: "",
    social_facebook: "",
    social_twitter: "",
  });

  const isDisabled = !form.name || !form.email || !form.password;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDisabled) handleBusinessSignup(form);
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Create Business Account</h1>
      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="name">Business Name</Label>
          <Input name="name" type="text" id="name" value={form.name} onChange={handleChange} required />
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
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input name="industry" type="text" id="industry" value={form.industry} onChange={handleChange} />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea name="description" id="description" value={form.description} onChange={handleChange} />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input name="website_url" type="url" id="website_url" value={form.website_url} onChange={handleChange} />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label>Location (City, State, Country)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input name="city" type="text" placeholder="City" value={form.city} onChange={handleChange} />
            <Input name="state" type="text" placeholder="State" value={form.state} onChange={handleChange} />
            <Input name="country" type="text" placeholder="Country" value={form.country} onChange={handleChange} />
          </div>
        </div>
        <div>
          <Label htmlFor="social_instagram">Instagram</Label>
          <Input name="social_instagram" type="url" id="social_instagram" value={form.social_instagram} onChange={handleChange} placeholder="https://instagram.com/yourbusiness" />
        </div>
        <div>
          <Label htmlFor="social_facebook">Facebook</Label>
          <Input name="social_facebook" type="url" id="social_facebook" value={form.social_facebook} onChange={handleChange} placeholder="https://facebook.com/yourbusiness" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="social_twitter">Twitter</Label>
          <Input name="social_twitter" type="url" id="social_twitter" value={form.social_twitter} onChange={handleChange} placeholder="https://twitter.com/yourbusiness" />
        </div>
        <div className="col-span-1 sm:col-span-2 mt-4">
          <Button type="submit" className="w-full" disabled={isDisabled}>
            Sign Up
          </Button>
        </div>
      </form>
    </div>
  );
} 