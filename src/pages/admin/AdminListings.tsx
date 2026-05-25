import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Mail, Search, Sparkles, Send, Shield } from "lucide-react";
import {
  invokeListingAdmin,
  type ListingContact,
  type OutreachRow,
  type SocialPost,
  type UnclaimedBusiness,
} from "@/services/listingAdmin";

export default function AdminListings() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<UnclaimedBusiness[]>([]);
  const [contacts, setContacts] = useState<ListingContact[]>([]);
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [social, setSocial] = useState<SocialPost[]>([]);
  const [selectedOutreach, setSelectedOutreach] = useState<Set<string>>(new Set());
  const [selectedSocial, setSelectedSocial] = useState<Set<string>>(new Set());
  const [claims, setClaims] = useState<
    { id: string; status: string; business_email: string; businesses?: { name: string } }[]
  >([]);
  const [manualBizId, setManualBizId] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c, o, s, cl] = await Promise.all([
        invokeListingAdmin<{ businesses: UnclaimedBusiness[] }>("list-unclaimed", { search }),
        invokeListingAdmin<{ contacts: ListingContact[] }>("list-contacts"),
        invokeListingAdmin<{ outreach: OutreachRow[] }>("list-outreach"),
        invokeListingAdmin<{ posts: SocialPost[] }>("list-social"),
        invokeListingAdmin<{ claims: typeof claims }>("list-claims"),
      ]);
      setBusinesses(b.businesses ?? []);
      setContacts(c.contacts ?? []);
      setOutreach(o.outreach ?? []);
      setSocial(s.posts ?? []);
      setClaims(cl.claims ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load listing ops");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const runEnricher = async (businessIds?: string[]) => {
    try {
      const res = await invokeListingAdmin<{ processed: number }>("run-enricher", {
        limit: 25,
        business_ids: businessIds,
      });
      toast.success(`Enriched ${res.processed ?? 0} businesses`);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enricher failed");
    }
  };

  const buildQueue = async () => {
    try {
      const res = await invokeListingAdmin<{ queued: number }>("build-outreach-queue", { limit: 50 });
      toast.success(`Queued ${res.queued} outreach rows`);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Queue build failed");
    }
  };

  const approveOutreach = async () => {
    const ids = [...selectedOutreach];
    if (!ids.length) return;
    try {
      await invokeListingAdmin("approve-outreach", { ids });
      await invokeListingAdmin("dispatch-now");
      toast.success(`Approved ${ids.length} — dispatcher run`);
      setSelectedOutreach(new Set());
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed");
    }
  };

  const addManualContact = async () => {
    if (!manualBizId || !manualEmail) {
      toast.error("Business ID and email required");
      return;
    }
    try {
      await invokeListingAdmin("add-contact", {
        business_id: manualBizId,
        email: manualEmail,
        casl_basis: "manual_verified",
      });
      toast.success("Contact added");
      setManualEmail("");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Add contact failed");
    }
  };

  const generateSocial = async (businessId: string) => {
    try {
      await invokeListingAdmin("generate-social", { business_id: businessId });
      toast.success("Social draft created");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generate failed");
    }
  };

  const approveSocial = async () => {
    const ids = [...selectedSocial];
    if (!ids.length) return;
    try {
      await invokeListingAdmin("approve-social", { ids });
      await invokeListingAdmin("publish-social");
      toast.success(`Published ${ids.length} posts (or dry-run)`);
      setSelectedSocial(new Set());
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Social publish failed");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Listing outreach & social</h1>
            <p className="text-muted-foreground text-sm">
              Owner discovery → approve → claim invite emails → social queue (human-in-the-loop)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void runEnricher()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Run enricher (25)
            </Button>
            <Button variant="outline" onClick={() => void buildQueue()}>
              Build outreach queue
            </Button>
            <Button onClick={() => void invokeListingAdmin("dispatch-now").then(() => toast.success("Dispatcher run"))}>
              <Send className="h-4 w-4 mr-2" />
              Run dispatcher
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="unclaimed">
            <TabsList>
              <TabsTrigger value="unclaimed">Unclaimed</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="outreach">Outreach</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="claims">Claims</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="unclaimed" className="space-y-4">
              <div className="flex gap-2 max-w-md">
                <Input placeholder="Search name, city, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button variant="secondary" onClick={() => void loadAll()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner email</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses.map((b) => (
                        <TableRow key={b.business_id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell>{b.city}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{b.claim_status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{b.owner_email ?? "—"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => void runEnricher([b.business_id])}>
                              Enrich
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => void generateSocial(b.business_id)}>
                              Social
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>Listing contacts</CardTitle>
                  <CardDescription>Confidence ≥ 70 + CASL basis required for auto-queue</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>CASL</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.businesses?.name ?? c.business_id}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell>{c.confidence}</TableCell>
                          <TableCell>{c.casl_basis ?? "—"}</TableCell>
                          <TableCell>{c.source}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outreach" className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => void approveOutreach()} disabled={!selectedOutreach.size}>
                  <Mail className="h-4 w-4 mr-2" />
                  Approve & send ({selectedOutreach.size})
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead />
                        <TableHead>Business</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Step</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outreach.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            {o.status === "queued" && (
                              <Checkbox
                                checked={selectedOutreach.has(o.id)}
                                onCheckedChange={(checked) => {
                                  const next = new Set(selectedOutreach);
                                  if (checked) next.add(o.id);
                                  else next.delete(o.id);
                                  setSelectedOutreach(next);
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>{o.businesses?.name ?? o.business_id}</TableCell>
                          <TableCell>{o.listing_contacts?.email ?? "—"}</TableCell>
                          <TableCell>
                            <Badge>{o.status}</Badge>
                          </TableCell>
                          <TableCell>{o.step}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <Button onClick={() => void approveSocial()} disabled={!selectedSocial.size}>
                Approve & publish ({selectedSocial.size})
              </Button>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead />
                        <TableHead>Business</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Preview</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {social.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            {(p.status === "draft" || p.status === "approved") && (
                              <Checkbox
                                checked={selectedSocial.has(p.id)}
                                onCheckedChange={(checked) => {
                                  const next = new Set(selectedSocial);
                                  if (checked) next.add(p.id);
                                  else next.delete(p.id);
                                  setSelectedSocial(next);
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>{p.businesses?.name ?? p.product_type}</TableCell>
                          <TableCell>
                            <Badge>{p.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-md truncate">
                            {p.payload?.facebook?.slice(0, 80)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((cl) => (
                        <TableRow key={cl.id}>
                          <TableCell>{cl.businesses?.name ?? "—"}</TableCell>
                          <TableCell>{cl.business_email}</TableCell>
                          <TableCell>
                            <Badge>{cl.status}</Badge>
                          </TableCell>
                          <TableCell className="space-x-2">
                            {cl.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    void invokeListingAdmin("approve-claim", { claim_id: cl.id }).then(
                                      () => loadAll(),
                                    )
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    void invokeListingAdmin("reject-claim", { claim_id: cl.id }).then(
                                      () => loadAll(),
                                    )
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Manual contact (CASL: manual_verified)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                  <Input
                    placeholder="business_id"
                    value={manualBizId}
                    onChange={(e) => setManualBizId(e.target.value)}
                  />
                  <Input
                    placeholder="owner@business.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                  />
                  <Button onClick={() => void addManualContact()}>Add primary contact</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
