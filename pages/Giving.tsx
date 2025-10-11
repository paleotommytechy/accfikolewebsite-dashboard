
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { GiftIcon, CheckCircleIcon, CopyIcon } from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';

type DonationStep = 'form' | 'processing' | 'success';
const predefinedAmounts = [1000, 2500, 5000, 10000];
const predefinedFunds = ['Offering', 'Seed of Faith', 'Building Project', 'Welfare Unit', 'Ushering Unit'];

const Giving: React.FC = () => {
    const { addToast } = useNotifier();
    const { currentUser } = useAppContext();
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

    const handleDonate = async () => {
        if (finalAmount <= 0) {
            addToast("Please enter a valid amount.", 'error');
            return;
        }
        if (!finalFundName.trim()) {
            addToast("Please select or specify a fund.", 'error');
            return;
        }
        if (!currentUser || !supabase) {
            addToast("You must be logged in to record a gift.", 'error');
            return;
        }

        setStep('processing');

        const { error } = await supabase.from('donations').insert({
            user_id: currentUser.id,
            amount: finalAmount,
            fund_name: finalFundName,
            status: 'pending'
        });

        if (error) {
            addToast('Error recording your gift: ' + error.message, 'error');
            setStep('form');
        } else {
            setTimeout(() => {
                setStep('success');
            }, 1000);
        }
    };
    
    const handleStartOver = () => {
        setStep('form');
        setSelectedFund('Offering');
        setCustomFund('');
        setSelectedAmount(2500);
        setCustomAmount('');
    };
    
    const handleCopyAccountNumber = () => {
        navigator.clipboard.writeText('5112072735');
        addToast('Account number copied!', 'success');
    };

    if (step === 'success') {
        return (
            <div className="max-w-2xl mx-auto text-center py-12 animate-fade-in-up">
                <CheckCircleIcon className="w-24 h-24 text-primary-500 mx-auto" />
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mt-6">Thank You for Your Gift!</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    Your intention to give ₦{finalAmount.toLocaleString()} to the {finalFundName} has been recorded.
                </p>
                <div className="mt-6 text-gray-500 font-semibold text-base bg-yellow-100 dark:bg-yellow-900/50 p-4 rounded-lg">
                    <p className="font-bold text-lg text-yellow-800 dark:text-yellow-200">Important Next Step</p>
                    <p className="mt-1 text-yellow-700 dark:text-yellow-300">Please send your proof of payment to complete the process.</p>
                     <div className="mt-2 text-sm">
                        <p>WhatsApp: <a href="https://wa.me/2349028168649" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">+2349028168649</a> or <a href="https://wa.me/2347025953133" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">+2347025953133</a></p>
                        <p>Email: <a href="mailto:accfikolechapter001@gmail.com" className="text-primary-600 hover:underline">accfikolechapter001@gmail.com</a></p>
                    </div>
                </div>
                <Button onClick={handleStartOver} size="lg" className="mt-8">
                    Record Another Gift
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
            <div className="text-center">
                <GiftIcon className="w-16 h-16 mx-auto text-primary-500" />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mt-4">Giving</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7
                </p>
            </div>
            
            <Card>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">How to Give</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Please make a transfer to the account details below. After your transfer, use the form to record your giving and then send us the proof of payment.</p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Account Name:</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Toluwani Precious Adebule</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Bank:</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">Monie Point</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Account Number:</span>
                        <div className="flex items-center gap-2">
                           <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">5112072735</span>
                           <Button variant="ghost" size="sm" onClick={handleCopyAccountNumber} aria-label="Copy account number">
                                <CopyIcon className="w-4 h-4" />
                           </Button>
                        </div>
                    </div>
                </div>
                 <div className="mt-4 border-t dark:border-gray-700 pt-4">
                     <h3 className="font-semibold text-gray-800 dark:text-gray-100">After Transferring:</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please send your proof of payment to one of the following:</p>
                     <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                         <li>WhatsApp: <a href="https://wa.me/2349028168649" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">+2349028168649</a> or <a href="https://wa.me/2347025953133" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">+2347025953133</a></li>
                         <li>Email: <a href="mailto:accfikolechapter001@gmail.com" className="text-primary-600 hover:underline">accfikolechapter001@gmail.com</a></li>
                     </ul>
                 </div>
            </Card>

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
                         <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">3. Record Your Gift</h2>
                        <Button 
                            size="lg" 
                            className="w-full !py-4" 
                            onClick={handleDonate}
                            disabled={finalAmount <= 0 || !finalFundName.trim() || step === 'processing'}
                        >
                            {step === 'processing' ? 'Recording...' : `Record Gift of ₦${finalAmount.toLocaleString()}`}
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
