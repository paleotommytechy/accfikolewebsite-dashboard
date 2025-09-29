import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { GiftIcon, CheckCircleIcon } from '../components/ui/Icons';

type DonationStep = 'form' | 'processing' | 'success';
const predefinedAmounts = [1000, 2500, 5000, 10000];
const predefinedFunds = ['Offering', 'Seed of Faith', 'Building Project', 'Welfare Unit', 'Ushering Unit'];

const Giving: React.FC = () => {
    const [step, setStep] = useState<DonationStep>('form');
    const [selectedFund, setSelectedFund] = useState<string>('Offering');
    const [customFund, setCustomFund] = useState<string>('');
    const [selectedAmount, setSelectedAmount] = useState<number>(2500);
    const [customAmount, setCustomAmount] = useState<string>('');

    const handleAmountClick = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount('');
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setCustomAmount(value);
        if (value) {
            setSelectedAmount(0);
        }
    };
    
    const handleFundClick = (fund: string) => {
        setSelectedFund(fund);
        if (fund !== 'Other') {
            setCustomFund('');
        }
    };

    const handleCustomFundInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomFund(e.target.value);
    };

    const finalAmount = customAmount ? parseInt(customAmount, 10) : selectedAmount;
    const finalFundName = selectedFund === 'Other' ? customFund : selectedFund;

    const handleDonate = () => {
        if (finalAmount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        if (!finalFundName.trim()) {
            alert("Please select or specify a fund.");
            return;
        }
        setStep('processing');
        setTimeout(() => {
            setStep('success');
        }, 1500);
    };
    
    const handleStartOver = () => {
        setStep('form');
        setSelectedFund('Offering');
        setCustomFund('');
        setSelectedAmount(2500);
        setCustomAmount('');
    };

    if (step === 'success') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12 animate-fade-in-up">
                <CheckCircleIcon className="w-24 h-24 text-primary-500 mx-auto" />
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mt-6">Thank You!</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    Your generous gift of ₦{finalAmount.toLocaleString()} to the {finalFundName} has been received.
                </p>
                <p className="mt-4 text-gray-500">
                    Your support helps us continue our mission and share God's love in the community.
                </p>
                <Button onClick={handleStartOver} size="lg" className="mt-8">
                    Make Another Gift
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
            <div className="text-center">
                <GiftIcon className="w-16 h-16 mx-auto text-primary-500" />
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mt-4">Giving & Tithes</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7
                </p>
            </div>

            <Card className="!p-6 sm:!p-8">
                <div className="space-y-6">
                    {/* Step 1: Choose a Fund */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">1. Choose a Fund</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {predefinedFunds.map(fund => (
                                <FundButton key={fund} fund={fund} selectedFund={selectedFund} onClick={handleFundClick} />
                            ))}
                            <FundButton fund="Other" selectedFund={selectedFund} onClick={handleFundClick} />
                        </div>
                        {selectedFund === 'Other' && (
                            <div className="mt-4 animate-fade-in-up" style={{ animationDuration: '300ms' }}>
                                <input
                                    type="text"
                                    value={customFund}
                                    onChange={handleCustomFundInputChange}
                                    placeholder="Please specify fund type"
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 font-semibold text-base focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Step 2: Choose an Amount */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">2. Enter an Amount</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {predefinedAmounts.map(amount => (
                                <AmountButton 
                                    key={amount} 
                                    amount={amount}
                                    isActive={selectedAmount === amount}
                                    onClick={() => handleAmountClick(amount)}
                                />
                            ))}
                        </div>
                        <div className="relative mt-4">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                            <input 
                                type="text"
                                value={customAmount}
                                onChange={handleCustomAmountChange}
                                placeholder="Or enter a custom amount"
                                onFocus={() => setSelectedAmount(0)}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 pl-7 pr-4 text-center font-semibold text-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Step 3: Give */}
                    <div>
                        <Button 
                            size="lg" 
                            className="w-full !py-4" 
                            onClick={handleDonate}
                            disabled={finalAmount <= 0 || !finalFundName.trim() || step === 'processing'}
                        >
                            {step === 'processing' ? 'Processing...' : `Give ₦${finalAmount.toLocaleString()} Now`}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

interface FundButtonProps {
    fund: string;
    selectedFund: string;
    onClick: (fund: string) => void;
}
const FundButton: React.FC<FundButtonProps> = ({ fund, selectedFund, onClick }) => {
    const isActive = fund === selectedFund;
    return (
        <button 
            onClick={() => onClick(fund)}
            className={`p-3 rounded-lg text-center font-semibold border-2 transition-all duration-200 text-sm ${
                isActive 
                ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-200' 
                : 'bg-gray-100 dark:bg-dark border-gray-200 dark:border-gray-700 hover:border-primary-400'
            }`}
        >
            {fund}
        </button>
    );
};

interface AmountButtonProps {
    amount: number;
    isActive: boolean;
    onClick: () => void;
}
const AmountButton: React.FC<AmountButtonProps> = ({ amount, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`p-4 rounded-lg text-lg text-center font-bold border-2 transition-all duration-200 ${
            isActive 
            ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-200' 
            : 'bg-gray-100 dark:bg-dark border-gray-200 dark:border-gray-700 hover:border-primary-400'
        }`}
    >
        ₦{amount.toLocaleString()}
    </button>
);

export default Giving;