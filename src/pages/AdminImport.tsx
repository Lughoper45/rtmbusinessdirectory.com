import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminImport = () => {
  const [status, setStatus] = useState<string>("Ready to import");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const clearOldData = async () => {
    setIsLoading(true);
    setStatus("Clearing old mock data (biz-* IDs)...");
    try {
      const { error } = await supabase
        .from("businesses")
        .delete()
        .like("business_id", "biz-%");
      if (error) throw error;
      setStatus("Old mock data cleared!");
      toast.success("Old mock data cleared");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const runImport = async (dryRun = false) => {
    setIsLoading(true);
    setStatus(dryRun ? "Running dry run..." : "Fetching CSV...");

    try {
      const res = await fetch("/data/business-export.csv");
      const csvText = await res.text();
      const sizeMB = (csvText.length / (1024 * 1024)).toFixed(1);
      setStatus(`CSV loaded (${sizeMB} MB). ${dryRun ? "Parsing..." : "Importing..."}`);

      const { data, error } = await supabase.functions.invoke("import-businesses", {
        body: { csvText, dryRun },
      });

      if (error) throw error;

      setResult(data);
      setStatus(
        dryRun
          ? `Dry run: ${data.count} businesses found, ${data.skipped} skipped`
          : `Done! Imported ${data.imported}/${data.total} businesses (${data.errors} errors, ${data.skipped} skipped)`
      );
      toast.success(dryRun ? "Dry run complete" : "Import complete!");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Business Import</h1>
        <p className="text-muted-foreground">Import businesses from the WordPress CSV export.</p>

        <div className="flex gap-4 flex-wrap">
          <Button variant="destructive" onClick={clearOldData} disabled={isLoading}>
            Clear Old Mock Data
          </Button>
          <Button variant="outline" onClick={() => runImport(true)} disabled={isLoading}>
            Dry Run (Preview)
          </Button>
          <Button onClick={() => runImport(false)} disabled={isLoading}>
            {isLoading ? "Processing..." : "Import All"}
          </Button>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium text-foreground">{status}</p>
        </div>

        {result && (
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-auto max-h-96 text-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default AdminImport;
