import { eq, and, desc, sql, ne } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../shared/schema";
import type {
  FdpEvent,
  InsertFdpEvent,
  HostCollege,
  InsertHostCollege,
  FacultyRegistration,
  InsertFacultyRegistration,
  Payment,
  InsertPayment,
  CommunicationLog,
  Certificate,
  Coupon,
} from "../shared/schema";

export interface IStorage {
  // FDP Events
  createFdpEvent(data: InsertFdpEvent): Promise<FdpEvent>;
  getFdpEvent(id: string): Promise<FdpEvent | undefined>;
  getAllFdpEvents(): Promise<FdpEvent[]>;
  getActiveFdpEvents(): Promise<FdpEvent[]>;
  updateFdpEvent(id: string, data: Partial<InsertFdpEvent>): Promise<FdpEvent | undefined>;
  deleteFdpEvent(id: string): Promise<boolean>;

  // Host Colleges
  createHostCollege(data: InsertHostCollege): Promise<HostCollege>;
  getHostCollege(id: string): Promise<HostCollege | undefined>;
  getHostCollegesByFdp(fdpId: string): Promise<HostCollege[]>;
  getAllHostColleges(): Promise<HostCollege[]>; // New method
  updateHostCollege(id: string, data: Partial<InsertHostCollege>): Promise<HostCollege | undefined>;
  
  // Faculty Registrations
  createFacultyRegistration(data: InsertFacultyRegistration): Promise<FacultyRegistration>;
  getFacultyRegistration(id: string): Promise<FacultyRegistration | undefined>;
  getFacultyByFdp(fdpId: string): Promise<FacultyRegistration[]>;
  getFacultyByHostCollege(hostCollegeId: string): Promise<FacultyRegistration[]>;
  getAllFacultyRegistrations(): Promise<FacultyRegistration[]>; // New method
  updateFacultyRegistration(id: string, data: Partial<InsertFacultyRegistration>): Promise<FacultyRegistration | undefined>;
  
