import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { invokeListingPublic } from "@/services/listingAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const ListingOptOut = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOptOut = async () => {
    setLoading(true);
    try {
      await invokeListingPublic("opt-out", { token, email: email.trim() || undefined });
      setDone(true);
      toast.success("You have been opted out.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opt-out failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Opt out — RTM Directory</title>
      </Helmet>
      <Navbar />
      <main className="container max-w-md py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Not your business?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {done ? (
              <p className="text-sm text-muted-foreground">
                You will not receive further claim invitations from RTM for this address.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Opt out of commercial emails about claiming this listing (CASL).
                </p>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button className="w-full" onClick={() => void handleOptOut()} disabled={loading}>
                  Opt out
                </Button>
              </>
            )}
            <Link to="/" className="text-sm text-primary block text-center">
              Return home
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
};

export default ListingOptOut;
