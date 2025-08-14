import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";

type AuthView = "login" | "register" | "reset";

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, session, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<AuthView>("login");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Reset fields
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    document.title = "Login or Register | Pentyrch Aliens";
    if (session) navigate("/dashboard");
  }, [session, navigate]);

  const canLogin = useMemo(
    () => loginEmail && loginPassword,
    [loginEmail, loginPassword]
  );
  const canRegister = useMemo(
    () => name && email && password,
    [name, email, password]
  );
  const canReset = useMemo(() => resetEmail, [resetEmail]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signIn(loginEmail, loginPassword);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      await signUp(name, email, password);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetPassword(resetEmail);
      toast("Check your email for a reset link.");
      setView("login"); // go back to login after reset
    } catch (e) {
      // toast already handles error
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <section className="w-full max-w-md">
        <Card className="shadow-xl rounded-2xl overflow-hidden border-none">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-6">
            <CardTitle className="text-2xl font-bold">
              Pentyrch Aliens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {view !== "reset" && (
              <Tabs
                defaultValue={view}
                onValueChange={(val) => setView(val as AuthView)}
              >
                <TabsList className="grid grid-cols-2 rounded-xl overflow-hidden border mb-6">
                  <TabsTrigger
                    value="login"
                    className="bg-white text-gray-700 rounded-[7px] hover:bg-gray-100 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="bg-white text-gray-700 rounded-[7px] hover:bg-gray-100 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Email
                    </span>
                    <Input
                      type="email"
                      placeholder="alien@planet.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Password
                    </span>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </label>
                  <Button
                    className="w-full"
                    disabled={!canLogin || loading}
                    onClick={handleLogin}
                  >
                    {loading ? "Please wait…" : "Login"}
                  </Button>
                  <Button
                    variant="link"
                    className="text-sm text-blue-500 hover:underline"
                    onClick={() => setView("reset")}
                  >
                    Forgot password?
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="space-y-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Name
                    </span>
                    <Input
                      placeholder="Zorg Blip"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Email
                    </span>
                    <Input
                      type="email"
                      placeholder="alien@planet.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Password
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
                    disabled={!canRegister || loading}
                    onClick={handleRegister}
                  >
                    {loading ? "Please wait…" : "Create account"}
                  </Button>
                </TabsContent>
              </Tabs>
            )}

            {view === "reset" && (
              <div className="space-y-5">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    Enter your email
                  </span>
                  <Input
                    type="email"
                    placeholder="alien@planet.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </label>
                <Button
                  className="w-full"
                  disabled={!canReset}
                  onClick={handleReset}
                >
                  Send Reset Link
                </Button>
                <Button
                  variant="link"
                  className="text-sm text-blue-500 hover:underline"
                  onClick={() => setView("login")}
                >
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AuthPage;
