
import React from 'react';
import Card from '../components/ui/Card';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h1>
      <Card title="Application Settings">
        <p>This is a placeholder for application settings. Admins can manage things like the Scripture of the Day, create group challenges, or manage users from here.</p>
      </Card>
       <Card title="Notification Settings">
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label htmlFor="email-notifs">Email Notifications</label>
                <input type="checkbox" id="email-notifs" className="toggle-checkbox" />
            </div>
             <div className="flex justify-between items-center">
                <label htmlFor="push-notifs">Push Notifications</label>
                <input type="checkbox" id="push-notifs" className="toggle-checkbox" defaultChecked />
            </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
