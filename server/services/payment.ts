import crypto from "crypto";
import { storage } from "../storage";

// Cashfree Payment Gateway Integration
// Documentation: https://docs.cashfree.com/reference

export interface PaymentOrderData {
  amount: number;
  entityType: "host_college" | "faculty";
  entityId: string;
  fdpId: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export async function createPaymentOrder(data: PaymentOrderData) {
  try {
    const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
    const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const CASHFREE_API_URL = process.env.CASHFREE_API_URL || "https://sandbox.cashfree.com/pg";

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      throw new Error("Cashfree credentials not configured");
    }

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create payment record in database
    const payment = await storage.createPayment({
      orderId,
      entityType: data.entityType,
      entityId: data.entityId,
      fdpId: data.fdpId,
      amount: data.amount.toFixed(2),
      currency: "INR",
      status: "created",
      paymentGateway: "cashfree",
    });

    // Create Cashfree order
    const orderPayload = {
      order_id: orderId,
      order_amount: data.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: data.entityId,
        customer_email: data.customerEmail || "user@example.com",
        customer_phone: data.customerPhone || "9999999999",
        customer_name: data.customerName || "User",
      },
      order_meta: {
        return_url: `${process.env.APP_URL}/payment/callback?orderId=${orderId}`,
        notify_url: `${process.env.API_URL}/api/payments/webhook`,
      },
    };

    const response = await fetch(`${CASHFREE_API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Cashfree order creation failed:", error);
      throw new Error("Failed to create payment order");
    }

    const result = await response.json();
    
    // Update payment with gateway response
    await storage.updatePayment(payment.id, {
      status: "pending",
      gatewayResponse: result,
    });

    return {
      orderId,
      paymentSessionId: result.payment_session_id,
      paymentLink: result.payment_link,
    };
  } catch (error) {
    console.error("Payment order creation error:", error);
    throw error;
  }
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  try {
    const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

    if (!CASHFREE_SECRET_KEY) {
      throw new Error("Cashfree secret key not configured");
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", CASHFREE_SECRET_KEY)
      .update(`${orderId}${paymentId}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Payment signature verification failed");
      return false;
    }

    // Fetch payment status from Cashfree
    const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
    const CASHFREE_API_URL = process.env.CASHFREE_API_URL || "https://sandbox.cashfree.com/pg";

    const response = await fetch(`${CASHFREE_API_URL}/orders/${orderId}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "x-client-id": CASHFREE_APP_ID!,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch payment status from Cashfree");
      return false;
    }

    const paymentData = await response.json();
    
    if (paymentData.payment_status === "SUCCESS") {
      console.log("✅ Payment verified successfully");
      return true;
    }

    console.error("❌ Payment status not successful:", paymentData.payment_status);
    return false;
  } catch (error) {
    console.error("Payment verification error:", error);
    return false;
  }
}

export async function initiateRefund(paymentId: string, amount: number, reason: string) {
  try {
    const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
    const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const CASHFREE_API_URL = process.env.CASHFREE_API_URL || "https://sandbox.cashfree.com/pg";

    const refundPayload = {
      refund_amount: amount,
      refund_id: `REFUND_${Date.now()}`,
      refund_note: reason,
    };

    const response = await fetch(`${CASHFREE_API_URL}/orders/${paymentId}/refunds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID!,
        "x-client-secret": CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(refundPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Refund initiation failed:", error);
      throw new Error("Failed to initiate refund");
    }

    const result = await response.json();
    console.log("✅ Refund initiated:", result);
    return result;
  } catch (error) {
    console.error("Refund error:", error);
    throw error;
  }
}
