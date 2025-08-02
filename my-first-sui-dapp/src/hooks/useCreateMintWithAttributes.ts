import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { pinata } from "@/service/pinata";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatSUI } from "@/lib/utils";

// Define available traits and their options
export const TRAIT_OPTIONS = {
  background: [
    { name: "Blue Sky", rarity: "Common", percentage: 40 },
    { name: "Sunset", rarity: "Uncommon", percentage: 25 },
    { name: "Galaxy", rarity: "Rare", percentage: 15 },
    { name: "Rainbow", rarity: "Epic", percentage: 10 },
    { name: "Golden", rarity: "Legendary", percentage: 10 },
  ],
  eyes: [
    { name: "Normal", rarity: "Common", percentage: 45 },
    { name: "Big Eyes", rarity: "Uncommon", percentage: 30 },
    { name: "Glowing", rarity: "Rare", percentage: 15 },
    { name: "Laser", rarity: "Epic", percentage: 7 },
    { name: "Diamond", rarity: "Legendary", percentage: 3 },
  ],
  accessory: [
    { name: "None", rarity: "Common", percentage: 35 },
    { name: "Hat", rarity: "Common", percentage: 25 },
    { name: "Glasses", rarity: "Uncommon", percentage: 20 },
    { name: "Crown", rarity: "Rare", percentage: 12 },
    { name: "Halo", rarity: "Epic", percentage: 5 },
    { name: "Magic Aura", rarity: "Legendary", percentage: 3 },
  ],
  expression: [
    { name: "Happy", rarity: "Common", percentage: 40 },
    { name: "Cool", rarity: "Common", percentage: 30 },
    { name: "Surprised", rarity: "Uncommon", percentage: 15 },
    { name: "Angry", rarity: "Rare", percentage: 10 },
    { name: "Mysterious", rarity: "Epic", percentage: 5 },
  ],
};

export type NFTAttributes = {
  background: string;
  eyes: string;
  accessory: string;
  expression: string;
};

export type CreateMintWithAttributesDto = {
  name: string;
  description: string;
  imageFile: File | null;
  collectionId: string;
  attributes: NFTAttributes;
};

