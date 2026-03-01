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

const provinces = [
  { code: "YT", d: "M80,100 L180,100 L180,200 L120,250 L80,200 Z", tx: 130, ty: 170, fontSize: "text-xs" },
  { code: "NT", d: "M180,80 L380,80 L380,200 L180,200 Z", tx: 280, ty: 140, fontSize: "text-xs" },
  { code: "NU", d: "M380,60 L600,60 L650,150 L600,250 L380,200 Z", tx: 500, ty: 140, fontSize: "text-xs" },
  { code: "BC", d: "M80,200 L180,200 L200,380 L100,400 L80,320 Z", tx: 130, ty: 300, fontSize: "text-sm font-bold" },
  { code: "AB", d: "M180,200 L280,200 L280,380 L200,380 Z", tx: 230, ty: 290, fontSize: "text-sm font-bold" },
  { code: "SK", d: "M280,200 L380,200 L380,380 L280,380 Z", tx: 330, ty: 290, fontSize: "text-sm font-bold" },
  { code: "MB", d: "M380,200 L480,200 L500,380 L380,380 Z", tx: 430, ty: 290, fontSize: "text-sm font-bold" },
  { code: "ON", d: "M480,200 L600,250 L650,350 L600,450 L480,420 L500,380 Z", tx: 550, ty: 340, fontSize: "text-lg font-bold" },
  { code: "QC", d: "M600,250 L750,200 L850,280 L800,400 L650,420 L600,450 L650,350 Z", tx: 720, ty: 320, fontSize: "text-lg font-bold" },
  { code: "NB", d: "M800,380 L850,360 L880,400 L850,440 L800,420 Z", tx: 835, ty: 405, fontSize: "text-[10px]" },
  { code: "NS", d: "M850,420 L920,400 L950,450 L900,470 L850,450 Z", tx: 890, ty: 440, fontSize: "text-[10px]" },
  { code: "PE", d: "M880,380 L920,370 L930,390 L890,400 Z", tx: 900, ty: 388, fontSize: "text-[8px]" },
  { code: "NL", d: "M850,280 L920,250 L970,300 L950,380 L900,350 L850,330 Z", tx: 900, ty: 310, fontSize: "text-xs" },
];

  const navigate = useNavigate();
const CanadaMapComponent = () => {
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const handleClick = (code: string) => {
    setSelectedProvince(selectedProvince === code ? null : code);
  };

  const getFill = (code: string) => {
    if (selectedProvince === code) return "#E31837";
    if (activeProvince === code) return "rgba(227, 24, 55, 0.6)";
    return "rgba(255, 255, 255, 0.08)";
  };

  const getStroke = (code: string) => {
    if (selectedProvince === code || activeProvince === code) return "#E31837";
    return "rgba(255, 255, 255, 0.25)";
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
            <svg
              viewBox="0 0 1000 600"
              className="w-full h-auto"
              style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))" }}
            >
              {provinces.map((p) => (
                <g key={p.code}>
                  <path
                    d={p.d}
                    fill={getFill(p.code)}
                    stroke={getStroke(p.code)}
                    strokeWidth={selectedProvince === p.code ? 2 : 1}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setActiveProvince(p.code)}
                    onMouseLeave={() => setActiveProvince(null)}
                    onClick={() => handleClick(p.code)}
                  />
                  <text
                    x={p.tx}
                    y={p.ty}
                    textAnchor="middle"
                    className={`${p.fontSize} font-medium pointer-events-none`}
                    fill={selectedProvince === p.code || activeProvince === p.code ? "#ffffff" : "rgba(255,255,255,0.5)"}
                  >
                    {p.code}
                  </text>
                </g>
              ))}
            </svg>

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
                    Explore {selectedData.name} Businesses →
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
                <p className="text-3xl font-bold text-destructive">50K+</p>
                <p className="text-xs text-white/50">Total Businesses</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-accent">$2.3B</p>
                <p className="text-xs text-white/50">Grants Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CanadaMapComponent;
