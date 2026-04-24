import { ExternalLink, Facebook } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/RockingTheatreMedia";

const desktopEmbed = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
  FACEBOOK_PAGE_URL,
)}&tabs=timeline&width=500&height=760&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&lazy=true`;

const mobileEmbed = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
  FACEBOOK_PAGE_URL,
)}&tabs=timeline&width=340&height=620&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&lazy=true`;

const FacebookFeed = () => {
  return (
    <section className="bg-slate-900 py-20 text-white">
      <div className="container mx-auto max-w-[1280px] px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-300">
            <Facebook className="h-4 w-4" />
            Live from Facebook
          </div>
          <h2 className="text-3xl font-bold md:text-4xl">Follow Rocking Theatre Media</h2>
          <p className="mt-3 text-slate-400">
            This section now pulls from the real Facebook page instead of showing static placeholder posts.
          </p>
          <Button asChild className="mt-6 bg-blue-600 text-white hover:bg-blue-700">
            <a href={FACEBOOK_PAGE_URL} target="_blank" rel="noopener noreferrer">
              Open Facebook Page
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <Card className="overflow-hidden border border-slate-700 bg-slate-950/70 shadow-heavy">
            <CardContent className="p-4 md:p-6">
              <div className="mx-auto hidden max-w-[500px] md:block">
                <iframe
                  title="Rocking Theatre Media Facebook feed"
                  src={desktopEmbed}
                  width="500"
                  height="760"
                  style={{ border: "none", overflow: "hidden" }}
                  scrolling="no"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  loading="lazy"
                  className="mx-auto w-full rounded-2xl bg-white"
                />
              </div>

              <div className="mx-auto max-w-[340px] md:hidden">
                <iframe
                  title="Rocking Theatre Media Facebook feed mobile"
                  src={mobileEmbed}
                  width="340"
                  height="620"
                  style={{ border: "none", overflow: "hidden" }}
                  scrolling="no"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  loading="lazy"
                  className="mx-auto w-full rounded-2xl bg-white"
                />
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FacebookFeed;
