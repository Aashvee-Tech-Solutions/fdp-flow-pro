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
    
    console.log("Login attempt - Email received:", email);
    console.log("Expected admin email:", process.env.ADMIN_EMAIL);
    console.log("Email match:", email === process.env.ADMIN_EMAIL);
    console.log("Password received length:", password?.length);
    console.log("Expected password length:", process.env.ADMIN_PASSWORD?.length);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const token = generateAdminToken(email, password);
    
    if (token) {
      console.log("✅ Login successful for:", email);
      res.json({ 
        success: true, 
        token,
        email 
      });
    } else {
      console.log("❌ Login failed - Invalid credentials");
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
            
            // Send success WhatsApp
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
    
    const certificateData: CertificateData = {
      participantName: faculty.name,
      fdpTitle: fdp.title,
      startDate: format(new Date(fdp.startDate), "MMM dd, yyyy"),
      endDate: format(new Date(fdp.endDate), "MMM dd, yyyy"),
      certificateId,
      issueDate: format(new Date(), "MMM dd, yyyy"),
    };
    
    const template = getDefaultCertificateTemplate();
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
    const completedFaculty = faculty.filter(f => f.paymentStatus === "completed");
    
    const results: Array<{ facultyId: string; status: string; certificateId?: string; error?: string }> = [];
    
    for (const fac of completedFaculty) {
      try {
        const existingCert = await storage.getCertificateByFacultyId(fac.id);
        if (existingCert) {
          results.push({ facultyId: fac.id, status: "already_exists", certificateId: existingCert.certificateId });
          continue;
        }
        
        const certificateId = `CERT-${Date.now()}-${fac.id.slice(0, 8).toUpperCase()}`;
        
        const certificateData: CertificateData = {
          participantName: fac.name,
          fdpTitle: fdp.title,
          startDate: format(new Date(fdp.startDate), "MMM dd, yyyy"),
          endDate: format(new Date(fdp.endDate), "MMM dd, yyyy"),
          certificateId,
          issueDate: format(new Date(), "MMM dd, yyyy"),
        };
        
        const template = getDefaultCertificateTemplate();
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
        
        await sendEmail({
          to: fac.email,
          subject: `Certificate for ${fdp.title}`,
          html: `
            <h2>Congratulations ${fac.name}!</h2>
            <p>Your certificate for <strong>${fdp.title}</strong> is ready.</p>
            <p>Certificate ID: ${certificateId}</p>
          `,
        });
        
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
