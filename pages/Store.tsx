
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockStoreItems } from '../services/mockData';
import { useAppContext } from '../context/AppContext';

const Store: React.FC = () => {
    const { currentUser } = useAppContext();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Coin Store</h1>
                <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 text-lg font-bold px-4 py-2 rounded-lg">
                    {currentUser?.coins} Coins
                </div>
            </div>
            
            <p className="text-gray-500">Redeem your hard-earned coins for amazing rewards!</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockStoreItems.map(item => (
                    <Card key={item.id} className="flex flex-col text-center">
                        <div className="text-6xl mx-auto mb-4">{item.icon}</div>
                        <h3 className="text-xl font-bold">{item.name}</h3>
                        <p className="text-gray-500 flex-grow mt-2">{item.description}</p>
                        <div className="mt-4">
                            <p className="text-lg font-semibold text-yellow-500">{item.cost} Coins</p>
                            <Button className="mt-2 w-full" disabled={(currentUser?.coins || 0) < item.cost}>
                                Redeem
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Store;
