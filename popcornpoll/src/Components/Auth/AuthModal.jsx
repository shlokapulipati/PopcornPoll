import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AuthModal = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    loginWithGoogle, 
    signUpWithEmail, 
    signInWithEmail 
  } = useAuth();

  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !username)) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, username);
        showToast("Account created successfully!", "success");
      } else {
        await signInWithEmail(email, password);
        showToast("Signed in successfully!", "success");
      }
      setAuthModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Authentication failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast("Signed in with Google successfully!", "success");
      setAuthModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Google sign in failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setUsername("");
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create an Account" : "Welcome Back"}</DialogTitle>
          <DialogDescription>
            {isSignUp 
              ? "Sign up to track, create, and share movie polls." 
              : "Sign in to access your polls and settings."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {isSignUp && (
            <div className="grid gap-2">
              <label htmlFor="auth-username" className="text-sm font-medium">Username</label>
              <Input
                id="auth-username"
                type="text"
                required
                placeholder="e.g. MovieBuff99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          <div className="grid gap-2">
            <label htmlFor="auth-email" className="text-sm font-medium">Email Address</label>
            <Input
              id="auth-email"
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="auth-password" className="text-sm font-medium">Password</label>
            <Input
              id="auth-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">OR</span>
          </div>
        </div>

        <Button 
          variant="outline"
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="w-full"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google logo" 
            className="mr-2 h-4 w-4"
          />
          Continue with Google
        </Button>

        <div className="text-center text-sm text-muted-foreground mt-4">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button" 
            className="underline underline-offset-4 hover:text-primary"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
