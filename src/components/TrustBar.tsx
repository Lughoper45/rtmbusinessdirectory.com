const TrustBar = () => {
  const partners = [
    { name: "Business Directory", abbr: "Directory" },
    { name: "Member Deals", abbr: "Deals" },
    { name: "Grant Guidance", abbr: "Grants" },
    { name: "Business Support", abbr: "Support" },
  ];

  return (
    <section className="py-10 bg-surface-light border-y border-border">
      <div className="container mx-auto max-w-[1280px] px-6">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8">
          Built around practical Canadian business discovery
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center justify-center w-28 h-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
              title={partner.name}
            >
              <div className="bg-muted rounded-lg px-4 py-2 text-muted-foreground font-bold text-sm">
                {partner.abbr}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
