import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.title = "Login or Register | Paylien Hockey";
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

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signIn(loginEmail, loginPassword);
      navigate("/dashboard");
    } catch (e) {
      // handled by toast in hook
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      await signUp(name, email, password);
      toast({
        title: "Check your email",
        description: "Confirm your account to continue.",
      });
    } catch (e) {
      // handled by toast in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <section className="w-full max-w-md">
        <h1 className="sr-only">Login or Register</h1>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Paylien</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4 pt-4">
                <label className="grid gap-2">
                  <span className="text-sm">Email</span>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm">Password</span>
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
              </TabsContent>
              <TabsContent value="register" className="space-y-4 pt-4">
                <label className="grid gap-2">
                  <span className="text-sm">Name</span>
                  <Input
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm">Email</span>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm">Password</span>
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
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AuthPage;
