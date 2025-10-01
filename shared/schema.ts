import { pgTable, text, varchar, integer, timestamp, boolean, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomUUID } from "crypto";

// FDP Events Table
export const fdpEvents = pgTable("fdp_events", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // NAAC, NBA, etc.
  bannerImage: text("banner_image"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  hostFee: decimal("host_fee", { precision: 10, scale: 2 }).notNull(),
  facultyFee: decimal("faculty_fee", { precision: 10, scale: 2 }).notNull(),
  maxParticipants: integer("max_participants"),
  status: varchar("status", { length: 50 }).notNull().default("upcoming"), // upcoming, ongoing, completed, cancelled
  joiningLink: text("joining_link"),
  communityLink: text("community_link"),
  whatsappGroupLink: text("whatsapp_group_link"),
  feedbackFormLink: text("feedback_form_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Host Colleges Table
export const hostColleges = pgTable("host_colleges", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  fdpId: text("fdp_id").references(() => fdpEvents.id).notNull(),
  collegeName: varchar("college_name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  website: varchar("website", { length: 255 }),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }),
  logoUrl: text("logo_url"),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"), // pending, completed, failed, refunded
  paymentId: varchar("payment_id", { length: 255 }),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
});

// Faculty Registrations Table
export const facultyRegistrations = pgTable("faculty_registrations", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  fdpId: text("fdp_id").references(() => fdpEvents.id).notNull(),
  hostCollegeId: text("host_college_id").references(() => hostColleges.id),
  registrationType: varchar("registration_type", { length: 50 }).notNull(), // host_college, individual
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }),
  designation: varchar("designation", { length: 100 }),
  department: varchar("department", { length: 100 }),
  institution: varchar("institution", { length: 255 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"),
  paymentId: varchar("payment_id", { length: 255 }),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  feedbackSubmitted: boolean("feedback_submitted").default(false),
  certificateGenerated: boolean("certificate_generated").default(false),
  certificateUrl: text("certificate_url"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
});

// Payments Table
export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  orderId: varchar("order_id", { length: 255 }).notNull().unique(),
  paymentId: varchar("payment_id", { length: 255 }),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // host_college, faculty
  entityId: text("entity_id").notNull(),
  fdpId: text("fdp_id").references(() => fdpEvents.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),
  status: varchar("status", { length: 50 }).notNull().default("created"), // created, pending, success, failed, refunded
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentGateway: varchar("payment_gateway", { length: 50 }).default("cashfree"),
  gatewayResponse: json("gateway_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Communication Logs Table
export const communicationLogs = pgTable("communication_logs", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  fdpId: text("fdp_id").references(() => fdpEvents.id),
  recipientType: varchar("recipient_type", { length: 50 }).notNull(), // host_college, faculty, all
  recipientId: text("recipient_id"),
  channel: varchar("channel", { length: 50 }).notNull(), // email, whatsapp
  messageType: varchar("message_type", { length: 100 }), // confirmation, reminder, certificate, etc.
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, sent, failed
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Certificates Table
export const certificates = pgTable("certificates", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  facultyId: text("faculty_id").references(() => facultyRegistrations.id).notNull(),
  fdpId: text("fdp_id").references(() => fdpEvents.id).notNull(),
  certificateUrl: text("certificate_url"),
  participantName: varchar("participant_name", { length: 255 }).notNull(),
  collegeName: varchar("college_name", { length: 255 }),
  fdpTitle: varchar("fdp_title", { length: 255 }).notNull(),
  fdpDates: varchar("fdp_dates", { length: 100 }),
  organiserLogo: text("organiser_logo"),
  collegeLogo: text("college_logo"),
  signatureImage: text("signature_image"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// Certificate Templates Table
export const certificateTemplates = pgTable("certificate_templates", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  htmlTemplate: text("html_template").notNull(),
  organiserLogo: text("organiser_logo"),
  signatureImage: text("signature_image"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Coupons Table
export const coupons = pgTable("coupons", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  code: varchar("code", { length: 100 }).notNull().unique(),
  fdpId: text("fdp_id").references(() => fdpEvents.id),
  discountType: varchar("discount_type", { length: 50 }).notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin Users Table
export const adminUsers = pgTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertFdpEventSchema = createInsertSchema(fdpEvents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHostCollegeSchema = createInsertSchema(hostColleges).omit({ id: true, registeredAt: true });
export const insertFacultyRegistrationSchema = createInsertSchema(facultyRegistrations).omit({ id: true, registeredAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({ id: true, createdAt: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, generatedAt: true });
export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true });

// Types
export type FdpEvent = typeof fdpEvents.$inferSelect;
export type InsertFdpEvent = z.infer<typeof insertFdpEventSchema>;
export type HostCollege = typeof hostColleges.$inferSelect;
export type InsertHostCollege = z.infer<typeof insertHostCollegeSchema>;
export type FacultyRegistration = typeof facultyRegistrations.$inferSelect;
export type InsertFacultyRegistration = z.infer<typeof insertFacultyRegistrationSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
