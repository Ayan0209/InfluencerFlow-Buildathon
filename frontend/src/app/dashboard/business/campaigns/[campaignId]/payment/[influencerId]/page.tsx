// frontend/src/app/dashboard/business/campaigns/[campaignId]/payment/[influencerId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// (Optional) A simple spinner
function Spinner() {
  return <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CreateOrderResponse {
  order_id: string;
  amount: number;   // in paise
  currency: string; // "INR"
  key_id: string;   // mock key
}

interface PaymentRecord {
  id: string;
  amount: number;               // in rupees
  status: "Pending" | "Paid" | "Failed";
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  created_at: string;
}

async function fetchPaymentHistory(
  campaignId: string,
  influencerId: string
): Promise<PaymentRecord[]> {
  const res = await fetch(
    `/api/payment/history?campaign_id=${campaignId}&influencer_id=${influencerId}`
  );
  if (!res.ok) throw new Error("Failed to fetch payment history");
  const json = await res.json();
  return json.payments as PaymentRecord[];
}

async function createOrder(
  campaignId: string,
  influencerId: string,
  paymentAmount: number
): Promise<CreateOrderResponse> {
  const res = await fetch("/api/payment/create_order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_id: campaignId,
      influencer_id: influencerId,
      payment_amount: paymentAmount,
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to create order");
  }
  return res.json();
}

async function verifyPayment(
  payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
): Promise<{ success: boolean }> {
  const res = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Payment verification failed");
  }
  return res.json();
}

export default function PaymentPage() {
  const { campaignId, influencerId } = useParams() as {
    campaignId: string;
    influencerId: string;
  };
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1) Fetch payment history:
  const {
    data: paymentHistory,
    isLoading: loadingHistory,
    error: historyError,
  } = useQuery<PaymentRecord[]>({
    queryKey: ["paymentHistory", campaignId, influencerId],
    queryFn: () => fetchPaymentHistory(campaignId, influencerId),
    enabled: !!campaignId && !!influencerId,
  });

  // 2) Mutation to create the mock order (with partialAmount)
  const createOrderMutation = useMutation({
    mutationFn: () => createOrder(campaignId, influencerId, partialAmount),
    onSuccess: (data) => {
      setOrderData(data);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Payment request failed");
      setIsProcessing(false);
    },
  });

  // 3) Mutation to verify payment
  const verifyMutation = useMutation({
    mutationFn: (payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => verifyPayment(payload),
    onSuccess: () => {
      // Refresh payment history so the new “Paid” row appears
      queryClient.invalidateQueries({ queryKey: ["paymentHistory", campaignId, influencerId] });
      // Redirect back to campaign details
      router.push(`campaign/${campaignId}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Verification failed");
    },
  });

  // 4) When orderData arrives, simulate a Razorpay callback exactly once
  useEffect(() => {
    if (!orderData) return;

    const mockResponse = {
      razorpay_order_id: orderData.order_id,
      razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
      razorpay_signature: `sig_mock_${Math.random().toString(36).substr(2, 9)}`,
    };

    verifyMutation.mutate(mockResponse);
    setOrderData(null); // prevent repeated calls
  }, [orderData, verifyMutation]);

  // 5) Compute agreed_total, already_paid, remaining
  let agreedTotal = 0;
  let alreadyPaid = 0;
  let remaining = 0;

  // 6) Fetch agreed_total from campaign_influencer
  const {
    data: joinRowData,
    isLoading: joinLoading,
    error: joinError,
  } = useQuery<{ rate_per_post: number } | null>({
    queryKey: ["joinRow", campaignId, influencerId],
    queryFn: async () => {
      const res = await fetch(`/api/campaign/${campaignId}/influencers/${influencerId}`);
      console.log("joinRowData", res);
      if (!res.ok) return null;
      const json = await res.json();
      return { rate_per_post: json.join.agreed_rate_per_post };
    },
    enabled: !!campaignId && !!influencerId,
  });

  if (joinRowData) {
    agreedTotal = joinRowData.rate_per_post;
    console.log("agreedTotal", agreedTotal);
  }

  if (paymentHistory) {
    alreadyPaid = paymentHistory
      .filter((r) => r.status === "Paid")
      .reduce((sum, r) => sum + r.amount, 0);
  }

  remaining = agreedTotal - alreadyPaid;

  const handlePayNow = () => {
    if (partialAmount <= 0 || partialAmount > remaining) {
      setErrorMsg(`Enter a valid amount (1 to ${remaining.toFixed(2)})`);
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);
    createOrderMutation.mutate();
  };

  // Loading state
  if (loadingHistory || joinLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (historyError || joinError) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading payment data.
      </div>
    );
  }

  // Treat undefined as empty array below
  const historyList = paymentHistory || [];

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* 1) Agreed Total & Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <Button
          variant="secondary"
          onClick={() => router.push(`/campaign/${campaignId}`)}
        >
          Back to Campaign
        </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-600">Agreed Total</p>
              <p className="text-xl font-semibold">
                ₹{(agreedTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-600">Already Paid</p>
              <p className="text-xl font-semibold">
                ₹{(alreadyPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-xl font-semibold">
                ₹{(remaining || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2) Payment History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyList.length === 0 ? (
            <p className="text-gray-600">No payments made yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {historyList.map((p) => (
                <li key={p.id} className="py-2 flex justify-between">
                  <div>
                    <p className="font-medium">
                      ₹{p.amount.toFixed(2)} —{" "}
                      <span
                        className={
                          p.status === "Paid"
                            ? "text-green-600"
                            : p.status === "Pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {p.status}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">
                      Order: {p.razorpay_order_id}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 3) Flexible Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Make a Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter amount to pay (₹)
              </label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={partialAmount === 0 ? "" : partialAmount}
                onChange={(e) => setPartialAmount(Number(e.target.value))}
                placeholder={`Up to ₹${remaining.toFixed(2)}`}
                disabled={remaining <= 0 || createOrderMutation.isPending}
                className="mt-1 w-full"
              />
            </div>
            {errorMsg && <p className="text-red-600">{errorMsg}</p>}
            <Button
              onClick={handlePayNow}
              disabled={
                isProcessing ||
                createOrderMutation.isPending ||
                remaining <= 0
              }
            >
              {isProcessing || createOrderMutation.isPending
                ? "Processing…"
                : remaining <= 0
                ? "Nothing Remaining"
                : `Pay ₹${partialAmount.toFixed(2) || remaining.toFixed(2)}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
