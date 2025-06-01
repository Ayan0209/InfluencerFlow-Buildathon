"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase_client";

function LoginForm({ role }: { role: "business" | "influencer" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isDisabled = !email || !password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDisabled) return;

    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      alert(`Login failed: ${error.message}`);
      return;
    }

    // Redirect to the appropriate dashboard
    if (role === "business") {
      router.push("/dashboard/business");
    } else {
      router.push("/dashboard/influencer");
    }
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
          onChange={(e) => setEmail(e.target.value)}
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
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isDisabled || isLoading} className="w-full">
        {isLoading ? "Logging in…" : "Login"}
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
