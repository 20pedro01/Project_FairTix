import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FairTixApp } from "./FairTixApp";

function App() {
  return (
        <div className="min-h-screen bg-gray-900 text-white">
                    <nav className="p-4 flex justify-between items-center border-b border-gray-800">
                                        <h1 className="text-2xl font-bold text-purple-500">FairTix</h1>
                                                                    <WalletMultiButton />
                                                                                                      </nav>
                                                                                                                                              <main className="p-4">
                                                                                                                                                                                              <FairTixApp />
                                                                                                                                                                                                                                                    </main>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  export default App;