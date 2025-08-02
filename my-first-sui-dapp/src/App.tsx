import { ConnectButton } from "@mysten/dapp-kit";
import { useGetCollectionInfo } from "./hooks/use-get-collection-info";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Zap,
  Eye,
  Sparkles,
  Star,
  Palette,
  Crown,
} from "lucide-react";
import { useNetworkVariable } from "./networkConfig";
import { MintSection } from "./components/mint-section";
import { NFTGrid } from "./components/nft-grid";
import { formatSUI } from "./lib/utils";
import { TRAIT_OPTIONS } from "./hooks/useCreateMintWithAttributes";

export function App() {
  const collectionID = useNetworkVariable("collectionId");
  const [collectionInfo] = useGetCollectionInfo(collectionID);

  if (!collectionInfo) return <div>NOT FOUND</div>;

  // Calculate total possible trait combinations
  const totalCombinations = Object.values(TRAIT_OPTIONS).reduce(
    (acc, traits) => acc * traits.length,
    1,
  );

  // Get rarity distribution for display
  const getRarityStats = () => {
    const stats = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    Object.values(TRAIT_OPTIONS).forEach((traits) => {
      traits.forEach((trait) => {
        const rarity = trait.rarity.toLowerCase() as keyof typeof stats;
        stats[rarity]++;
      });
    });
    return stats;
  };

  const rarityStats = getRarityStats();

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4]">
      <div className="bg-[#181825] border-b border-[#313244]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#cba6f7] to-[#f38ba8] flex items-center justify-center">
              <Sparkles className="text-3xl text-[#11111b]" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#cba6f7] to-[#f38ba8] bg-clip-text text-transparent">
                  {collectionInfo.name}
                </h1>
                {collectionInfo.isActive && (
                  <Badge className="bg-[#a6e3a1] text-[#11111b] animate-pulse">
                    Live Mint
                  </Badge>
                )}
                <Badge className="bg-gradient-to-r from-[#cba6f7] to-[#f38ba8] text-[#11111b]">
                  With Traits
                </Badge>
              </div>
              <p className="text-[#bac2de] mb-2">
                Created by{" "}
                <span className="text-[#89b4fa] font-semibold">
                  {collectionInfo.creator}
                </span>
              </p>
              <p className="text-[#bac2de] mb-4 max-w-2xl">
                {collectionInfo.description}
              </p>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="flex items-center gap-2 bg-[#313244] px-3 py-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-[#a6e3a1]" />
                  <div className="text-sm">
                    <div className="text-[#6c7086]">Floor</div>
                    <div className="font-semibold">1.2 SUI</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#313244] px-3 py-2 rounded-lg">
                  <Users className="w-4 h-4 text-[#89b4fa]" />
                  <div className="text-sm">
                    <div className="text-[#6c7086]">Owners</div>
                    <div className="font-semibold">3,247</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#313244] px-3 py-2 rounded-lg">
                  <Zap className="w-4 h-4 text-[#f9e2af]" />
                  <div className="text-sm">
                    <div className="text-[#6c7086]">Volume</div>
                    <div className="font-semibold">1,234 SUI</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#313244] px-3 py-2 rounded-lg">
                  <Eye className="w-4 h-4 text-[#fab387]" />
                  <div className="text-sm">
                    <div className="text-[#6c7086]">Supply</div>
                    <div className="font-semibold">
                      {collectionInfo.totalSupply.toLocaleString()}/
                      {collectionInfo.maxSupply.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#313244] px-3 py-2 rounded-lg">
                  <span className="w-4 h-4 text-[#f38ba8]">💎</span>
                  <div className="text-sm">
                    <div className="text-[#6c7086]">Mint Price</div>
                    <div className="font-semibold">
                      {formatSUI(collectionInfo.mintPrice)} SUI
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#313244] px-3 py-2 rounded-lg">
                  <span className="w-4 h-4 text-[#94e2d5]">⏰</span>
                  <div className="text-sm">
                    <div className="text-[#6c7086]">Status</div>
                    <div className="font-semibold text-[#a6e3a1]">
                      {collectionInfo.isActive ? "Minting" : "Sold Out"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trait Information Panel */}
              <div className="bg-[#313244] rounded-lg p-4 mb-6 border border-[#45475a]">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-[#cba6f7]" />
                  <h3 className="text-lg font-semibold text-[#cdd6f4]">
                    Trait System
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#cba6f7]">4</div>
                    <div className="text-sm text-[#6c7086]">
                      Trait Categories
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#f38ba8]">
                      {Object.values(TRAIT_OPTIONS).reduce(
                        (acc, traits) => acc + traits.length,
                        0,
                      )}
                    </div>
                    <div className="text-sm text-[#6c7086]">Total Traits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#f9e2af]">
                      {totalCombinations.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#6c7086]">Combinations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#a6e3a1]">5</div>
                    <div className="text-sm text-[#6c7086]">Rarity Levels</div>
                  </div>
                </div>

                {/* Trait Categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {Object.entries(TRAIT_OPTIONS).map(([category, traits]) => (
                    <div
                      key={category}
                      className="bg-[#1e1e2e] rounded-lg p-3 border border-[#45475a]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {category === "background" && (
                          <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-purple-400"></div>
                        )}
                        {category === "eyes" && (
                          <div className="w-3 h-3 rounded bg-gradient-to-r from-green-400 to-blue-400"></div>
                        )}
                        {category === "accessory" && (
                          <Crown className="w-3 h-3 text-yellow-400" />
                        )}
                        {category === "expression" && (
                          <div className="w-3 h-3 rounded bg-gradient-to-r from-pink-400 to-red-400"></div>
                        )}
                        <span className="text-sm font-medium text-[#cdd6f4] capitalize">
                          {category}
                        </span>
                      </div>
                      <div className="text-xs text-[#6c7086]">
                        {traits.length} options
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rarity Distribution */}
                <div className="border-t border-[#45475a] pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-[#f9e2af]" />
                    <span className="text-sm font-medium text-[#cdd6f4]">
                      Rarity Distribution
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-gray-500 text-white text-xs">
                      Common ({rarityStats.common})
                    </Badge>
                    <Badge className="bg-green-500 text-white text-xs">
                      Uncommon ({rarityStats.uncommon})
                    </Badge>
                    <Badge className="bg-blue-500 text-white text-xs">
                      Rare ({rarityStats.rare})
                    </Badge>
                    <Badge className="bg-purple-500 text-white text-xs">
                      Epic ({rarityStats.epic})
                    </Badge>
                    <Badge className="bg-yellow-500 text-white text-xs">
                      Legendary ({rarityStats.legendary})
                    </Badge>
                  </div>
                </div>
              </div>

              <MintSection id={collectionID} collectionInfo={collectionInfo} />
            </div>
            <div className="self-end">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Section with Trait Info */}
      <div className="mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#cdd6f4] mb-2">
                Collection Gallery
              </h2>
              <p className="text-[#bac2de]">
                Browse all NFTs with their unique trait combinations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-[#45475a] text-[#cdd6f4]"
              >
                {collectionInfo.totalSupply} minted
              </Badge>
              <Badge className="bg-gradient-to-r from-[#cba6f7] to-[#f38ba8] text-[#11111b]">
                Trait-based
              </Badge>
            </div>
          </div>

          <NFTGrid />
        </div>
      </div>
    </div>
  );
}

export default App;
