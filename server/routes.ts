import express, { Request, Response } from "express";
import { storage } from "./storage";
import { sendEmail } from "./services/email";
import { sendWhatsAppMessage } from "./services/whatsapp";
import { createPaymentOrder, verifyPayment } from "./services/payment";
import multer from "multer";
import path from "path";
import {
  insertFdpEventSchema,
  insertHostCollegeSchema,
  insertFacultyRegistrationSchema,
} from "../shared/schema";

const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  }
});

export const apiRouter = express.Router();

// ============= FDP Events Routes =============
apiRouter.get("/fdp-events", async (req: Request, res: Response) => {
  try {
    const events = req.query.active === "true" 
      ? await storage.getActiveFdpEvents()
      : await storage.getAllFdpEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch FDP events" });
  }
});

apiRouter.get("/fdp-events/:id", async (req: Request, res: Response) => {
  try {
    const event = await storage.getFdpEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "FDP event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch FDP event" });
  }
});

apiRouter.post("/fdp-events", async (req: Request, res: Response) => {
  try {
    const validatedData = insertFdpEventSchema.parse(req.body);
    const event = await storage.createFdpEvent(validatedData);
    res.status(201).json(event);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create FDP event" });
  }
});

apiRouter.put("/fdp-events/:id", async (req: Request, res: Response) => {
  try {
    const event = await storage.updateFdpEvent(req.params.id, req.body);
    if (!event) {
      return res.status(404).json({ error: "FDP event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to update FDP event" });
  }
});

apiRouter.delete("/fdp-events/:id", async (req: Request, res: Response) => {
  try {
    const success = await storage.deleteFdpEvent(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "FDP event not found" });
    }
    res.json({ message: "FDP event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete FDP event" });
  }
});

// ============= Host College Routes =============
apiRouter.post("/host-colleges", upload.single("logo"), async (req: Request, res: Response) => {
  try {
    const dataToValidate = {
      ...req.body,
      logoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    };
    
    const validatedData = insertHostCollegeSchema.parse(dataToValidate);
    const college = await storage.createHostCollege(validatedData);
    
    // Create payment order
    const paymentOrder = await createPaymentOrder({
      amount: parseFloat(req.body.hostFee),
      entityType: "host_college",
      entityId: college.id,
      fdpId: req.body.fdpId,
    });
    
    res.status(201).json({ college, paymentOrder });
  } catch (error) {
    console.error("Error creating host college:", error);
    res.status(500).json({ error: "Failed to create host college registration" });
  }
});

apiRouter.get("/host-colleges/:id", async (req: Request, res: Response) => {
  try {
    const college = await storage.getHostCollege(req.params.id);
    if (!college) {
      return res.status(404).json({ error: "Host college not found" });
    }
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch host college" });
  }
});

apiRouter.get("/fdp-events/:fdpId/host-colleges", async (req: Request, res: Response) => {
  try {
    const colleges = await storage.getHostCollegesByFdp(req.params.fdpId);
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch host colleges" });
  }
});

// ============= Faculty Registration Routes =============
apiRouter.post("/faculty-registrations", async (req: Request, res: Response) => {
  try {
    const validatedData = insertFacultyRegistrationSchema.parse(req.body);
    const registration = await storage.createFacultyRegistration(validatedData);
    
    // Create payment order
    const paymentOrder = await createPaymentOrder({
      amount: parseFloat(req.body.facultyFee),
      entityType: "faculty",
      entityId: registration.id,
      fdpId: req.body.fdpId,
    });
    
    res.status(201).json({ registration, paymentOrder });
  } catch (error) {
    console.error("Error creating faculty registration:", error);
    res.status(500).json({ error: "Failed to create faculty registration" });
  }
});

apiRouter.get("/faculty-registrations/:id", async (req: Request, res: Response) => {
  try {
    const registration = await storage.getFacultyRegistration(req.params.id);
    if (!registration) {
      return res.status(404).json({ error: "Faculty registration not found" });
    }
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculty registration" });
  }
});

apiRouter.get("/fdp-events/:fdpId/faculty", async (req: Request, res: Response) => {
  try {
    const faculty = await storage.getFacultyByFdp(req.params.fdpId);
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculty registrations" });
  }
});

apiRouter.get("/host-colleges/:hostCollegeId/faculty", async (req: Request, res: Response) => {
  try {
    const faculty = await storage.getFacultyByHostCollege(req.params.hostCollegeId);
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculty registrations" });
  }
});

