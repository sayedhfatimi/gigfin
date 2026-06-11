import { AuthLanding } from "@/components/auth/auth-landing";
import { publicFeatures } from "@/lib/features";

export default function Page() {
  return <AuthLanding signupEnabled={publicFeatures().signupEnabled} />;
}
