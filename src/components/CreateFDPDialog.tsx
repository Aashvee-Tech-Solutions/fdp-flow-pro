import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateFDPDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "NAAC",
    startDate: "",
    endDate: "",
    hostFee: "",
    facultyFee: "",
    maxParticipants: "",
    joiningLink: "",
    whatsappGroupLink: "",
    feedbackFormLink: "",
    bannerImage: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/fdp-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          hostFee: formData.hostFee,
          facultyFee: formData.facultyFee,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "FDP event created successfully",
        });
        setOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "NAAC",
          startDate: "",
          endDate: "",
          hostFee: "",
          facultyFee: "",
          maxParticipants: "",
          joiningLink: "",
          whatsappGroupLink: "",
          feedbackFormLink: "",
          bannerImage: "",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/fdp-events"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create FDP event",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create FDP event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" data-testid="button-create-fdp">
          <Calendar className="h-4 w-4 mr-2" />
          Create New FDP
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New FDP Event</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new faculty development program
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                data-testid="input-fdp-title"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="input-fdp-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-secondary border border-border"
                required
                data-testid="select-fdp-category"
              >
                <option value="NAAC">NAAC</option>
                <option value="NBA">NBA</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                data-testid="input-fdp-max-participants"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                data-testid="input-fdp-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                data-testid="input-fdp-end-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostFee">Host Fee (₹) *</Label>
              <Input
                id="hostFee"
                type="number"
                step="0.01"
                value={formData.hostFee}
                onChange={(e) => setFormData({ ...formData, hostFee: e.target.value })}
                required
                data-testid="input-fdp-host-fee"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facultyFee">Faculty Fee (₹) *</Label>
              <Input
                id="facultyFee"
                type="number"
                step="0.01"
                value={formData.facultyFee}
                onChange={(e) => setFormData({ ...formData, facultyFee: e.target.value })}
                required
                data-testid="input-fdp-faculty-fee"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="joiningLink">Joining Link (Zoom/Meet)</Label>
              <Input
                id="joiningLink"
                type="url"
                value={formData.joiningLink}
                onChange={(e) => setFormData({ ...formData, joiningLink: e.target.value })}
                placeholder="https://zoom.us/j/..."
                data-testid="input-fdp-joining-link"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="whatsappGroupLink">WhatsApp Group Link</Label>
              <Input
                id="whatsappGroupLink"
                type="url"
                value={formData.whatsappGroupLink}
                onChange={(e) => setFormData({ ...formData, whatsappGroupLink: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                data-testid="input-fdp-whatsapp-link"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="feedbackFormLink">Feedback Form Link</Label>
              <Input
                id="feedbackFormLink"
                type="url"
                value={formData.feedbackFormLink}
                onChange={(e) => setFormData({ ...formData, feedbackFormLink: e.target.value })}
                placeholder="https://forms.google.com/..."
                data-testid="input-fdp-feedback-link"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} data-testid="button-submit-fdp">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create FDP
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
