"use client";

import CampaignFormTabs from "../../CampaignFormTabs";
import { useParams } from "next/navigation";

export default function CampaignEditPage() {
  const params = useParams();
  const id = params?.id as string;
  return <CampaignFormTabs id={id} />;
} 