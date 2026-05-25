import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invokeListingAdmin } from "@/services/listingAdmin";

type CrmContact = {
  id: string;
  email: string;
  name: string | null;
  stage: string;
  source: string | null;
  tags: string[];
  lead_score: number;
  updated_at: string;
};

export default function AdminOps() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<CrmContact[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await invokeListingAdmin<{ contacts: CrmContact[] }>("list-crm-contacts");
        setContacts(res.contacts ?? []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load CRM");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ops CRM</h1>
          <p className="text-sm text-muted-foreground">
            Unified contacts from checklist leads, listing outreach, and members
          </p>
        </div>
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Contacts ({contacts.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.stage}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{c.tags?.join(", ") || "—"}</TableCell>
                      <TableCell className="text-sm">{c.source ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
