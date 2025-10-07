import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { HeartIcon, CheckCircleIcon, SparklesIcon, CalendarIcon, CheckIcon } from '../components/ui/Icons';

const sponsorshipTiers = [
    {
        name: 'Bronze Partner',
        amount: '₦25,000+',
        color: 'text-amber-600',
        features: ['Social media mention', 'Logo on event slides'],
    },
    {
        name: 'Silver Partner',
        amount: '₦50,000+',
        color: 'text-slate-500',
        features: ['All Bronze benefits', 'Verbal thank you at event', 'Small logo on flyers'],
    },
    {
        name: 'Gold Partner',
        amount: '₦100,000+',
        color: 'text-yellow-500',
        features: ['All Silver benefits', 'Prominent logo placement', 'Dedicated social media post'],
    },
    {
        name: 'Platinum Partner',
        amount: '₦250,000+',
        color: 'text-primary-500',
        features: ['All Gold benefits', 'Banner at the event', 'Named as "Presenting Sponsor"'],
    },
];

const upcomingEvents = [
    { name: 'Workers Retreat', date: 'October 2-4, 2025' },
    { name: 'Worship Event', date: 'December 2025' },
    { name: "Brethren's Week", date: 'April 2026' },
];

const SponsorshipTierCard: React.FC<{ tier: typeof sponsorshipTiers[0] }> = ({ tier }) => (
    <div className="border dark:border-gray-700 rounded-lg p-6 flex flex-col h-full">
        <SparklesIcon className={`w-8 h-8 mb-4 ${tier.color}`} />
        <h3 className={`text-xl font-bold ${tier.color}`}>{tier.name}</h3>
        <p className="text-2xl font-bold my-2 text-gray-800 dark:text-white">{tier.amount}</p>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 my-4 flex-grow">
            {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <Button variant="outline" className="w-full mt-auto">Select Tier</Button>
    </div>
);

const Sponsorships: React.FC = () => {
    const [formState, setFormState] = useState({
        name: '',
        organization: '',
        email: '',
        phone: '',
        interest: '',
        message: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the data to a backend or service like Supabase
        console.log('Sponsorship Inquiry:', formState);
        setIsSubmitted(true);
        window.scrollTo(0, 0); // Scroll to top to show success message
    };

    if (isSubmitted) {
        return (
            <div className="max-w-3xl mx-auto text-center py-12 animate-fade-in-up">
                <CheckCircleIcon className="w-24 h-24 text-primary-500 mx-auto" />
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mt-6">Thank You for Your Interest!</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    We have received your sponsorship inquiry. A member of our team will reach out to you shortly to discuss the next steps.
                </p>
                <p className="mt-4 text-gray-500">
                    Your partnership is a blessing to our fellowship and community.
                </p>
                <Button onClick={() => setIsSubmitted(false)} size="lg" className="mt-8">
                    Submit Another Inquiry
                </Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-12 animate-fade-in-up">
            <div className="text-center">
                <HeartIcon className="w-16 h-16 mx-auto text-primary-500" />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mt-4">Partner With Our Mission</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 max-w-3xl mx-auto">
                    By sponsoring our events and ministries, you empower us to reach our campus and community with the message of hope and love. Join us in making a lasting impact.
                </p>
            </div>

            <section>
                <h2 className="text-3xl font-bold text-center mb-8">Sponsorship Packages</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sponsorshipTiers.map(tier => <SponsorshipTierCard key={tier.name} tier={tier} />)}
                </div>
            </section>
            
            <section>
                <h2 className="text-3xl font-bold text-center mb-8">Sponsor a Specific Event</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {upcomingEvents.map(event => (
                        <Card key={event.name} className="text-center">
                            <CalendarIcon className="w-10 h-10 text-primary-500 mx-auto mb-3" />
                            <h3 className="text-xl font-bold">{event.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{event.date}</p>
                            <Button variant="primary">Sponsor this Event</Button>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                 <Card>
                    <h2 className="text-3xl font-bold text-center mb-8">Become a Sponsor</h2>
                     <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Full Name" name="name" value={formState.name} onChange={handleInputChange} required />
                            <InputField label="Company / Organization (optional)" name="organization" value={formState.organization} onChange={handleInputChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <InputField label="Email Address" name="email" type="email" value={formState.email} onChange={handleInputChange} required />
                           <InputField label="Phone Number" name="phone" type="tel" value={formState.phone} onChange={handleInputChange} />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Sponsorship Interest</label>
                            <select name="interest" value={formState.interest} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
                                <option value="" disabled>Select an option...</option>
                                {sponsorshipTiers.map(t => <option key={t.name} value={t.name}>{t.name} - {t.amount}</option>)}
                                {upcomingEvents.map(e => <option key={e.name} value={e.name}>Sponsor {e.name}</option>)}
                                <option value="General Inquiry">General Inquiry</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Message (optional)</label>
                            <textarea name="message" value={formState.message} onChange={handleInputChange} rows={4} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Tell us more about how you'd like to partner with us..."></textarea>
                        </div>
                        <div className="text-center pt-4">
                            <Button type="submit" size="lg">Submit Inquiry</Button>
                        </div>
                     </form>
                </Card>
            </section>
        </div>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <input {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);


export default Sponsorships;