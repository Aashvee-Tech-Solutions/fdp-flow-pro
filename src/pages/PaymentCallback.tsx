import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get("orderId");
      const paymentId = searchParams.get("paymentId");
      const signature = searchParams.get("signature");

      if (!orderId) {
        setStatus("failed");
        setMessage("Invalid payment callback - missing order ID");
        return;
      }

      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId, paymentId, signature }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus("success");
          setMessage("Payment successful! You will receive a confirmation email and WhatsApp message shortly.");
        } else {
          setStatus("failed");
          setMessage("Payment verification failed. Please contact support if amount was deducted.");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage("Failed to verify payment. Please contact support.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/")} 
                  className="w-full"
                  data-testid="button-home"
                >
                  Go to Home
                </Button>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Payment Failed</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/")} 
                  variant="outline"
                  className="w-full"
                  data-testid="button-home"
                >
                  Go to Home
                </Button>
                <p className="text-sm text-muted-foreground">
                  For support, contact: <a href="mailto:mis@aashveetech.com" className="text-primary underline">mis@aashveetech.com</a>
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentCallback;
