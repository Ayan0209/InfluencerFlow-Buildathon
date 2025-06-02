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
import CampaignFormTabs from "../CampaignFormTabs";

export default function CampaignCreatePage() {
  return <CampaignFormTabs id="new" />;
}
