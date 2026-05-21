import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, DollarSign, TrendingUp, Users, X } from "lucide-react";

interface ProvinceStats {
  name: string;
  businesses: string;
  grants: string;
  growth: string;
  topCategories: string[];
}

const provinceData: Record<string, ProvinceStats> = {
  BC: { name: "British Columbia", businesses: "9,200+", grants: "$450M", growth: "+18%", topCategories: ["Tech", "Tourism", "Film"] },
  AB: { name: "Alberta", businesses: "7,800+", grants: "$380M", growth: "+12%", topCategories: ["Energy", "Agriculture", "Tech"] },
  SK: { name: "Saskatchewan", businesses: "2,100+", grants: "$95M", growth: "+8%", topCategories: ["Agriculture", "Mining", "Retail"] },
  MB: { name: "Manitoba", businesses: "2,400+", grants: "$110M", growth: "+10%", topCategories: ["Manufacturing", "Agriculture", "Services"] },
  ON: { name: "Ontario", businesses: "18,500+", grants: "$890M", growth: "+22%", topCategories: ["Finance", "Tech", "Manufacturing"] },
  QC: { name: "Quebec", businesses: "12,100+", grants: "$520M", growth: "+15%", topCategories: ["Aerospace", "Gaming", "AI"] },
  NB: { name: "New Brunswick", businesses: "1,200+", grants: "$55M", growth: "+7%", topCategories: ["IT", "Seafood", "Tourism"] },
  NS: { name: "Nova Scotia", businesses: "1,800+", grants: "$75M", growth: "+9%", topCategories: ["Ocean Tech", "Tourism", "Health"] },
  PE: { name: "Prince Edward Island", businesses: "450+", grants: "$22M", growth: "+6%", topCategories: ["Tourism", "Agriculture", "Biotech"] },
  NL: { name: "Newfoundland & Labrador", businesses: "950+", grants: "$42M", growth: "+5%", topCategories: ["Oil & Gas", "Fishing", "Tourism"] },
  YT: { name: "Yukon", businesses: "280+", grants: "$15M", growth: "+4%", topCategories: ["Mining", "Tourism", "Services"] },
  NT: { name: "Northwest Territories", businesses: "210+", grants: "$12M", growth: "+3%", topCategories: ["Mining", "Indigenous", "Tourism"] },
  NU: { name: "Nunavut", businesses: "120+", grants: "$8M", growth: "+2%", topCategories: ["Mining", "Indigenous", "Arts"] },
};

