"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks";
import { getSupabaseBrowser } from "@/lib/supabase";

// Define a type for Perk, assuming a structure
interface Perk {
  id: string;
  name: string;
  description: string;
  // eligibility_criteria?: string; // Example of other fields
  // redemption_details?: string;
}

export default function EmployeePerksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availablePerks, setAvailablePerks] = useState<Perk[]>([]);
  const [isLoadingPerks, setIsLoadingPerks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({}); // Track submitting state per perk

  // Fetch available perks
  useEffect(() => {
    const fetchPerks = async () => {
      setIsLoadingPerks(true);
      const supabase = getSupabaseBrowser();
      try {
        const { data, error } = await supabase
          .from("available_perks") // Make sure this table name is correct
          .select("id, name, description") // Select only needed fields, or "*"
          .eq("is_active", true); // Optionally filter for active perks

        if (error) {
          console.error("Error fetching perks:", error);
          toast({ title: "Error", description: "Failed to load available perks.", variant: "destructive" });
          setAvailablePerks([]);
        } else {
          setAvailablePerks(data || []);
        }
      } catch (e: any) {
        console.error("Unexpected error fetching perks:", e);
        toast({ title: "Error", description: "An unexpected error occurred while fetching perks.", variant: "destructive" });
      } finally {
        setIsLoadingPerks(false);
      }
    };

    fetchPerks();
  }, [toast]);

  const handleClaimPerk = async (perkId: string, perkName: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to claim a perk.", variant: "destructive" });
      return;
    }
    setIsSubmitting(prev => ({ ...prev, [perkId]: true }));
    const supabase = getSupabaseBrowser();

    try {
      const { error } = await supabase.from("claimed_perks_requests").insert({
        user_id: user.id,
        perk_id: perkId,
        status: "pending_approval", // Or directly "claimed" if no approval needed
        // requested_at will be set by default value in database (e.g., now())
      });

      if (error) {
        console.error(`Error claiming perk ${perkName}:`, error);
        toast({ title: "Error", description: `Failed to claim perk '${perkName}': ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Request to claim '${perkName}' submitted successfully.` });
        // Optionally, you might want to re-fetch perks or update UI to show it's claimed/pending
      }
    } catch (e: any) {
      console.error("Unexpected error claiming perk:", e);
      toast({ title: "Error", description: "An unexpected error occurred while claiming the perk.", variant: "destructive" });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [perkId]: false }));
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Perks & Benefits</CardTitle>
          <CardDescription>
            Explore and claim available company perks and benefits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingPerks ? (
            <div className="flex justify-center items-center h-40">
              {/* You can use a spinner component here */}
              <p>Loading available perks...</p>
            </div>
          ) : availablePerks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePerks.map((perk) => (
                <Card key={perk.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{perk.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{perk.description}</p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button 
                      onClick={() => handleClaimPerk(perk.id, perk.name)}
                      disabled={isSubmitting[perk.id] || !user}
                      className="w-full"
                    >
                      {isSubmitting[perk.id] ? "Processing..." : "Claim Perk / Request Info"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No company perks are currently listed or available to you.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
