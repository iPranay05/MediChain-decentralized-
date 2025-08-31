'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import HealthcareSystem from '../../artifacts/contracts/HealthcareSystem.sol/HealthcareSystem.json';

interface Web3ContextType {
  contract: any;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
  account: string | null;
}

const Web3Context = createContext<Web3ContextType>({
  contract: null,
  connectWallet: async () => {},
  isConnected: false,
  account: null,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [contract, setContract] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);

        // Switch to Avalanche Fuji Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xa869' }], // Chain ID for Avalanche Fuji Testnet
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xa869',
                  chainName: 'Avalanche Fuji Testnet',
                  nativeCurrency: {
                    name: 'AVAX',
                    symbol: 'AVAX',
                    decimals: 18,
                  },
                  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
                },
              ],
            });
          }
        }

        // Create contract instance using ethers v6
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        
        if (!contractAddress) {
          throw new Error('Contract address not found in environment variables');
        }

        const healthcareContract = new ethers.Contract(
          contractAddress,
          HealthcareSystem.abi,
          signer
        );

        setContract(healthcareContract);
      } else {
        alert('Please install MetaMask to use this application');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  useEffect(() => {
    // Check if wallet is already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            connectWallet(); // This will set up the contract
          }
        });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          connectWallet(); // Reinitialize contract with new account
        } else {
          setAccount(null);
          setIsConnected(false);
          setContract(null);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{ contract, connectWallet, isConnected, account }}>
      {children}
    </Web3Context.Provider>
  );
};
