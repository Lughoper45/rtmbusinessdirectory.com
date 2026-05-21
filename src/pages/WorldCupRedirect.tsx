import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { WORLDCUP_APP_URL } from "@/lib/site";

const WorldCupRedirect = () => {
  useEffect(() => {
    const target = new URL("/worldcup", WORLDCUP_APP_URL).toString();
    window.location.replace(target);
  }, []);

  return (
    <>
      <Helmet>
        <title>World Cup Ready | RTM</title>
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-muted-foreground">Redirecting to World Cup Ready…</p>
      </div>
    </>
  );
};

export default WorldCupRedirect;
