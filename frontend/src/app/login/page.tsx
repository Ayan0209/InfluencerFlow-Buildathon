"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function handleLogin(role: "business" | "influencer", email: string, password: string) {
  // Placeholder for login logic
  // eslint-disable-next-line no-console
  console.log(`Login as ${role}:`, { email, password });
}

export function LoginForm({ role }: { role: "business" | "influencer" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isDisabled = !email || !password;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDisabled) handleLogin(role, email, password);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor={`${role}-email`}>Email</Label>
        <Input
          id={`${role}-email`}
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${role}-password`}>Password</Label>
        <Input
          id={`${role}-password`}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isDisabled} className="w-full">
        Login
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-12">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="business">Business Login</TabsTrigger>
          <TabsTrigger value="influencer">Influencer Login</TabsTrigger>
        </TabsList>
        <TabsContent value="business">
          <LoginForm role="business" />
        </TabsContent>
        <TabsContent value="influencer">
          <LoginForm role="influencer" />
        </TabsContent>
      </Tabs>
    </div>
  );
} 