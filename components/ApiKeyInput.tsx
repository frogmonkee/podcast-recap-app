'use client';

import { useState, useEffect } from 'react';
import { ApiKeys } from '@/types';

interface ApiKeyInputProps {
  onKeysChange: (keys: ApiKeys) => void;
}

export default function ApiKeyInput({ onKeysChange }: ApiKeyInputProps) {
  const [keys, setKeys] = useState<ApiKeys>({
    openai: '',
    anthropic: '',
    listenNotes: '',
  });

  // Load keys from localStorage on mount
  useEffect(() => {
    const savedKeys = {
      openai: localStorage.getItem('openai_key') || '',
      anthropic: localStorage.getItem('anthropic_key') || '',
      listenNotes: localStorage.getItem('listennotes_key') || '',
    };
    setKeys(savedKeys);
    onKeysChange(savedKeys);
  }, []);

  const handleKeyChange = (key: keyof ApiKeys, value: string) => {
    const newKeys = { ...keys, [key]: value };
    setKeys(newKeys);

    // Save to localStorage
    localStorage.setItem(`${key}_key`, value);

    onKeysChange(newKeys);
  };

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-900">API Keys</h2>
      <p className="text-sm text-gray-600">
        Your API keys are stored locally in your browser and never sent to our servers.
      </p>

      {/* OpenAI API Key */}
      <div>
        <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">
          OpenAI API Key <span className="text-red-500">*</span>
        </label>
        <input
          id="openai-key"
          type="password"
          value={keys.openai}
          onChange={(e) => handleKeyChange('openai', e.target.value)}
          placeholder="sk-..."
          className={`w-full px-4 py-3 text-base border-2 rounded-lg font-medium
                     focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all
                     ${keys.openai
                       ? 'border-green-500 bg-green-50 text-gray-900'
                       : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                     }`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Used for transcription (Whisper) and text-to-speech. Get it from{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            OpenAI
          </a>
        </p>
      </div>

      {/* Anthropic API Key */}
      <div>
        <label htmlFor="anthropic-key" className="block text-sm font-medium text-gray-700 mb-1">
          Anthropic API Key <span className="text-red-500">*</span>
        </label>
        <input
          id="anthropic-key"
          type="password"
          value={keys.anthropic}
          onChange={(e) => handleKeyChange('anthropic', e.target.value)}
          placeholder="sk-ant-..."
          className={`w-full px-4 py-3 text-base border-2 rounded-lg font-medium
                     focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all
                     ${keys.anthropic
                       ? 'border-green-500 bg-green-50 text-gray-900'
                       : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                     }`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Used for generating summaries. Get it from{' '}
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Anthropic
          </a>
        </p>
      </div>

      {/* Listen Notes API Key (Optional) */}
      <div>
        <label htmlFor="listennotes-key" className="block text-sm font-medium text-gray-700 mb-1">
          Listen Notes API Key <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          id="listennotes-key"
          type="password"
          value={keys.listenNotes}
          onChange={(e) => handleKeyChange('listenNotes', e.target.value)}
          placeholder="..."
          className={`w-full px-4 py-3 text-base border-2 rounded-lg font-medium
                     focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all
                     ${keys.listenNotes
                       ? 'border-green-500 bg-green-50 text-gray-900'
                       : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                     }`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Fallback for audio extraction. Get it from{' '}
          <a
            href="https://www.listennotes.com/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Listen Notes
          </a>
        </p>
      </div>
    </div>
  );
}
