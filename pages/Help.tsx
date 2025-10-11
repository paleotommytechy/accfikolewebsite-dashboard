
// This is a new file: pages/Help.tsx
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ChevronDownIcon, ChatIcon, BookOpenIcon, EmailIcon } from '../components/ui/Icons';
import { useNavigate } from 'react-router-dom';

const faqs = [
    {
        question: 'How do I complete my profile?',
        answer: 'Navigate to the "My Profile" page from the sidebar. If your profile is incomplete, you will see an "Edit Profile" button. Click it to fill in your details and then press "Save Changes". Completing your profile gives you full access to all dashboard features.',
    },
    {
        question: 'How do coins and levels work?',
        answer: 'You earn coins by completing daily tasks and weekly challenges. As you earn coins, you also gain experience points (XP) which help you level up. Your current coins and level are displayed on your profile and on the dashboard. Coins can eventually be used in the Coin Store for rewards.',
    },
    {
        question: 'What happens if I miss a daily task?',
        answer: 'Daily tasks reset every day. If you miss a task, you miss the coin reward for that day. Don\'t worry, new tasks will be available the next day! The goal is consistency, not perfection.',
    },
    {
        question: 'How do I join a weekly challenge?',
        answer: 'Go to the "Tasks & Challenges" page. If there is an active weekly challenge, you will see a "Join Challenge" button. Click it to participate and become eligible for the reward upon completion.',
    },
    {
        question: 'Where can I see who is leading in points?',
        answer: 'The "Leaderboard" page shows the top members ranked by the number of coins they have earned. You can see your own ranking there as well.',
    },
];

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b dark:border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-left font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span>{title}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-600 dark:text-gray-300 animate-fade-in-up" style={{animationDuration: '300ms'}}>
          {children}
        </div>
      )}
    </div>
  );
};


const Help: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <BookOpenIcon className="w-16 h-16 mx-auto text-primary-500" />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mt-4">Help & Support</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    Find answers to common questions and learn how to get the most out of the dashboard.
                </p>
            </div>

            <Card title="Frequently Asked Questions">
                <div className="divide-y dark:divide-gray-700">
                    {faqs.map((faq, index) => (
                        <Collapsible key={index} title={faq.question}>
                            <p>{faq.answer}</p>
                        </Collapsible>
                    ))}
                </div>
            </Card>

            <Card>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Contact an Admin</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-4">Have a specific question or need direct assistance? Reach out to the fellowship administrators via WhatsApp or Email.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                                href="https://wa.me/2349028168649" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto flex-1 bg-green-500 hover:bg-green-600 text-white"
                            >
                                <ChatIcon className="w-5 h-5 mr-2"/> Contact via WhatsApp
                            </Button>
                            <Button 
                                href="mailto:accfikolechapter001@gmail.com?subject=Admin Support Request"
                                variant="outline"
                                className="w-full sm:w-auto flex-1"
                            >
                                <EmailIcon className="w-5 h-5 mr-2"/> Contact via Email
                            </Button>
                        </div>
                    </div>
                     <div className="border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Send Feedback</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-4">Have an idea for a new feature or found a bug? We'd love to hear from you. Your feedback helps us improve.</p>
                        <Button 
                            href="mailto:accfikolechapter001@gmail.com?subject=Dashboard Feedback"
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            Send Feedback
                        </Button>
                    </div>
                 </div>
            </Card>
        </div>
    );
};

export default Help;
