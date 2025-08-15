import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password) return;
    try {
      setLoading(true);

      // Simply call updateUser with the new password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(`Failed to update. ${error}`);
        throw error;
      }

      toast("Password updated! You can now login.");
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl space-y-5">
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-600">
            New Password
          </span>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <Button
          className="w-full"
          disabled={!password || loading}
          onClick={handleReset}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
