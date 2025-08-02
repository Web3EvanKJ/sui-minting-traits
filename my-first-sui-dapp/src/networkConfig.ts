import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        // TODO: Update with your deployed contract address
        simpleArtNFT: "0x0",
        collectionId: "0x0",
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        // replacce with your deployed contract address
        simpleArtNFT:
          "0x58b6a42586bc44b5c27866ff925b77c4efebfeb935d271cb5e4a5c243e315668",
        // replacce with your collection id
        collectionId:
          "0xd2e1eb923476e5c7d0c232489db35dad9d68c5a046156e044f2e1cc16424a5ae",
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        // TODO: Update with your deployed contract address
        simpleArtNFT: "0x0",
        collectionId: "0x0",
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