const CanadaMapComponent = () => {
  const navigate = useNavigate();
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const handleClick = (code: string) => {
    setSelectedProvince(selectedProvince === code ? null : code);
  };

  const getProvinceColor = (code: string) => {
    if (selectedProvince === code) return "fill-primary";
    if (activeProvince === code) return "fill-accent";
    return "fill-white/18 hover:fill-white/32";
  };

  const selectedData = selectedProvince ? provinceData[selectedProvince] : null;

  return (
    <section className="py-20 bg-[#0a0e1a] text-white overflow-hidden">
      <div className="container mx-auto max-w-[1280px] px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-destructive/10 text-destructive mb-4 tracking-wide uppercase">
            Coast to Coast
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Explore Canadian Business Landscape</h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Click on any province to discover local business statistics, available grants, and growth opportunities
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Map */}
          <div className="lg:col-span-2 relative">
            <div className="pointer-events-none absolute inset-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
            <svg
              viewBox="0 0 1000 600"
              className="relative z-10 w-full h-auto"
              style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))" }}
            >
              {/* Yukon */}
              <path
                d="M80,100 L180,100 L180,200 L120,250 L80,200 Z"
                className={`${getProvinceColor("YT")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("YT")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("YT")}
              />
              <text x="130" y="170" className="fill-white/70 text-xs font-medium pointer-events-none">YT</text>

              {/* Northwest Territories */}
              <path
                d="M180,80 L380,80 L380,200 L180,200 Z"
                className={`${getProvinceColor("NT")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("NT")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("NT")}
              />
              <text x="280" y="140" className="fill-white/70 text-xs font-medium pointer-events-none">NT</text>

              {/* Nunavut */}
              <path
                d="M380,60 L600,60 L650,150 L600,250 L380,200 Z"
                className={`${getProvinceColor("NU")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("NU")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("NU")}
              />
              <text x="500" y="140" className="fill-white/70 text-xs font-medium pointer-events-none">NU</text>

              {/* British Columbia */}
              <path
                d="M80,200 L180,200 L200,380 L100,400 L80,320 Z"
                className={`${getProvinceColor("BC")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("BC")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("BC")}
              />
              <text x="130" y="300" className="fill-white/70 text-sm font-bold pointer-events-none">BC</text>

              {/* Alberta */}
              <path
                d="M180,200 L280,200 L280,380 L200,380 Z"
                className={`${getProvinceColor("AB")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("AB")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("AB")}
              />
              <text x="230" y="290" className="fill-white/70 text-sm font-bold pointer-events-none">AB</text>

              {/* Saskatchewan */}
              <path
                d="M280,200 L380,200 L380,380 L280,380 Z"
                className={`${getProvinceColor("SK")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("SK")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("SK")}
              />
              <text x="330" y="290" className="fill-white/70 text-sm font-bold pointer-events-none">SK</text>

              {/* Manitoba */}
              <path
                d="M380,200 L480,200 L500,380 L380,380 Z"
                className={`${getProvinceColor("MB")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("MB")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("MB")}
              />
              <text x="430" y="290" className="fill-white/70 text-sm font-bold pointer-events-none">MB</text>

              {/* Ontario */}
              <path
                d="M480,200 L600,250 L650,350 L600,450 L480,420 L500,380 Z"
                className={`${getProvinceColor("ON")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("ON")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("ON")}
              />
              <text x="550" y="340" className="fill-white/70 text-lg font-bold pointer-events-none">ON</text>

              {/* Quebec */}
              <path
                d="M600,250 L750,200 L850,280 L800,400 L650,420 L600,450 L650,350 Z"
                className={`${getProvinceColor("QC")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("QC")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("QC")}
              />
              <text x="720" y="320" className="fill-white/70 text-lg font-bold pointer-events-none">QC</text>

              {/* New Brunswick */}
              <path
                d="M800,380 L850,360 L880,400 L850,440 L800,420 Z"
                className={`${getProvinceColor("NB")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("NB")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("NB")}
              />
              <text x="835" y="405" className="fill-white/70 text-[10px] font-medium pointer-events-none">NB</text>

              {/* Nova Scotia */}
              <path
                d="M850,420 L920,400 L950,450 L900,470 L850,450 Z"
                className={`${getProvinceColor("NS")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("NS")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("NS")}
              />
              <text x="890" y="440" className="fill-white/70 text-[10px] font-medium pointer-events-none">NS</text>

              {/* PEI */}
              <path
                d="M880,380 L920,370 L930,390 L890,400 Z"
                className={`${getProvinceColor("PE")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("PE")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("PE")}
              />
              <text x="900" y="388" className="fill-white/70 text-[8px] font-medium pointer-events-none">PE</text>

              {/* Newfoundland */}
              <path
                d="M850,280 L920,250 L970,300 L950,380 L900,350 L850,330 Z"
                className={`${getProvinceColor("NL")} stroke-white/55 stroke-[2] cursor-pointer transition-all duration-300`}
                onMouseEnter={() => setActiveProvince("NL")}
                onMouseLeave={() => setActiveProvince(null)}
                onClick={() => handleClick("NL")}
              />
              <text x="900" y="310" className="fill-white/70 text-xs font-medium pointer-events-none">NL</text>
            </svg>

            <div className="mt-4 flex items-center justify-between gap-4 text-sm text-white/65">
              <p>Hover to preview. Click to lock a province.</p>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-white/30" />
                <span>Province</span>
                <span className="h-3 w-3 rounded-full bg-accent" />
                <span>Hovered</span>
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span>Selected</span>
              </div>
            </div>

            {/* Hover tooltip */}
            {activeProvince && !selectedProvince && (
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md text-foreground p-4 rounded-xl shadow-lg border border-white/10 animate-fade-in">
                <h4 className="font-bold">{provinceData[activeProvince]?.name}</h4>
                <p className="text-sm text-muted-foreground">Click to see details</p>
              </div>
            )}
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1">
            {selectedData ? (
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">{selectedData.name}</h3>
                  <button
                    onClick={() => setSelectedProvince(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-destructive/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedData.businesses}</p>
                      <p className="text-sm text-white/50">Registered Businesses</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedData.grants}</p>
                      <p className="text-sm text-white/50">Grants Available</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">{selectedData.growth}</p>
                      <p className="text-sm text-white/50">YoY Growth</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Top Industries
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedData.topCategories.map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-sm"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button 
                    className="w-full mt-4 bg-destructive hover:bg-destructive/90 text-white py-3 rounded-xl font-medium transition-colors"
                    onClick={() => navigate(`/directory?province=${selectedProvince}`)}
                  >
                    Explore {selectedData.name} Businesses
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">Select a Province</h3>
                <p className="text-white/50">
                  Click on any province on the map to view detailed business statistics and opportunities
                </p>
              </div>
            )}

            {/* National Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-destructive">10K+</p>
                <p className="text-xs text-white/50">Business Listings</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-accent">Guides</p>
                <p className="text-xs text-white/50">Grant Resources</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CanadaMapComponent;
