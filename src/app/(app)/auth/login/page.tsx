import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { SectionHeader } from "@/components/common/SectionHeader";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <SectionHeader title="Welcome back" subtitle="Sign in to continue" />
      <Card className="p-6">
        <LoginForm />
        <p className="mt-4 text-xs text-muted-foreground">
          No account?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Signup
          </Link>
        </p>
      </Card>
    </div>
  );
}
