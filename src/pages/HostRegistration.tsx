import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Building2, Upload } from "lucide-react";
import { toast } from "sonner";

const HostRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    collegeName: "",
    address: "",
    website: "",
    contactPerson: "",
    email: "",
    phone: "",
    logo: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("fdpId", id!);
      formDataToSend.append("collegeName", formData.collegeName);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("website", formData.website);
      formDataToSend.append("contactPerson", formData.contactPerson);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("whatsapp", formData.phone);
      formDataToSend.append("paymentStatus", "pending");
      
      if (formData.logo) {
        formDataToSend.append("logo", formData.logo);
      }

      const response = await fetch("/api/host-colleges", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const result = await response.json();
      
      toast.success("Registration created! Redirecting to payment gateway...");
      
      // Redirect to Cashfree payment page
      if (result.paymentOrder?.paymentLink) {
        window.location.href = result.paymentOrder.paymentLink;
      } else {
        throw new Error("Payment link not received");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, logo: e.target.files[0] });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Host College Registration</h1>
            <p className="text-muted-foreground">Register your institution for the FDP program</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="collegeName">College/Institution Name *</Label>
                <Input
                  id="collegeName"
                  placeholder="Enter college name"
                  required
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter complete address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person Name *</Label>
                <Input
                  id="contactPerson"
                  placeholder="Full name of contact person"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Official Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@college.edu"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">College Logo *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="logo" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {formData.logo ? formData.logo.name : "Click to upload college logo (PNG, JPG)"}
                    </p>
                  </label>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Host College Fee</h3>
                    <p className="text-sm text-muted-foreground">One-time registration fee</p>
                  </div>
                  <div className="text-3xl font-bold text-primary">₹5,000</div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Host college branding in all communications
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Logo on certificates
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Dashboard access to track faculty registrations
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HostRegistration;