export function useCreateMintWithAttributes() {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();
  const simpleArtNFT = useNetworkVariable("simpleArtNFT");
  const suiClient = useSuiClient();
  const txQuery = useSignAndExecuteTransaction();
  const coinQuery = useSuiClientQuery(
    "getCoins",
    {
      owner: account?.address!,
      coinType: "0x2::sui::SUI",
    },
    { enabled: account !== null },
  );

  const query = useMutation({
    onError: (error) => {
      toast.error((error as Error).message, { id: "mint-nft-attributes" });
    },
    mutationKey: [
      "createMintWithAttributesTransaction",
      coinQuery.data?.data,
      account,
    ],
    mutationFn: async ([dto, requiredAmount, onSuccess]: [
      dto: CreateMintWithAttributesDto,
      requiredAmount: number,
      onSuccess: () => unknown,
    ]) => {
      if (!account) return;
      if (!dto.imageFile) return;

      const suitableCoin = coinQuery.data?.data.find(
        (x) => +x.balance > requiredAmount,
      );
      if (!suitableCoin) {
        throw new Error(
          `Insufficient SUI balance. Need ${formatSUI(requiredAmount)} SUI`,
        );
      }

      toast.loading("Uploading Image...", { id: "mint-nft-attributes" });
      const response = await pinata.upload.public.file(dto.imageFile);
      const link = `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${
        response.cid
      }`;

      const tx = new Transaction();

      const [mintCoin] = tx.splitCoins(tx.gas, [requiredAmount]);

      // First, mint the NFT
      tx.moveCall({
        target: `${simpleArtNFT}::simple_art_nft::mint_nft`,
        arguments: [
          tx.object(dto.collectionId),
          tx.pure("string", dto.name),
          tx.pure("string", dto.description),
          tx.pure("string", link),
          mintCoin,
          tx.object("0x6"),
        ],
      });

      toast.loading("Adding Attributes...", { id: "mint-nft-attributes" });

      // After minting, we need to get the NFT object ID to add attributes
      // Since we can't get the NFT ID in the same transaction, we'll need to handle this differently
      // Let's create a modified approach that adds attributes in the same transaction

      const { digest } = await txQuery.mutateAsync({ transaction: tx });
      const { effects, objectChanges } = await suiClient.waitForTransaction({
        digest,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      // Find the newly created NFT object
      const createdNFT = objectChanges?.find(
        (change) =>
          change.type === "created" && change.objectType?.includes("SimpleNFT"),
      );

      if (createdNFT && createdNFT.type === "created") {
        toast.loading("Adding Traits to NFT...", { id: "mint-nft-attributes" });

        // Create a new transaction to add attributes
        const attributeTx = new Transaction();

        // Add each attribute
        Object.entries(dto.attributes).forEach(([key, value]) => {
          if (value && value !== "None") {
            attributeTx.moveCall({
              target: `${simpleArtNFT}::simple_art_nft::add_attribute`,
              arguments: [
                attributeTx.object(createdNFT.objectId),
                attributeTx.pure(
                  "vector<u8>",
                  Array.from(new TextEncoder().encode(key)),
                ),
                attributeTx.pure(
                  "vector<u8>",
                  Array.from(new TextEncoder().encode(value)),
                ),
              ],
            });
          }
        });

        // Add rarity score as an attribute
        const rarityScore = calculateRarityScore(dto.attributes);
        attributeTx.moveCall({
          target: `${simpleArtNFT}::simple_art_nft::add_attribute`,
          arguments: [
            attributeTx.object(createdNFT.objectId),
            attributeTx.pure(
              "vector<u8>",
              Array.from(new TextEncoder().encode("rarity_score")),
            ),
            attributeTx.pure(
              "vector<u8>",
              Array.from(new TextEncoder().encode(rarityScore.toString())),
            ),
          ],
        });

        // Execute the attribute transaction
        await txQuery.mutateAsync({ transaction: attributeTx });
      }

      onSuccess();
      console.log(
        "NFT created with ID:",
        createdNFT?.type === "created" ? createdNFT.objectId : "Unknown",
      );
      toast.success("NFT Minted with Attributes!", {
        id: "mint-nft-attributes",
      });
      queryClient.refetchQueries({ queryKey: ["getUserNFT"] });
    },
  });

  return query;
}

// Helper function to calculate rarity score based on attributes
function calculateRarityScore(attributes: NFTAttributes): number {
  let totalScore = 0;

  Object.entries(attributes).forEach(([traitType, traitValue]) => {
    const traitOptions = TRAIT_OPTIONS[traitType as keyof typeof TRAIT_OPTIONS];
    const selectedTrait = traitOptions.find(
      (option) => option.name === traitValue,
    );

    if (selectedTrait) {
      // Lower percentage = higher rarity = higher score
      const rarityScore = Math.round((100 - selectedTrait.percentage) / 10);
      totalScore += rarityScore;
    }
  });

  return totalScore;
}

// Helper function to get random attributes (for random generation)
export function generateRandomAttributes(): NFTAttributes {
  const getRandomTrait = (traitOptions: typeof TRAIT_OPTIONS.background) => {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const option of traitOptions) {
      cumulative += option.percentage;
      if (random <= cumulative) {
        return option.name;
      }
    }

    return traitOptions[0].name; // fallback
  };

  return {
    background: getRandomTrait(TRAIT_OPTIONS.background),
    eyes: getRandomTrait(TRAIT_OPTIONS.eyes),
    accessory: getRandomTrait(TRAIT_OPTIONS.accessory),
    expression: getRandomTrait(TRAIT_OPTIONS.expression),
  };
}

// Helper function to get trait rarity info
export function getTraitRarity(
  traitType: keyof typeof TRAIT_OPTIONS,
  traitValue: string,
) {
  const traitOptions = TRAIT_OPTIONS[traitType];
  return traitOptions.find((option) => option.name === traitValue);
}
