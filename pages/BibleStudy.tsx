
import React from 'react';
import Card from '../components/ui/Card';
import { mockStudyProgress } from '../services/mockData';
import type { StudyProgress } from '../types';

const ProgressItem: React.FC<{ progress: StudyProgress }> = ({ progress }) => {
    const percentage = Math.round((progress.chapters / progress.total_chapters) * 100);
    return (
        <div className="p-4 border dark:border-gray-700 rounded-lg">
            <h3 className="font-semibold text-lg">{progress.book}</h3>
            <p className="text-sm text-gray-500">{progress.chapters} / {progress.total_chapters} chapters</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
             <p className="text-right text-xs text-gray-500 mt-1">{percentage}% complete</p>
        </div>
    );
}

const BibleStudy: React.FC = () => {
    const oldTestament = mockStudyProgress.filter(p => p.book === 'Genesis' || p.book === 'Psalms');
    const newTestament = mockStudyProgress.filter(p => p.book === 'John' || p.book === 'Romans');

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bible Study Progress</h1>

            <Card title="Old Testament">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {oldTestament.map(item => <ProgressItem key={item.book} progress={item} />)}
                </div>
            </Card>

            <Card title="New Testament">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newTestament.map(item => <ProgressItem key={item.book} progress={item} />)}
                </div>
            </Card>
        </div>
    );
};

export default BibleStudy;