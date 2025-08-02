import { useGetUserNFT } from "@/hooks/use-get-user-nft";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Eye, Heart, Sparkles, Star, Crown, Palette } from "lucide-react";
import {
  getTraitRarity,
  TRAIT_OPTIONS,
} from "@/hooks/useCreateMintWithAttributes";

export function NFTGrid() {
  const [data] = useGetUserNFT();

  // Helper function to get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "bg-gray-500";
      case "Uncommon":
        return "bg-green-500";
      case "Rare":
        return "bg-blue-500";
      case "Epic":
        return "bg-purple-500";
      case "Legendary":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Helper function to get trait icon
  const getTraitIcon = (traitType: string) => {
    switch (traitType.toLowerCase()) {
      case "background":
        return (
          <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-purple-400"></div>
        );
      case "eyes":
        return (
          <div className="w-3 h-3 rounded bg-gradient-to-r from-green-400 to-blue-400"></div>
        );
      case "accessory":
        return <Crown className="w-3 h-3 text-yellow-400" />;
      case "expression":
        return (
          <div className="w-3 h-3 rounded bg-gradient-to-r from-pink-400 to-red-400"></div>
        );
      default:
        return <Palette className="w-3 h-3 text-gray-400" />;
    }
  };

  // Helper function to extract traits from NFT attributes (VecMap structure)
  const extractTraits = (nft: any) => {
    const traits: { [key: string]: string } = {};
    let rarityScore = 0;

    try {
      const content = nft.data?.content;
      const fields = content?.fields;

      // Extract attributes from the VecMap structure
      if (fields?.attributes) {
        const attributesData = fields.attributes;

        // Handle different possible VecMap structures from Sui
        if (attributesData.type?.includes("VecMap") && attributesData.fields) {
          // Case 1: VecMap with contents field containing the actual map data
          if (attributesData.fields.contents) {
            const contents = attributesData.fields.contents;
            if (Array.isArray(contents)) {
              contents.forEach((item: any) => {
                if (item.fields && item.fields.key && item.fields.value) {
                  traits[item.fields.key] = item.fields.value;
                }
              });
            }
          }
          // Case 2: Direct fields array
          else if (Array.isArray(attributesData.fields)) {
            attributesData.fields.forEach((field: any) => {
              if (field.key && field.value) {
                traits[field.key] = field.value;
              } else if (field.fields?.key && field.fields?.value) {
                traits[field.fields.key] = field.fields.value;
              }
            });
          }
        }
        // Case 3: Simple object structure
        else if (
          typeof attributesData === "object" &&
          !Array.isArray(attributesData)
        ) {
          Object.entries(attributesData).forEach(([key, value]) => {
            if (typeof value === "string" || typeof value === "number") {
              traits[key] = String(value);
            }
          });
        }
      }

      // Also check for dynamic fields that might contain individual traits
      if (fields) {
        Object.keys(TRAIT_OPTIONS).forEach((traitType) => {
          if (fields[traitType] && typeof fields[traitType] === "string") {
            traits[traitType] = fields[traitType];
          }
        });
      }

      // Extract rarity score if available
      if (traits.rarity_score) {
        rarityScore = parseInt(traits.rarity_score) || 0;
      }

      console.log("Extracted traits for NFT:", nft.data?.objectId, traits);
    } catch (error) {
      console.log("Error extracting traits:", error);
      // Fallback: try to extract from any nested structure
      try {
        const allFields = JSON.stringify(nft);
        const matches = allFields.match(/"key":"([^"]+)","value":"([^"]+)"/g);
        if (matches) {
          matches.forEach((match) => {
            const keyMatch = match.match(/"key":"([^"]+)"/);
            const valueMatch = match.match(/"value":"([^"]+)"/);
            if (keyMatch && valueMatch) {
              traits[keyMatch[1]] = valueMatch[1];
            }
          });
        }
      } catch (fallbackError) {
        console.log("Fallback extraction also failed:", fallbackError);
      }
    }

    return { traits, rarityScore };
  };

  // Calculate rarity score from traits
  const calculateRarityScore = (traits: { [key: string]: string }) => {
    let totalScore = 0;
    Object.entries(traits).forEach(([traitType, traitValue]) => {
      if (traitValue && traitType !== "rarity_score") {
        const rarity = getTraitRarity(
          traitType as keyof typeof TRAIT_OPTIONS,
          traitValue,
        );
        if (rarity) {
          totalScore += Math.round((100 - rarity.percentage) / 10);
        }
      }
    });
    return totalScore;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data &&
          data.map((nft, index) => {
            const content = nft.data?.content;
            // @ts-expect-error there is
            const fields = content?.fields;
            const { traits, rarityScore } = extractTraits(nft);
            const calculatedRarityScore =
              rarityScore || calculateRarityScore(traits);
            const hasTraits = Object.keys(traits).length > 0;

            return (
              <Card
                key={nft.data?.objectId || index}
                className="bg-[#313244] border-[#45475a] hover:border-[#cba6f7] transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={fields?.image_url || "/placeholder.png"}
                      alt={fields?.name || "NFT"}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png";
                      }}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Rarity Score Badge */}
                    {calculatedRarityScore > 0 && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-gradient-to-r from-[#cba6f7] to-[#f38ba8] text-[#11111b] text-xs font-bold">
                          <Star className="w-3 h-3 mr-1" />
                          {calculatedRarityScore}
                        </Badge>
                      </div>
                    )}

                    {/* Traits Badge */}
                    {hasTraits && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-[#313244]/80 text-[#cdd6f4] text-xs backdrop-blur-sm">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {
                            Object.keys(traits).filter(
                              (key) => key !== "rarity_score",
                            ).length
                          }{" "}
                          Traits
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-[#cdd6f4] mb-1 truncate">
                      {fields?.name || "Unnamed NFT"}
                    </h3>
                    <p className="text-sm text-[#bac2de] mb-3 line-clamp-2">
                      {fields?.description || "No description"}
                    </p>

                    {/* Traits Display */}
                    {hasTraits ? (
                      <div className="space-y-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-[#cba6f7]" />
                          <span className="text-sm font-medium text-[#cdd6f4]">
                            Attributes
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                          {Object.entries(traits)
                            .filter(([key]) => key !== "rarity_score")
                            .slice(0, 4) // Show max 4 traits to prevent overflow
                            .map(([traitType, traitValue]) => {
                              const rarity = getTraitRarity(
                                traitType as keyof typeof TRAIT_OPTIONS,
                                traitValue,
                              );
                              return (
                                <div
                                  key={traitType}
                                  className="flex items-center justify-between bg-[#1e1e2e] rounded-md px-2 py-1"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {getTraitIcon(traitType)}
                                    <div className="min-w-0">
                                      <div className="text-xs text-[#6c7086] uppercase truncate">
                                        {traitType.replace(/_/g, " ")}
                                      </div>
                                      <div className="text-xs text-[#cdd6f4] font-medium truncate">
                                        {traitValue}
                                      </div>
                                    </div>
                                  </div>
                                  {rarity && (
                                    <Badge
                                      className={`${getRarityColor(rarity.rarity)} text-white text-xs px-1 py-0`}
                                    >
                                      {rarity.rarity.charAt(0)}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                        </div>

                        {/* Show "more traits" indicator if there are more than 4 */}
                        {Object.keys(traits).filter(
                          (key) => key !== "rarity_score",
                        ).length > 4 && (
                          <div className="text-xs text-[#6c7086] text-center">
                            +
                            {Object.keys(traits).filter(
                              (key) => key !== "rarity_score",
                            ).length - 4}{" "}
                            more attributes
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-3 p-2 bg-[#1e1e2e] rounded-md border border-[#45475a]">
                        <div className="text-xs text-[#6c7086] text-center">
                          No attributes available
                        </div>
                      </div>
                    )}

                    {/* Bottom Stats */}
                    <div className="flex items-center justify-between border-t border-[#45475a] pt-3">
                      <div className="flex items-center gap-1 text-[#f38ba8]">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">
                          {Math.floor(Math.random() * 100)}
                        </span>
                      </div>

                      {calculatedRarityScore > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[#6c7086]">
                            Rarity:
                          </span>
                          <Badge
                            variant="outline"
                            className="border-[#cba6f7] text-[#cba6f7] text-xs"
                          >
                            {calculatedRarityScore > 30
                              ? "Legendary"
                              : calculatedRarityScore > 20
                                ? "Epic"
                                : calculatedRarityScore > 15
                                  ? "Rare"
                                  : calculatedRarityScore > 10
                                    ? "Uncommon"
                                    : "Common"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {data?.length === 0 && (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-[#6c7086] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#bac2de] mb-2">
            No NFTs found
          </h3>
          <p className="text-[#a6adc8]">
            Mint some NFTs with attributes to see them here!
          </p>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #45475a;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cba6f7;
          border-radius: 2px;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
