import React, { useEffect, useLayoutEffect } from 'react';

type AutoSaveFieldProps = (
  | (Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
      as: 'textarea';
      value: string;
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    })
  | (Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
      as?: 'input';
      value: string;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    })
) & {
  storageKey: string;
};

const AutoSaveField: React.FC<AutoSaveFieldProps> = ({ storageKey, value, onChange, as = 'input', ...props }) => {
    // Restore on mount
    useLayoutEffect(() => {
        const savedContent = localStorage.getItem(storageKey);
        // Only restore if the current value is empty and there's saved content.
        // This prevents overwriting state that might be loaded from a DB (e.g., editing an existing post).
        if (savedContent && !value) {
            const event = {
                target: { value: savedContent, name: props.name }
            } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
            onChange(event as any); // Using 'any' to satisfy the specific onChange type
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    // Debounced save to localStorage
    useEffect(() => {
        const handler = setTimeout(() => {
            if (value) {
                localStorage.setItem(storageKey, value as string);
            } else {
                // If the value is empty, remove the key to avoid unnecessary storage
                // and to make the beforeunload check simpler.
                localStorage.removeItem(storageKey);
            }
        }, 500); // 500ms debounce delay

        return () => clearTimeout(handler);
    }, [value, storageKey]);

    // Warn on page exit
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Check localStorage directly for this component's key
            if (localStorage.getItem(storageKey)) {
                e.preventDefault();
                e.returnValue = ''; // Required for some browsers
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [storageKey]);

    if (as === 'textarea') {
        return <textarea value={value || ''} onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void} {...(props as Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>)} />;
    }
    return <input value={value || ''} onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void} {...(props as Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>)} />;
};

export default AutoSaveField;
