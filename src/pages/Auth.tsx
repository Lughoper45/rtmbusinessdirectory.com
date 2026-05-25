import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);

type AuthMode = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [token, setToken] = useState<string | null>(null);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const redirectTo = (() => {
    const params = new URLSearchParams(location.search);
    const rawTarget = params.get("redirectTo") ?? params.get("returnUrl");
    if (!rawTarget || !rawTarget.startsWith("/")) {
      return import.meta.env.VITE_APP_SURFACE === "grow" ? "/workspace" : "/dashboard";
    }
    return rawTarget;
  })();

  // Check for reset token on mount
  useEffect(() => {
    // Check URL search params (our custom format)
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const urlToken = params.get("token");
    const urlEmail = params.get("email");

    if (type === "recovery" && urlToken) {
      setMode("reset");
      setToken(urlToken);
      if (urlEmail) setTokenEmail(decodeURIComponent(urlEmail));
      return;
    }

    // Check hash params (Supabase default format)
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      const hashParams = new URLSearchParams(hash.split('?')[1] || '');
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        setMode("reset");
        setToken(accessToken);
      }
      return;
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        return;
      }
      if (event === "SIGNED_IN" && session?.user && mode !== "reset") {
        setTimeout(() => navigate(redirectTo, { replace: true }), 100);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mode !== "reset") {
        setTimeout(() => navigate(redirectTo, { replace: true }), 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [mode, navigate, redirectTo]);

  const validateEmail = () => {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return false;
    }
    setErrors({});
    return true;
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);

    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      toast.error(getAuthErrorMessage(error));
    } else {
      toast.success("Welcome back!");
      // Small delay to ensure session is set before navigation
      setTimeout(() => navigate(redirectTo, { replace: true }), 100);
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    const emailConfirmRedirect = `${window.location.origin}/auth`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: emailConfirmRedirect,
        data: { full_name: "" },
      },
    });

    if (error) {
      toast.error(getAuthErrorMessage(error));
    } else if (data.session) {
      toast.success("Account created! Welcome.");
      setTimeout(() => navigate(redirectTo, { replace: true }), 100);
    } else {
      toast.success(
        "Account created! Check your email for a confirmation link, then sign in.",
        { duration: 8000 },
      );
      setMode("login");
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);

    try {
      // Use our custom branded email function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to send reset email");
      } else {
        toast.success("Password reset link sent! Check your email.");
        setMode("login");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      setErrors({ password: passwordResult.error.errors[0].message });
      return;
    }
    setErrors({});

    setIsLoading(true);

    // If we have a token, use it to set the session first
    if (token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token, // Use same token as refresh
      });

      if (sessionError) {
        toast.error(getAuthErrorMessage(sessionError));
        setIsLoading(false);
        return;
      }
    }

    // Now update the password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(getAuthErrorMessage(error));
    } else {
      toast.success("Password updated successfully!");
      // Clear URL params
      window.history.replaceState({}, "", "/auth");
      navigate("/");
    }
    setIsLoading(false);
  };

  if (mode === "reset") {
    return (
      <>
        <Helmet>
          <title>Set New Password | RTM Business Directory</title>
          <meta name="description" content="Set a new password for your RTM Business Directory account." />
        </Helmet>

        <div className="min-h-screen bg-gradient-to-br from-muted/50 to-background flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-center gap-2 mb-8">
              <img src="/rtm logo.png" alt="RTM Business Directory" className="h-12 w-auto" />
            </div>

            <Card className="shadow-heavy">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Set New Password</CardTitle>
                <CardDescription>
                  {tokenEmail ? `Resetting password for ${tokenEmail}` : "Enter your new password below"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
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
  }

  if (mode === "forgot") {
    return (
      <>
        <Helmet>
          <title>Reset Password | RTM Business Directory</title>
          <meta name="description" content="Reset your RTM Business Directory account password." />
        </Helmet>

        <div className="min-h-screen bg-gradient-to-br from-muted/50 to-background flex flex-col items-center justify-center p-4">
          <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-center gap-2 mb-8">
              <img src="/rtm logo.png" alt="RTM Business Directory" className="h-12 w-auto" />
            </div>

            <Card className="shadow-heavy">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setMode("login")}
                  >
                    Back to Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign In | RTM Business Directory</title>
        <meta name="description" content="Sign in or create an account to access AI-powered business tools on RTM Business Directory." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-muted/50 to-background flex flex-col items-center justify-center p-4">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

          <div className="w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-center gap-2 mb-8">
              <img src="/rtm logo.png" alt="RTM Business Directory" className="h-12 w-auto" />
            </div>

          <Card className="shadow-heavy">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in to access AI-powered business tools</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Minimum 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
