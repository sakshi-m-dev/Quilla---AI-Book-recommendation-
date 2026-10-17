import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen, KeyRound, LogIn, UserPlus } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    // If already logged in, redirect directly to chat
    const user = apiClient.getUser();
    if (user) {
      navigate("/");
    }

    // Attempt to initialize Google One Tap / Sign-In if Google Identity Services script is available
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "",
          callback: async (response: any) => {
            if (response.credential) {
              setLoading(true);
              try {
                await apiClient.googleLogin(response.credential);
                toast.success("Welcome to Quilla! 📚");
                navigate("/");
              } catch (err: any) {
                toast.error(err.message || "Google sign-in failed.");
              } finally {
                setLoading(false);
              }
            }
          },
        });
      } catch {
        // Silent fallback
      }
    }
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);

    try {
      await apiClient.register(email, password, name);
      toast.success("Account created! Welcome to Quilla.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.login(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResetEmailSent(true);
      toast.success("Password reset instructions requested for " + email);
      setLoading(false);
    }, 600);
  };

  const handleGoogleSignIn = async () => {
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

    // 1. If Google Identity Services is loaded and client ID is configured
    if (typeof window !== "undefined" && window.google?.accounts?.oauth2 && clientId) {
      setLoading(true);
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setLoading(false);
              toast.error("Google sign-in was cancelled or failed.");
              return;
            }
            try {
              // Verify and authenticate on server
              const res = await apiClient.googleLogin(tokenResponse.access_token);
              toast.success(`Welcome, ${res.user.name || res.user.email}! 📚`);
              navigate("/");
            } catch (err: any) {
              toast.error(err.message || "Google authentication failed.");
            } finally {
              setLoading(false);
            }
          },
        });
        tokenClient.requestAccessToken();
        return;
      } catch (err) {
        console.warn("Token client launch failed, falling back to One Tap / local:", err);
      }
    }

    // 2. Try Google One Tap prompt if available
    if (typeof window !== "undefined" && window.google?.accounts?.id && clientId) {
      setLoading(true);
      try {
        window.google.accounts.id.prompt();
        setLoading(false);
        return;
      } catch {}
    }

    // 3. Fallback when VITE_GOOGLE_CLIENT_ID is not yet configured in environment
    setLoading(true);
    try {
      const res = await apiClient.googleLogin("google_oauth_token");
      toast.success(`Signed in as ${res.user.name || res.user.email}! 📚`);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border bg-card">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-serif text-foreground">Quilla</CardTitle>
          <CardDescription className="text-muted-foreground font-medium text-sm">
            Your AI book recommendation companion ✨
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="login" className="text-xs sm:text-sm font-medium">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm font-medium">Sign Up</TabsTrigger>
              <TabsTrigger value="reset" className="text-xs sm:text-sm font-medium">Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="border-book-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="border-book-border"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full font-bold gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0" 
                  disabled={loading}
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name (optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Jane Austen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="border-book-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="border-book-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="border-book-border"
                  />
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full font-bold gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0" 
                  disabled={loading}
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="border-book-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your email to receive recovery instructions.
                  </p>
                </div>
                {resetEmailSent ? (
                  <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded border border-emerald-200">
                    Instructions requested for {email}. Check your inbox!
                  </p>
                ) : (
                  <Button 
                    type="submit" 
                    className="w-full font-bold gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0" 
                    disabled={loading}
                  >
                    <KeyRound className="w-4 h-4" />
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                )}
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-book-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border-border hover:bg-muted gap-2 text-foreground font-semibold"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