  // Payments
  createPayment(data: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByOrderId(orderId: string): Promise<Payment | undefined>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  
  // Communication Logs
  createCommunicationLog(data: schema.InsertCommunicationLog): Promise<CommunicationLog>;
  getCommunicationLogsByFdp(fdpId: string): Promise<CommunicationLog[]>;
  
  // Certificates
  createCertificate(data: schema.InsertCertificate): Promise<Certificate>;
  getCertificateByFacultyId(facultyId: string): Promise<Certificate | undefined>;

  // Certificate templates
  listCertificateTemplates(): Promise<schema.CertificateTemplate[]>;
  getCertificateTemplate(id: string): Promise<schema.CertificateTemplate | undefined>;
  getDefaultCertificateTemplateFromDb(): Promise<schema.CertificateTemplate | undefined>;
  createCertificateTemplate(data: schema.InsertCertificateTemplate): Promise<schema.CertificateTemplate>;
  updateCertificateTemplate(id: string, data: Partial<schema.InsertCertificateTemplate>): Promise<schema.CertificateTemplate | undefined>;
  deleteCertificateTemplate(id: string): Promise<boolean>;
  setDefaultCertificateTemplate(id: string): Promise<void>;
  
  // Coupons
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  updateCoupon(id: string, data: Partial<schema.InsertCoupon>): Promise<Coupon | undefined>;
  
  // Analytics
  getFdpAnalytics(fdpId: string): Promise<{
    totalHostColleges: number;
    totalFaculty: number;
    totalRevenue: string;
    paymentsPending: number;
    paymentsCompleted: number;
    certificatesGenerated: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // FDP Events
  async createFdpEvent(data: InsertFdpEvent): Promise<FdpEvent> {
    const [event] = await db.insert(schema.fdpEvents).values(data).returning();
    return event;
  }

  async getFdpEvent(id: string): Promise<FdpEvent | undefined> {
    const [event] = await db.select().from(schema.fdpEvents).where(eq(schema.fdpEvents.id, id));
    return event;
  }

  async getAllFdpEvents(): Promise<FdpEvent[]> {
    return await db.select().from(schema.fdpEvents).orderBy(desc(schema.fdpEvents.createdAt));
  }

  async getActiveFdpEvents(): Promise<FdpEvent[]> {
    return await db.select().from(schema.fdpEvents)
      .where(eq(schema.fdpEvents.status, "upcoming"))
      .orderBy(schema.fdpEvents.startDate);
  }

  async updateFdpEvent(id: string, data: Partial<InsertFdpEvent>): Promise<FdpEvent | undefined> {
    const [event] = await db.update(schema.fdpEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.fdpEvents.id, id))
      .returning();
    return event;
  }

  async deleteFdpEvent(id: string): Promise<boolean> {
    const result = await db.delete(schema.fdpEvents).where(eq(schema.fdpEvents.id, id));
    return result.rowCount! > 0;
  }

  // Host Colleges
  async createHostCollege(data: InsertHostCollege): Promise<HostCollege> {
    const [college] = await db.insert(schema.hostColleges).values(data).returning();
    return college;
  }

  async getHostCollege(id: string): Promise<HostCollege | undefined> {
    const [college] = await db.select().from(schema.hostColleges).where(eq(schema.hostColleges.id, id));
    return college;
  }

  async getHostCollegesByFdp(fdpId: string): Promise<HostCollege[]> {
    return await db.select().from(schema.hostColleges)
      .where(eq(schema.hostColleges.fdpId, fdpId))
      .orderBy(desc(schema.hostColleges.registeredAt));
  }

  async getAllHostColleges(): Promise<HostCollege[]> {
    return await db.select().from(schema.hostColleges).orderBy(desc(schema.hostColleges.registeredAt));
  }

  async updateHostCollege(id: string, data: Partial<InsertHostCollege>): Promise<HostCollege | undefined> {
    const [college] = await db.update(schema.hostColleges)
      .set(data)
      .where(eq(schema.hostColleges.id, id))
      .returning();
    return college;
  }

  // Faculty Registrations
  async createFacultyRegistration(data: InsertFacultyRegistration): Promise<FacultyRegistration> {
    const [registration] = await db.insert(schema.facultyRegistrations).values(data).returning();
    return registration;
  }

  async getFacultyRegistration(id: string): Promise<FacultyRegistration | undefined> {
    const [registration] = await db.select().from(schema.facultyRegistrations)
      .where(eq(schema.facultyRegistrations.id, id));
    return registration;
  }

  async getFacultyByFdp(fdpId: string): Promise<FacultyRegistration[]> {
    return await db.select().from(schema.facultyRegistrations)
      .where(eq(schema.facultyRegistrations.fdpId, fdpId))
      .orderBy(desc(schema.facultyRegistrations.registeredAt));
  }

  async getFacultyByHostCollege(hostCollegeId: string): Promise<FacultyRegistration[]> {
    return await db.select().from(schema.facultyRegistrations)
      .where(eq(schema.facultyRegistrations.hostCollegeId, hostCollegeId))
      .orderBy(desc(schema.facultyRegistrations.registeredAt));
  }

  async getAllFacultyRegistrations(): Promise<FacultyRegistration[]> {
    return await db.select().from(schema.facultyRegistrations).orderBy(desc(schema.facultyRegistrations.registeredAt));
  }

  async updateFacultyRegistration(id: string, data: Partial<InsertFacultyRegistration>): Promise<FacultyRegistration | undefined> {
    const [registration] = await db.update(schema.facultyRegistrations)
      .set(data)
      .where(eq(schema.facultyRegistrations.id, id))
      .returning();
    return registration;
  }

  // Payments
  async createPayment(data: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(schema.payments).values(data).returning();
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, id));
    return payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId));
    return payment;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [payment] = await db.update(schema.payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.payments.id, id))
      .returning();
    return payment;
  }

  // Communication Logs
  async createCommunicationLog(data: schema.InsertCommunicationLog): Promise<CommunicationLog> {
    const [log] = await db.insert(schema.communicationLogs).values(data).returning();
    return log;
  }

  async getCommunicationLogsByFdp(fdpId: string): Promise<CommunicationLog[]> {
    return await db.select().from(schema.communicationLogs)
      .where(eq(schema.communicationLogs.fdpId, fdpId))
      .orderBy(desc(schema.communicationLogs.createdAt));
  }

  // Certificates
  async createCertificate(data: schema.InsertCertificate): Promise<Certificate> {
    const [certificate] = await db.insert(schema.certificates).values(data).returning();
    return certificate;
  }

  async getCertificateByFacultyId(facultyId: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(schema.certificates)
      .where(eq(schema.certificates.facultyId, facultyId));
    return certificate;
  }

  // Certificate templates
  async listCertificateTemplates() {
    return await db.select().from(schema.certificateTemplates).orderBy(desc(schema.certificateTemplates.updatedAt));
  }

  async getCertificateTemplate(id: string) {
    const [template] = await db
      .select()
      .from(schema.certificateTemplates)
      .where(eq(schema.certificateTemplates.id, id));
    return template;
  }

  async getDefaultCertificateTemplateFromDb() {
    const [template] = await db
      .select()
      .from(schema.certificateTemplates)
      .where(eq(schema.certificateTemplates.isDefault, true));
    return template;
  }

  async createCertificateTemplate(data: schema.InsertCertificateTemplate) {
    const [template] = await db.insert(schema.certificateTemplates).values(data).returning();
    return template;
  }

  async updateCertificateTemplate(id: string, data: Partial<schema.InsertCertificateTemplate>) {
    const [template] = await db
      .update(schema.certificateTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.certificateTemplates.id, id))
      .returning();
    return template;
  }

  async deleteCertificateTemplate(id: string) {
    const result = await db.delete(schema.certificateTemplates).where(eq(schema.certificateTemplates.id, id));
    return result.rowCount! > 0;
  }

  async setDefaultCertificateTemplate(id: string) {
    // Unset existing defaults
    await db.update(schema.certificateTemplates).set({ isDefault: false });
    // Set provided template as default
    await db
      .update(schema.certificateTemplates)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(schema.certificateTemplates.id, id));
  }

  // Template methods will be implemented when template management endpoints are added

  // Coupons
  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(schema.coupons)
      .where(and(
        eq(schema.coupons.code, code),
        eq(schema.coupons.isActive, true)
      ));
    return coupon;
  }

  async updateCoupon(id: string, data: Partial<schema.InsertCoupon>): Promise<Coupon | undefined> {
    const [coupon] = await db.update(schema.coupons)
      .set(data)
      .where(eq(schema.coupons.id, id))
      .returning();
    return coupon;
  }

  // Analytics
  async getFdpAnalytics(fdpId: string) {
    const [hostStats] = await db.select({
      count: sql<number>`count(*)::int`,
      revenue: sql<string>`COALESCE(SUM(amount_paid), 0)::text`
    })
    .from(schema.hostColleges)
    .where(and(
      eq(schema.hostColleges.fdpId, fdpId),
      eq(schema.hostColleges.paymentStatus, "completed")
    ));

    const [facultyStats] = await db.select({
      count: sql<number>`count(*)::int`,
      revenue: sql<string>`COALESCE(SUM(amount_paid), 0)::text`
    })
    .from(schema.facultyRegistrations)
    .where(and(
      eq(schema.facultyRegistrations.fdpId, fdpId),
      eq(schema.facultyRegistrations.paymentStatus, "completed")
    ));

    const [pendingPayments] = await db.select({ count: sql<number>`count(*)::int` })
      .from(schema.payments)
      .where(and(
        eq(schema.payments.fdpId, fdpId),
        eq(schema.payments.status, "pending")
      ));

    const [completedPayments] = await db.select({ count: sql<number>`count(*)::int` })
      .from(schema.payments)
      .where(and(
        eq(schema.payments.fdpId, fdpId),
        eq(schema.payments.status, "success")
      ));

    const [certificates] = await db.select({ count: sql<number>`count(*)::int` })
      .from(schema.certificates)
      .where(eq(schema.certificates.fdpId, fdpId));

    const totalRevenue = (parseFloat(hostStats.revenue || "0") + parseFloat(facultyStats.revenue || "0")).toFixed(2);

    return {
      totalHostColleges: hostStats.count || 0,
      totalFaculty: facultyStats.count || 0,
      totalRevenue,
      paymentsPending: pendingPayments.count || 0,
      paymentsCompleted: completedPayments.count || 0,
      certificatesGenerated: certificates.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();