import { Facebook, MessageCircle, ThumbsUp, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FacebookFeed = () => {
  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="container mx-auto max-w-[1280px] px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-400 mb-4">
            <Facebook className="h-4 w-4" />
            🔴 LIVE Updates
          </div>
          <h2 className="text-3xl font-bold">Follow RTM Business Directory</h2>
          <p className="mt-2 text-slate-400">Fresh content daily - business tips, success stories & more</p>
          <a 
            href="https://facebook.com/rtmbusinessdirectory" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 rounded-full bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700 transition-colors"
          >
            <Facebook className="h-5 w-5" />
            Follow Us on Facebook
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-xl">🍁</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">RTM Business Directory</span>
                    <span className="text-green-400">✓</span>
                  </div>
                  <p className="text-xs text-slate-400">Just now</p>
                </div>
              </div>
              <p className="mt-3 text-sm">
                🔥 Huge announcement coming soon! We're expanding across Canada. 
                Stay tuned for exciting updates on new business partnerships and member benefits!
              </p>
              <div className="mt-4 flex items-center gap-6 text-slate-400">
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <ThumbsUp className="h-4 w-4" /> Like
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <MessageCircle className="h-4 w-4" /> Comment
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">RTM Business Directory</span>
                    <span className="text-green-400">✓</span>
                  </div>
                  <p className="text-xs text-slate-400">2 days ago</p>
                </div>
              </div>
              <p className="mt-3 text-sm">
                💵 Earn 30% commission with our affiliate program! 
                Refer businesses and earn recurring income. 
                Join today - it's free!
              </p>
              <div className="mt-4 flex items-center gap-6 text-slate-400">
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <ThumbsUp className="h-4 w-4" /> Like
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <MessageCircle className="h-4 w-4" /> Comment
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-xl">🏆</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">RTM Business Directory</span>
                    <span className="text-green-400">✓</span>
                  </div>
                  <p className="text-xs text-slate-400">5 days ago</p>
                </div>
              </div>
              <p className="mt-3 text-sm">
                🎉 Congratulations to our featured businesses this week! 
                Thank you for being part of the RTM community. 
                Together we're building Canada's best business directory!
              </p>
              <div className="mt-4 flex items-center gap-6 text-slate-400">
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <ThumbsUp className="h-4 w-4" /> Like
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <MessageCircle className="h-4 w-4" /> Comment
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-white">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FacebookFeed;