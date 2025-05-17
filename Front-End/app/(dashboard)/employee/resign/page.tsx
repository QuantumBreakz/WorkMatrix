"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseBrowser } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function ResignPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResignation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a resignation.", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for your resignation.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowser();

    try {
      // Check if there's already a pending or processed resignation for this user
      const { data: existingResignation, error: fetchError } = await supabase
        .from('resignations')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['pending_review', 'processed'])
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingResignation) {
        toast({
          title: "Resignation Already Submitted",
          description: `You have already submitted a resignation with status: ${existingResignation.status}. Please contact HR for more information.`,
          variant: "default",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('resignations').insert({
        user_id: user.id,
        reason: reason.trim(),
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Resignation Submitted",
        description: "Your resignation request has been submitted for review. HR will contact you shortly.",
      });
      setReason(''); // Clear the form
      // Optionally redirect or disable form further
      // router.push('/(dashboard)/employee/profile'); 
    } catch (error: any) {
      console.error('Error submitting resignation:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred while submitting your resignation.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    // This should ideally be handled by layout or auth provider redirects
    return (
      <div className="container mx-auto p-6">
         <Card>
          <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
          <CardContent><p>Please log in to access this page.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Resignation</CardTitle>
          <CardDescription>
            We are sorry to see you go. Please provide your reason for resignation below. 
            This will be submitted to HR for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitResignation} className="space-y-6">
            <div>
              <Label htmlFor="reason">Reason for Resignation</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please state your reasons for leaving..."
                rows={6}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !reason.trim()}>
                {isSubmitting ? 'Submitting...' : 'Submit Resignation Request'}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Upon submission, your request will be sent to Human Resources. They will contact you regarding the next steps, including your last working day and exit formalities. If you have any immediate questions, please reach out to your manager or HR directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 
