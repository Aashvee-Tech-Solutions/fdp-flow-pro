import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

const FacultyRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    institution: "",
    registrationType: "individual",
    hostCollege: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const registrationData = {
        fdpId: id!,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.phone,
        designation: formData.designation,
        department: formData.department,
        institution: formData.institution,
        registrationType: formData.registrationType,
        hostCollegeId: formData.registrationType === "host" ? formData.hostCollege : null,
        paymentStatus: "pending",
      };

      const response = await fetch("/api/faculty-registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Faculty Registration</h1>
            <p className="text-muted-foreground">Register as an individual participant for the FDP program</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="registrationType">Registration Type *</Label>
                <Select
                  value={formData.registrationType}
                  onValueChange={(value) => setFormData({ ...formData, registrationType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Registration</SelectItem>
                    <SelectItem value="host">Under Host College</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.registrationType === "host" && (
                <div className="space-y-2">
                  <Label htmlFor="hostCollege">Select Host College *</Label>
                  <Select
                    value={formData.hostCollege}
                    onValueChange={(value) => setFormData({ ...formData, hostCollege: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose host college" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="college1">ABC Engineering College</SelectItem>
                      <SelectItem value="college2">XYZ Institute of Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@domain.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number *</Label>
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

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    placeholder="e.g., Assistant Professor"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Computer Science"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution/College Name *</Label>
                <Input
                  id="institution"
                  placeholder="Enter your institution name"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                />
              </div>

              <div className="bg-secondary/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Faculty Registration Fee</h3>
                    <p className="text-sm text-muted-foreground">Per participant</p>
                  </div>
                  <div className="text-3xl font-bold text-accent">₹1,500</div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Access to all sessions and materials
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Official certificate of completion
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Community group access
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

export default FacultyRegistration;
