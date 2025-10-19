import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
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
import { authenticateAdmin, generateAdminToken } from "./middleware/auth";
import { verifyCashfreeWebhookSignature } from "./services/payment";
import {
  generateCertificatePDF,
  saveCertificate,
  getDefaultCertificateTemplate,
  type CertificateData,
} from "./services/certificate";
import { format } from "date-fns";

// Rate limiter for login endpoint - 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

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

// ============= Admin Authentication Routes =============
apiRouter.post("/admin/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const token = generateAdminToken(email, password);
    
    if (token) {
      res.json({ 
        success: true, 
        token,
        email 
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

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

apiRouter.post("/fdp-events", authenticateAdmin, async (req: Request, res: Response) => {
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

apiRouter.put("/fdp-events/:id", authenticateAdmin, async (req: Request, res: Response) => {
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

apiRouter.delete("/fdp-events/:id", authenticateAdmin, async (req: Request, res: Response) => {
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
    
    // Get FDP event to fetch fee
    const fdp = await storage.getFdpEvent(req.body.fdpId);
    if (!fdp) {
      return res.status(404).json({ error: "FDP event not found" });
    }
    
    // Determine base URL from request
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;
    
    // Create payment order with customer details
    const paymentOrder = await createPaymentOrder({
      amount: parseFloat(fdp.hostFee),
      entityType: "host_college",
      entityId: college.id,
      fdpId: req.body.fdpId,
      customerEmail: college.email,
      customerPhone: college.phone,
      customerName: college.contactPerson,
      baseUrl,
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

apiRouter.get("/fdp-events/:fdpId/host-colleges", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const colleges = await storage.getHostCollegesByFdp(req.params.fdpId);
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch host colleges" });
  }
});

// New route to fetch all host colleges for admin dashboard overview
apiRouter.get("/host-colleges-all", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const colleges = await storage.getAllHostColleges();
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all host colleges" });
  }
});

// ============= Faculty Registration Routes =============
apiRouter.post("/faculty-registrations", async (req: Request, res: Response) => {
  try {
    const validatedData = insertFacultyRegistrationSchema.parse(req.body);
    const registration = await storage.createFacultyRegistration(validatedData);
    
    // Get FDP event to fetch fee
    const fdp = await storage.getFdpEvent(req.body.fdpId);
    if (!fdp) {
      return res.status(404).json({ error: "FDP event not found" });
    }
    
    // Determine base URL from request
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;
    
    // Create payment order with customer details
    const paymentOrder = await createPaymentOrder({
      amount: parseFloat(fdp.facultyFee),
      entityType: "faculty",
      entityId: registration.id,
      fdpId: req.body.fdpId,
      customerEmail: registration.email,
      customerPhone: registration.phone,
      customerName: registration.name,
      baseUrl,
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

apiRouter.get("/fdp-events/:fdpId/faculty", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const faculty = await storage.getFacultyByFdp(req.params.fdpId);
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculty registrations" });
  }
});

apiRouter.get("/host-colleges/:hostCollegeId/faculty", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const faculty = await storage.getFacultyByHostCollege(req.params.hostCollegeId);
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculty registrations" });
  }
});

// New route to fetch all faculty registrations for admin dashboard overview
apiRouter.get("/faculty-registrations-all", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const faculty = await storage.getAllFacultyRegistrations();
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all faculty registrations" });
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
    // Verify webhook signature
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    const rawBody = (req as any).rawBody;
    
    if (!verifyCashfreeWebhookSignature(rawBody, signature, timestamp)) {
      console.error("❌ Webhook signature verification failed - rejecting request");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }
    
    const { orderId, paymentStatus, paymentId, data } = req.body;
    const isSuccess = paymentStatus === "SUCCESS" || data?.payment?.payment_status === "SUCCESS";
    
    const payment = await storage.getPaymentByOrderId(orderId);
    if (payment) {
      await storage.updatePayment(payment.id, {
        status: isSuccess ? "success" : "failed",
        paymentId: paymentId || data?.payment?.cf_payment_id,
        gatewayResponse: req.body,
      });
      
      // Get FDP event details
      const fdp = await storage.getFdpEvent(payment.fdpId);
      
      if (isSuccess) {
        // Payment SUCCESS - Send confirmation
        if (payment.entityType === "host_college") {
          await storage.updateHostCollege(payment.entityId, {
            paymentStatus: "completed",
            paymentId: paymentId || data?.payment?.cf_payment_id,
            amountPaid: payment.amount,
          });
          
          const college = await storage.getHostCollege(payment.entityId);
          if (college && fdp) {
            // Send success email
            await sendEmail({
              to: college.email,
              subject: `✅ Registration Confirmed - ${fdp.title}`,
              html: `
                <h2>Registration Successful!</h2>
                <p>Dear ${college.contactPerson},</p>
                <p>Your host college registration for <strong>${fdp.title}</strong> has been confirmed.</p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p><strong>Amount Paid:</strong> ₹${payment.amount}</p>
                ${fdp.whatsappGroupLink ? `<p><strong>WhatsApp Group:</strong> <a href="${fdp.whatsappGroupLink}">Join Here</a></p>` : ''}
                ${fdp.joiningLink ? `<p><strong>FDP Joining Link:</strong> <a href="${fdp.joiningLink}">Click Here</a></p>` : ''}
                <p>Thank you for registering with Aashvee FDP!</p>
              `,
            });
            
            // Send success WhatsApp
            if (college.whatsapp) {
              let whatsappMsg = `✅ Registration Confirmed!\n\nYour host college registration for ${fdp.title} is confirmed.\n\nPayment ID: ${paymentId}\nAmount: ₹${payment.amount}`;
              if (fdp.whatsappGroupLink) {
                whatsappMsg += `\n\nWhatsApp Group: ${fdp.whatsappGroupLink}`;
              }
              if (fdp.joiningLink) {
                whatsappMsg += `\n\nFDP Link: ${fdp.joiningLink}`;
              }
              
              await sendWhatsAppMessage({
                to: college.whatsapp,
                message: whatsappMsg,
              });
            }
          }
        } else if (payment.entityType === "faculty") {
          await storage.updateFacultyRegistration(payment.entityId, {
            paymentStatus: "completed",
            paymentId: paymentId || data?.payment?.cf_payment_id,
            amountPaid: payment.amount,
          });
          
          const faculty = await storage.getFacultyRegistration(payment.entityId);
          if (faculty && fdp) {
            // Send success email
            await sendEmail({
              to: faculty.email,
              subject: `✅ Registration Confirmed - ${fdp.title}`,
              html: `
                <h2>Registration Successful!</h2>
                <p>Dear ${faculty.name},</p>
                <p>Your registration for <strong>${fdp.title}</strong> has been confirmed.</p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p><strong>Amount Paid:</strong> ₹${payment.amount}</p>
                ${fdp.whatsappGroupLink ? `<p><strong>WhatsApp Group:</strong> <a href="${fdp.whatsappGroupLink}">Join Here</a></p>` : ''}
                ${fdp.joiningLink ? `<p><strong>FDP Joining Link:</strong> <a href="${fdp.joiningLink}">Click Here</a></p>` : ''}
                <p>We look forward to seeing you!</p>
              `,
            });
            
            if (faculty.whatsapp) {
              let whatsappMsg = `✅ Registration Confirmed!\n\nYour registration for ${fdp.title} is confirmed.\n\nPayment ID: ${paymentId}\nAmount: ₹${payment.amount}`;
              if (fdp.whatsappGroupLink) {
                whatsappMsg += `\n\nWhatsApp Group: ${fdp.whatsappGroupLink}`;
              }
              if (fdp.joiningLink) {
                whatsappMsg += `\n\nFDP Link: ${fdp.joiningLink}`;
              }
              
              await sendWhatsAppMessage({
                to: faculty.whatsapp,
                message: whatsappMsg,
              });
            }
          }
        }
      } else {
        // Payment FAILED - Send failure notification
        if (payment.entityType === "host_college") {
          const college = await storage.getHostCollege(payment.entityId);
          if (college && fdp) {
            await sendEmail({
              to: college.email,
              subject: `❌ Payment Failed - ${fdp.title}`,
              html: `
                <h2>Payment Failed</h2>
                <p>Dear ${college.contactPerson},</p>
                <p>Unfortunately, your payment for <strong>${fdp.title}</strong> could not be processed.</p>
                <p>Please try again or contact support.</p>
              `,
            });
            
            if (college.whatsapp) {
              await sendWhatsAppMessage({
                to: college.whatsapp,
                message: `❌ Payment Failed\n\nYour payment for ${fdp.title} could not be processed. Please try again.`,
              });
            }
          }
        } else if (payment.entityType === "faculty") {
          const faculty = await storage.getFacultyRegistration(payment.entityId);
          if (faculty && fdp) {
            await sendEmail({
              to: faculty.email,
              subject: `❌ Payment Failed - ${fdp.title}`,
              html: `
                <h2>Payment Failed</h2>
                <p>Dear ${faculty.name},</p>
                <p>Unfortunately, your payment for <strong>${fdp.title}</strong> could not be processed.</p>
                <p>Please try again or contact support.</p>
              `,
            });
            
            if (faculty.whatsapp) {
              await sendWhatsAppMessage({
                to: faculty.whatsapp,
                message: `❌ Payment Failed\n\nYour payment for ${fdp.title} could not be processed. Please try again.`,
              });
            }
          }
        }
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ============= Communication Routes =============
apiRouter.post("/communications/bulk-email", authenticateAdmin, async (req: Request, res: Response) => {
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

apiRouter.post("/communications/bulk-whatsapp", authenticateAdmin, async (req: Request, res: Response) => {
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

// Send reminders to all paid participants of an FDP
apiRouter.post("/communications/send-reminders/:fdpId", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { fdpId } = req.params;
    const fdp = await storage.getFdpEvent(fdpId);
    if (!fdp) return res.status(404).json({ error: "FDP not found" });

    const faculty = await storage.getFacultyByFdp(fdpId);
    const confirmed = faculty.filter(f => f.paymentStatus === "completed");

    let sent = 0;
    for (const fac of confirmed) {
      await sendEmail({
        to: fac.email,
        subject: `Reminder: ${fdp.title} starts soon`,
        html: `
          <h2>FDP Reminder</h2>
          <p>Dear ${fac.name},</p>
          <p>This is a reminder that <strong>${fdp.title}</strong> starts on <strong>${format(new Date(fdp.startDate), "MMM dd, yyyy")}</strong>.</p>
          ${fdp.joiningLink ? `<p>Joining Link: <a href="${fdp.joiningLink}">${fdp.joiningLink}</a></p>` : ""}
        `,
      });

      if (fac.whatsapp) {
        await sendWhatsAppMessage({
          to: fac.whatsapp,
          message: `📅 Reminder: ${fdp.title} starts on ${format(new Date(fdp.startDate), "MMM dd, yyyy")}. ${fdp.joiningLink ? `Join: ${fdp.joiningLink}` : ""}`.trim(),
        });
      }

      await storage.createCommunicationLog({
        fdpId,
        recipientType: "faculty",
        recipientId: fac.id,
        channel: "email",
        messageType: "reminder",
        recipient: fac.email,
        content: `Reminder for ${fdp.title}`,
        status: "sent",
        sentAt: new Date(),
      });

      if (fac.whatsapp) {
        await storage.createCommunicationLog({
          fdpId,
          recipientType: "faculty",
          recipientId: fac.id,
          channel: "whatsapp",
          messageType: "reminder",
          recipient: fac.whatsapp,
          content: `Reminder for ${fdp.title}`,
          status: "sent",
          sentAt: new Date(),
        });
      }

      sent++;
    }

    res.json({ success: true, sent });
  } catch (error) {
    console.error("Reminder send error:", error);
    res.status(500).json({ error: "Failed to send reminders" });
  }
});

// Share community link with all confirmed participants
apiRouter.post("/communications/share-community/:fdpId", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { fdpId } = req.params;
    const fdp = await storage.getFdpEvent(fdpId);
    if (!fdp) return res.status(404).json({ error: "FDP not found" });

    const faculty = await storage.getFacultyByFdp(fdpId);
    const confirmed = faculty.filter(f => f.paymentStatus === "completed");

    let sent = 0;
    for (const fac of confirmed) {
      if (fdp.communityLink) {
        await sendEmail({
          to: fac.email,
          subject: `Community updates for ${fdp.title}`,
          html: `<p>Join the community for updates: <a href="${fdp.communityLink}">${fdp.communityLink}</a></p>`,
        });
        if (fac.whatsapp) {
          await sendWhatsAppMessage({
            to: fac.whatsapp,
            message: `🔔 Community updates for ${fdp.title}: ${fdp.communityLink}`,
          });
        }
        sent++;
      }
    }

    res.json({ success: true, sent });
  } catch (error) {
    res.status(500).json({ error: "Failed to share community link" });
  }
});

// Share feedback form with all confirmed participants
apiRouter.post("/communications/share-feedback/:fdpId", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { fdpId } = req.params;
    const fdp = await storage.getFdpEvent(fdpId);
    if (!fdp) return res.status(404).json({ error: "FDP not found" });

    const faculty = await storage.getFacultyByFdp(fdpId);
    const confirmed = faculty.filter(f => f.paymentStatus === "completed");

    let sent = 0;
    for (const fac of confirmed) {
      if (fdp.feedbackFormLink) {
        await sendEmail({
          to: fac.email,
          subject: `Feedback requested for ${fdp.title}`,
          html: `<p>Please submit your feedback: <a href="${fdp.feedbackFormLink}">${fdp.feedbackFormLink}</a></p>`,
        });
        if (fac.whatsapp) {
          await sendWhatsAppMessage({
            to: fac.whatsapp,
            message: `📝 Please submit feedback for ${fdp.title}: ${fdp.feedbackFormLink}`,
          });
        }
        sent++;
      }
    }

    res.json({ success: true, sent });
  } catch (error) {
    res.status(500).json({ error: "Failed to share feedback link" });
  }
});

// ============= Analytics Routes =============
apiRouter.get("/fdp-events/:fdpId/analytics", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const analytics = await storage.getFdpAnalytics(req.params.fdpId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ============= Feedback Routes =============
// Mark feedback as completed and auto-generate certificate
apiRouter.post("/feedback/complete", async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.body;
    if (!facultyId) return res.status(400).json({ error: "facultyId is required" });

    const faculty = await storage.getFacultyRegistration(facultyId);
    if (!faculty) return res.status(404).json({ error: "Faculty registration not found" });

    // Update feedbackSubmitted flag
    await storage.updateFacultyRegistration(facultyId, { feedbackSubmitted: true });

    // Generate certificate only if payment completed and not already generated
    if (faculty.paymentStatus === "completed") {
      const existing = await storage.getCertificateByFacultyId(facultyId);
      if (!existing) {
        const fdp = await storage.getFdpEvent(faculty.fdpId);
        if (!fdp) return res.status(404).json({ error: "FDP event not found" });

        const certificateId = `CERT-${Date.now()}-${facultyId.slice(0, 8).toUpperCase()}`;
        
        let collegeLogo: string | undefined = undefined;
        if (faculty.hostCollegeId) {
          const host = await storage.getHostCollege(faculty.hostCollegeId);
          collegeLogo = host?.logoUrl || undefined;
        }

        const certificateData: CertificateData = {
          participant_name: faculty.name, // Changed to snake_case
          fdp_title: fdp.title, // Changed to snake_case
          start_date: format(new Date(fdp.startDate), "MMM dd, yyyy"), // Changed to snake_case
          end_date: format(new Date(fdp.endDate), "MMM dd, yyyy"), // Changed to snake_case
          certificate_id: certificateId, // Changed to snake_case
          issue_date: format(new Date(), "MMM dd, yyyy"), // Changed to snake_case
          college_name: faculty.institution, // Changed to snake_case
          fdp_dates: `${format(new Date(fdp.startDate), "MMM dd, yyyy")} - ${format(new Date(fdp.endDate), "MMM dd, yyyy")}`, // Changed to snake_case
          organiser_logo: process.env.ORGANISER_LOGO_URL, // Changed to snake_case
          college_logo: collegeLogo, // Changed to snake_case
          signature_image: process.env.SIGNATURE_IMAGE_URL, // Changed to snake_case
        };

        // Prefer custom template from DB if set; fallback to default in code
        const dbTemplate = await storage.getDefaultCertificateTemplateFromDb();
        const templateHtml = dbTemplate?.htmlTemplate || getDefaultCertificateTemplate();
        const pdfBuffer = await generateCertificatePDF(certificateData, templateHtml);
        const fileName = `${certificateId}.pdf`;
        const certificateUrl = await saveCertificate(pdfBuffer, fileName);

        await storage.createCertificate({
          facultyId,
          fdpId: faculty.fdpId,
          certificateId,
          certificateUrl,
          issuedAt: new Date(),
        });

        await sendEmail({
          to: faculty.email,
          subject: `Certificate for ${fdp.title}`,
          html: `
            <h2>Congratulations ${faculty.name}!</h2>
            <p>Your certificate for <strong>${fdp.title}</strong> is ready.</p>
            <p>Certificate ID: ${certificateId}</p>
            <p><a href="${certificateUrl}">Download Certificate</a></p>
          `,
        });

        if (faculty.whatsapp) {
          await sendWhatsAppMessage({
            to: faculty.whatsapp,
            message: `🎓 Certificate ready for ${fdp.title}. ID: ${certificateId}. Download: ${certificateUrl}`,
          });
        }

        await storage.updateFacultyRegistration(facultyId, { certificateGenerated: true, certificateUrl });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Feedback completion error:", error);
    res.status(500).json({ error: "Failed to process feedback completion" });
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

// ============= Certificate Routes =============
apiRouter.post("/certificates/generate/:facultyId", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.params;
    
    const faculty = await storage.getFacultyRegistration(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty registration not found" });
    }
    
    const fdp = await storage.getFdpEvent(faculty.fdpId);
    if (!fdp) {
      return res.status(404).json({ error: "FDP event not found" });
    }
    
    const certificateId = `CERT-${Date.now()}-${facultyId.slice(0, 8).toUpperCase()}`;
    
    // Determine host college logo if available
    let collegeLogo: string | undefined = undefined;
    if (faculty.hostCollegeId) {
      const host = await storage.getHostCollege(faculty.hostCollegeId);
      collegeLogo = host?.logoUrl || undefined;
    }

    const certificateData: CertificateData = {
      participant_name: faculty.name, // Changed to snake_case
      fdp_title: fdp.title, // Changed to snake_case
      start_date: format(new Date(fdp.startDate), "MMM dd, yyyy"), // Changed to snake_case
      end_date: format(new Date(fdp.endDate), "MMM dd, yyyy"), // Changed to snake_case
      certificate_id: certificateId, // Changed to snake_case
      issue_date: format(new Date(), "MMM dd, yyyy"), // Changed to snake_case
      college_name: faculty.institution, // Changed to snake_case
      fdp_dates: `${format(new Date(fdp.startDate), "MMM dd, yyyy")} - ${format(new Date(fdp.endDate), "MMM dd, yyyy")}`, // Changed to snake_case
      organiser_logo: process.env.ORGANISER_LOGO_URL, // Changed to snake_case
      college_logo: collegeLogo, // Changed to snake_case
      signature_image: process.env.SIGNATURE_IMAGE_URL, // Changed to snake_case
    };
    
    // Prefer DB default template if available
    const dbTemplate = await storage.getDefaultCertificateTemplateFromDb();
    const template = dbTemplate?.htmlTemplate || getDefaultCertificateTemplate();
    const pdfBuffer = await generateCertificatePDF(certificateData, template);
    
    const fileName = `${certificateId}.pdf`;
    const certificateUrl = await saveCertificate(pdfBuffer, fileName);
    
    const certificate = await storage.createCertificate({
      facultyId,
      fdpId: faculty.fdpId,
      certificateId,
      certificateUrl,
      issuedAt: new Date(),
    });
    
    await sendEmail({
      to: faculty.email,
      subject: `Certificate for ${fdp.title}`,
      html: `
        <h2>Congratulations ${faculty.name}!</h2>
        <p>Your certificate for <strong>${fdp.title}</strong> is ready.</p>
        <p>Certificate ID: ${certificateId}</p>
        <p>You can download your certificate from the link below or it will be sent separately.</p>
      `,
    });
    
    res.json({ success: true, certificate });
  } catch (error) {
    console.error("Certificate generation error:", error);
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

apiRouter.get("/certificates/faculty/:facultyId", async (req: Request, res: Response) => {
  try {
    const certificate = await storage.getCertificateByFacultyId(req.params.facultyId);
    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch certificate" });
  }
});

apiRouter.post("/certificates/bulk-generate/:fdpId", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { fdpId } = req.params;
    
    const fdp = await storage.getFdpEvent(fdpId);
    if (!fdp) {
      return res.status(404).json({ error: "FDP event not found" });
    }
    
    const faculty = await storage.getFacultyByFdp(fdpId);
    const completedFaculty = faculty.filter(f => f.paymentStatus === "completed" && f.feedbackSubmitted && !f.certificateGenerated);
    
    const results: Array<{ facultyId: string; status: string; certificateId?: string; error?: string }> = [];
    
    for (const fac of completedFaculty) {
      try {
        const existingCert = await storage.getCertificateByFacultyId(fac.id);
        if (existingCert) {
          results.push({ facultyId: fac.id, status: "already_exists", certificateId: existingCert.certificateId });
          continue;
        }
        
        const certificateId = `CERT-${Date.now()}-${fac.id.slice(0, 8).toUpperCase()}`;
        
        let collegeLogo: string | undefined = undefined;
        if (fac.hostCollegeId) {
          const host = await storage.getHostCollege(fac.hostCollegeId);
          collegeLogo = host?.logoUrl || undefined;
        }

        const certificateData: CertificateData = {
          participant_name: fac.name, // Changed to snake_case
          fdp_title: fdp.title, // Changed to snake_case
          start_date: format(new Date(fdp.startDate), "MMM dd, yyyy"), // Changed to snake_case
          end_date: format(new Date(fdp.endDate), "MMM dd, yyyy"), // Changed to snake_case
          certificate_id: certificateId, // Changed to snake_case
          issue_date: format(new Date(), "MMM dd, yyyy"), // Changed to snake_case
          college_name: fac.institution, // Changed to snake_case
          fdp_dates: `${format(new Date(fdp.startDate), "MMM dd, yyyy")} - ${format(new Date(fdp.endDate), "MMM dd, yyyy")}`, // Changed to snake_case
          organiser_logo: process.env.ORGANISER_LOGO_URL, // Changed to snake_case
          college_logo: collegeLogo, // Changed to snake_case
          signature_image: process.env.SIGNATURE_IMAGE_URL, // Changed to snake_case
        };
        
        const dbTemplate = await storage.getDefaultCertificateTemplateFromDb();
        const template = dbTemplate?.htmlTemplate || getDefaultCertificateTemplate();
        const pdfBuffer = await generateCertificatePDF(certificateData, template);
        
        const fileName = `${certificateId}.pdf`;
        const certificateUrl = await saveCertificate(pdfBuffer, fileName);
        
        await storage.createCertificate({
          facultyId: fac.id,
          fdpId: fac.fdpId,
          certificateId,
          certificateUrl,
          issuedAt: new Date(),
        });

        await storage.updateFacultyRegistration(fac.id, { certificateGenerated: true, certificateUrl });
        
        await sendEmail({
          to: fac.email,
          subject: `Certificate for ${fdp.title}`,
          html: `
            <h2>Congratulations ${fac.name}!</h2>
            <p>Your certificate for <strong>${fdp.title}</strong> is ready.</p>
            <p>Certificate ID: ${certificateId}</p>
            <p><a href="${certificateUrl}">Download Certificate</a></p>
          `,
        });

        if (fac.whatsapp) {
          await sendWhatsAppMessage({
            to: fac.whatsapp,
            message: `🎓 Certificate ready for ${fdp.title}. ID: ${certificateId}. Download: ${certificateUrl}`,
          });
        }
        
        results.push({ facultyId: fac.id, status: "generated", certificateId });
      } catch (error) {
        console.error(`Error generating certificate for ${fac.id}:`, error);
        results.push({ facultyId: fac.id, status: "error", error: "Generation failed" });
      }
    }
    
    res.json({ 
      success: true, 
      total: completedFaculty.length,
      results 
    });
  } catch (error) {
    console.error("Bulk certificate generation error:", error);
    res.status(500).json({ error: "Failed to generate certificates" });
  }
});

export default apiRouter;

// ============= Certificate Template Routes =============
apiRouter.get("/certificate-templates", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const templates = await storage.listCertificateTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch certificate templates" });
  }
});

apiRouter.get("/certificate-templates/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const template = await storage.getCertificateTemplate(req.params.id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch certificate template" });
  }
});

apiRouter.post("/certificate-templates", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { name, htmlTemplate, organiserLogo, signatureImage, isDefault } = req.body;
    if (!name || !htmlTemplate) {
      return res.status(400).json({ error: "Name and HTML template are required" });
    }
    const template = await storage.createCertificateTemplate({
      name,
      htmlTemplate,
      organiserLogo,
      signatureImage,
      isDefault: !!isDefault,
    });
    if (isDefault) {
      await storage.setDefaultCertificateTemplate(template.id);
    }
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: "Failed to create certificate template" });
  }
});

apiRouter.put("/certificate-templates/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const template = await storage.updateCertificateTemplate(req.params.id, req.body);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: "Failed to update certificate template" });
  }
});

apiRouter.delete("/certificate-templates/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const success = await storage.deleteCertificateTemplate(req.params.id);
    if (!success) return res.status(404).json({ error: "Template not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete certificate template" });
  }
});

apiRouter.post("/certificate-templates/:id/default", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    await storage.setDefaultCertificateTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to set default template" });
  }
});