// ============= Payment Routes =============
apiRouter.post("/payments/verify", async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    
    const isValid = await verifyPayment(orderId, paymentId, signature);
    
    if (isValid) {
      const payment = await storage.getPaymentByOrderId(orderId);
      if (payment) {
        await storage.updatePayment(payment.id, {
          status: "success",
          paymentId,
          paymentMethod: req.body.paymentMethod,
        });
        
        // Update entity payment status
        if (payment.entityType === "host_college") {
          await storage.updateHostCollege(payment.entityId, {
            paymentStatus: "completed",
            paymentId,
            amountPaid: payment.amount,
          });
          
          // Send confirmation email and WhatsApp
          const college = await storage.getHostCollege(payment.entityId);
          if (college) {
            await sendEmail({
              to: college.email,
              subject: "Host College Registration Confirmed",
              html: `<p>Your registration has been confirmed. Payment ID: ${paymentId}</p>`,
            });
            
            if (college.whatsapp) {
              await sendWhatsAppMessage({
                to: college.whatsapp,
                message: `Your host college registration has been confirmed. Payment ID: ${paymentId}`,
              });
            }
          }
        } else if (payment.entityType === "faculty") {
          await storage.updateFacultyRegistration(payment.entityId, {
            paymentStatus: "completed",
            paymentId,
            amountPaid: payment.amount,
          });
          
          // Send confirmation email and WhatsApp
          const faculty = await storage.getFacultyRegistration(payment.entityId);
          if (faculty) {
            const fdp = await storage.getFdpEvent(faculty.fdpId);
            await sendEmail({
              to: faculty.email,
              subject: "FDP Registration Confirmed",
              html: `<p>Your registration for ${fdp?.title} has been confirmed. Payment ID: ${paymentId}</p>`,
            });
            
            if (faculty.whatsapp) {
              await sendWhatsAppMessage({
                to: faculty.whatsapp,
                message: `Your registration for ${fdp?.title} has been confirmed. Payment ID: ${paymentId}`,
              });
            }
          }
        }
      }
      
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, error: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// Webhook for Cashfree
apiRouter.post("/payments/webhook", async (req: Request, res: Response) => {
  try {
    // Verify webhook signature here
    const { orderId, paymentStatus, paymentId } = req.body;
    
    const payment = await storage.getPaymentByOrderId(orderId);
    if (payment) {
      await storage.updatePayment(payment.id, {
        status: paymentStatus === "SUCCESS" ? "success" : "failed",
        paymentId,
        gatewayResponse: req.body,
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ============= Communication Routes =============
apiRouter.post("/communications/bulk-email", async (req: Request, res: Response) => {
  try {
    const { fdpId, recipients, subject, content } = req.body;
    
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient.email,
        subject,
        html: content,
      });
      
      await storage.createCommunicationLog({
        fdpId,
        recipientType: recipient.type,
        recipientId: recipient.id,
        channel: "email",
        messageType: "bulk",
        recipient: recipient.email,
        subject,
        content,
        status: "sent",
        sentAt: new Date(),
      });
    }
    
    res.json({ success: true, message: `Email sent to ${recipients.length} recipients` });
  } catch (error) {
    console.error("Bulk email error:", error);
    res.status(500).json({ error: "Failed to send bulk emails" });
  }
});

apiRouter.post("/communications/bulk-whatsapp", async (req: Request, res: Response) => {
  try {
    const { fdpId, recipients, message } = req.body;
    
    for (const recipient of recipients) {
      if (recipient.whatsapp) {
        await sendWhatsAppMessage({
          to: recipient.whatsapp,
          message,
        });
        
        await storage.createCommunicationLog({
          fdpId,
          recipientType: recipient.type,
          recipientId: recipient.id,
          channel: "whatsapp",
          messageType: "bulk",
          recipient: recipient.whatsapp,
          content: message,
          status: "sent",
          sentAt: new Date(),
        });
      }
    }
    
    res.json({ success: true, message: `WhatsApp sent to ${recipients.length} recipients` });
  } catch (error) {
    console.error("Bulk WhatsApp error:", error);
    res.status(500).json({ error: "Failed to send bulk WhatsApp messages" });
  }
});

// ============= Analytics Routes =============
apiRouter.get("/fdp-events/:fdpId/analytics", async (req: Request, res: Response) => {
  try {
    const analytics = await storage.getFdpAnalytics(req.params.fdpId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ============= Coupon Routes =============
apiRouter.post("/coupons/validate", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const coupon = await storage.getCouponByCode(code);
    
    if (!coupon) {
      return res.status(404).json({ error: "Invalid coupon code" });
    }
    
    if (coupon.maxUses && coupon.usedCount! >= coupon.maxUses) {
      return res.status(400).json({ error: "Coupon usage limit exceeded" });
    }
    
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return res.status(400).json({ error: "Coupon has expired" });
    }
    
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: "Failed to validate coupon" });
  }
});

export default apiRouter;
