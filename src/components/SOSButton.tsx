import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendSOS } from "@/lib/api";

const SOSButton = () => {
  const [loading, setLoading] = useState(false);

  const handleSOS = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          await sendSOS(location);
          
          toast.success("SOS sent successfully!", {
            description: "Help is on the way. Stay safe!",
          });
        } catch (error) {
          toast.error("Failed to send SOS", {
            description: "Please try again or call emergency services directly.",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        toast.error("Could not get your location", {
          description: "Please enable location services and try again.",
        });
      }
    );
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-float">
      <Button
        onClick={handleSOS}
        disabled={loading}
        size="lg"
        className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl transition-all animate-pulse-glow"
      >
        <AlertCircle className="w-8 h-8" />
      </Button>
    </div>
  );
};

export default SOSButton;
