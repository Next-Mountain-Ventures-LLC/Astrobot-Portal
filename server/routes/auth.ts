import { RequestHandler } from "express";
import { AuthRequest, AuthResponse } from "@shared/api";

// Supabase authentication via Admin API
async function authenticateWithSupabase(email: string, password: string) {
  try {
    const supabaseUrl = "https://uzeuhsydjnjsykqvxvkk.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_KEY not configured");
    }

    // Use Supabase REST API to authenticate
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || "Authentication failed");
    }

    const data = await response.json();
    return {
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.name || email.split("@")[0],
      token: data.access_token,
    };
  } catch (error: any) {
    console.error("[Auth] Supabase authentication error:", error.message);
    throw error;
  }
}

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as AuthRequest;

    // Validate input
    if (!email || !password) {
      console.error("[Auth] Missing credentials. Email:", email, "Password:", password ? "***" : "undefined", "Raw body:", req.body);
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    // Authenticate with Supabase
    const user = await authenticateWithSupabase(email, password);

    const response: AuthResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      token: user.token,
    };

    res.json(response);
  } catch (error: any) {
    console.error("[Auth] Login error:", error);
    res.status(401).json({ error: "Invalid email or password" });
  }
};

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body as AuthRequest & { name: string };

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const supabaseUrl = "https://uzeuhsydjnjsykqvxvkk.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_KEY not configured");
    }

    // Create user via Supabase Admin API
    const signupResponse = await fetch(`${supabaseUrl}/auth/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        user_metadata: {
          name: name || email.split("@")[0],
        },
      }),
    });

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      console.error("[Auth] Signup error:", errorData);

      if (signupResponse.status === 422) {
        res.status(409).json({ error: "User already exists" });
      } else {
        res.status(signupResponse.status).json({ error: errorData.message || "Signup failed" });
      }
      return;
    }

    const userData = await signupResponse.json();

    // Now authenticate to get token
    const authUser = await authenticateWithSupabase(email, password);

    const response: AuthResponse = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      token: authUser.token,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("[Auth] Signup error:", error);
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
};

export const handleLogout: RequestHandler = (req, res) => {
  // In a real app, you'd invalidate the token here
  res.json({ message: "Logged out successfully" });
};
