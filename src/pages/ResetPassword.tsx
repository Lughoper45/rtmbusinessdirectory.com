import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Get token from URL hash (Supabase format) or search params
  const [token, setToken] = useState<string | null>(null);
  const email = searchParams.get("email");

  useEffect(() => {
    // Check hash for access_token (Supabase default format)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        setToken(accessToken);
        return;
      }
    }

    // Check search params as fallback
    const urlToken = searchParams.get("token") || searchParams.get("access_token");
    if (urlToken) {
      setToken(urlToken);
      return;
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" && session?.access_token) {
        setToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if token exists (timeout after 3 seconds)
  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => {
        toast.error("Invalid or expired reset link");
        navigate("/auth");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [token, navigate]);

  // Show loading while waiting for token
  if (!token) {
    return (
      <>
        <Helmet>
          <title>Set New Password | RTM Business Directory</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-muted/50 to-background flex flex-col items-center justify-center p-4">
          <Card className="shadow-heavy max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      setErrors({ password: passwordResult.error.errors[0].message });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }

    setIsLoading(true);

    try {
      // Set the session with the token
      if (token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token,
        });

        if (sessionError) {
          toast.error("Session error: " + sessionError.message);
          setIsLoading(false);
          return;
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        toast.success("Password updated successfully!");
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
    
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <>
        <Helmet>
          <title>Password Updated | RTM Business Directory</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-muted/50 to-background flex flex-col items-center justify-center p-4">
          <Card className="shadow-heavy max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Password Updated!</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully reset. Redirecting you to sign in...
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Set New Password | RTM Business Directory</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-muted/50 to-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <img src="/rtm logo.png" alt="RTM Business Directory" className="h-12 w-auto" />
          </div>

          <Card className="shadow-heavy">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <CardDescription>
                {email ? `Resetting password for ${decodeURIComponent(email)}` : "Enter your new password below"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;