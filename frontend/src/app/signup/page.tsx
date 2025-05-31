"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const signupOptions = [
  {
    label: "Business Signup",
    href: "/signup/business",
    description: "Sign up as a business to find influencers and manage campaigns.",
  },
  {
    label: "Influencer Signup",
    href: "/signup/influencer",
    description: "Sign up as an influencer to connect with brands and grow your reach.",
  },
];

export default function SignupPage() {
  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto py-12 px-4">
      {signupOptions.map(option => (
        <Link key={option.href} href={option.href} className="flex-1">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-center">
                {option.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground text-base md:text-lg">
                {option.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
} 