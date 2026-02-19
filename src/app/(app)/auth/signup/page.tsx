import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import { SectionHeader } from "@/components/common/SectionHeader";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <SectionHeader title="Create account" subtitle="Join the community" />
      <Card className="p-6">
        <SignupForm />
        <p className="mt-4 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
