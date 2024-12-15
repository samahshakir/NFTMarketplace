"use client";

import React, { useEffect, useState } from "react";
import {
  getAssetsByOwner,
  fetchNFTDetails,
  extractGroupAddress,
} from "@/utils/getAssets";
import Image from "next/image";
import Link from "next/link";
import { FaExternalLinkAlt, FaFilter } from "react-icons/fa";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import { getNFTDetail, getNFTList } from "@/utils/nftMarket";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface NFTDetail {
  name: string;
  symbol: string;
  image?: string;
  group?: string;
  mint: string;
  seller: string;
  price: string;
  listing: string;
  collection?: string;
  type?: string;
  category?: string;
}

const trimAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

const Closet: React.FC = () => {
  const { publicKey } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [assets, setAssets] = useState<NFTDetail[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<NFTDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000000000000000000 });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Derived filter options
  const [collections, setCollections] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const storedWalletAddress = sessionStorage.getItem("walletAddress");
    const storedAssets = sessionStorage.getItem("assets");

    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
    }

    if (storedAssets) {
      const parsedAssets = JSON.parse(storedAssets);
      setAssets(parsedAssets);
      updateFilterOptions(parsedAssets);
    }
    fetchNFTs();
  }, []);

  useEffect(() => {
    fetchNFTs();
  }, [wallet]);

  useEffect(() => {
    sessionStorage.setItem("walletAddress", walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    sessionStorage.setItem("assets", JSON.stringify(assets));
    updateFilterOptions(assets);
  }, [assets]);

  // Update filter options based on current assets
  const updateFilterOptions = (currentAssets: NFTDetail[]) => {
    const uniqueCollections = [...new Set(
      currentAssets
        .map(asset => asset.collection)
        .filter((collection): collection is string => collection !== undefined)
    )];
    
    const uniqueTypes = [...new Set(
      currentAssets
        .map(asset => asset.type)
        .filter((type): type is string => type !== undefined)
    )];
    
    const uniqueCategories = [...new Set(
      currentAssets
        .map(asset => asset.category)
        .filter((category): category is string => category !== undefined)
    )];
  
    setCollections(uniqueCollections);
    setTypes(uniqueTypes);
    setCategories(uniqueCategories);
  };
  // Apply filters
  useEffect(() => {
    let filtered = assets;

    // Collection filter
    if (selectedCollections.length > 0) {
      filtered = filtered.filter(asset => 
        selectedCollections.includes(asset.collection || '')
      );
    }

    // Price range filter
    filtered = filtered.filter(asset => {
      const price = parseFloat(asset.price);
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(asset => 
        selectedTypes.includes(asset.type || '')
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(asset => 
        selectedCategories.includes(asset.category || '')
      );
    }

    setFilteredAssets(filtered);
  }, [assets, selectedCollections, priceRange, selectedTypes, selectedCategories]);

  const fetchNFTs = async () => {
    setIsLoading(true);
    const provider = new AnchorProvider(connection, wallet as Wallet, {});

    try {
      const listings = await getNFTList(provider, connection);
      const promises = listings
        .filter((list) => list.isActive)
        .map((list) => {
          const mint = new PublicKey(list.mint);
          return getNFTDetail(
            mint,
            connection,
            list.seller,
            list.price,
            list.pubkey
          );
        });
      const detailedListings = await Promise.all(promises);

      setAssets(detailedListings);
    } catch (errr) {
      console.log(errr);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter toggle and reset functions
  const toggleCollection = (collection: string) => {
    setSelectedCollections(prev => 
      prev.includes(collection) 
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const resetFilters = () => {
    setSelectedCollections([]);
    setSelectedTypes([]);
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 1000 });
  };

  return (
    <div className="p-4 pt-20 bg-white dark:bg-black min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          NFTs on sale
        </h1>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
        >
          <FaFilter />
          <span>Filters</span>
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Collections Filter */}
            <div>
              <h3 className="font-semibold mb-2">Collections</h3>
              {collections.map(collection => (
                <label key={collection} className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={selectedCollections.includes(collection)}
                    onChange={() => toggleCollection(collection)}
                    className="form-checkbox"
                  />
                  <span>{collection}</span>
                </label>
              ))}
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 className="font-semibold mb-2">Price Range</h3>
              <div className="flex space-x-2">
                <input 
                  type="number" 
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  placeholder="Min"
                  className="w-full p-2 border rounded"
                />
                <input 
                  type="number" 
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  placeholder="Max"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            {/* Types Filter */}
            <div>
              <h3 className="font-semibold mb-2">Types</h3>
              {types.map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="form-checkbox"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>

            {/* Categories Filter */}
            <div>
              <h3 className="font-semibold mb-2">Categories</h3>
              {categories.map(category => (
                <label key={category} className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="form-checkbox"
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button 
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-64 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredAssets.length > 0 ? (
        <>
          <div className="mb-4 text-gray-600 dark:text-gray-400">
            Showing {filteredAssets.length} of {assets.length} NFTs
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset: NFTDetail) => (
              <div
                key={asset.mint}
                className="relative p-4 border rounded shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer bg-white dark:bg-black group"
              >
                <Link href={`/marketplace/${asset.mint}`}>
                  <div className="relative h-64 w-full mb-4">
                    {asset.image ? (
                      <Image
                        src={asset.image}
                        alt={`Asset ${asset.mint}`}
                        layout="fill"
                        objectFit="contain"
                        className="rounded"
                      />
                    ) : (
                      <p>No Image Available</p>
                    )}
                  </div>
                </Link>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity flex flex-col justify-end items-center opacity-0 group-hover:opacity-100 text-white text-xs p-2">
                  <p className="font-semibold">{asset.name || "Unknown"}</p>
                  <p>Price: {asset.price} SOL</p>
                  {asset.collection && <p>Collection: {asset.collection}</p>}
                  {asset.type && <p>Type: {asset.type}</p>}
                  <Link
                    href={`https://solana.fm/address/${asset.mint}`}
                    target="_blank"
                    className="hover:text-gray-300 flex items-center"
                  >
                    {trimAddress(asset.mint)}{" "}
                    <FaExternalLinkAlt className="ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <h2 className="text-2xl font-bold mb-4 text-center text-red-500 dark:text-yellow">
          No NFTs match the current filters
        </h2>
      )}
    </div>
  );
};

export default Closet;