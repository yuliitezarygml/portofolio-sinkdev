import React, { useState } from 'react';
import { Play, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface VideoExtractorState {
  url: string;
  videoUrl: string | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const VideoExtractor: React.FC = () => {
  const [state, setState] = useState<VideoExtractorState>({
    url: '',
    videoUrl: null,
    loading: false,
    error: null,
    success: false
  });

  const API_KEY = "SINKDEVFREE";

  const handleExtract = async () => {
    if (!state.url.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a valid URL' }));
      return;
    }

    if (!state.url.startsWith('https://jut.su/')) {
      setState(prev => ({ ...prev, error: 'URL must be from jut.su' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      success: false,
      videoUrl: null
    }));

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: API_KEY,
          url: state.url
        })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          videoUrl: data.video_url,
          success: true,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.error || 'Failed to extract video',
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Network error',
        loading: false
      }));
    }
  };

  const handleDownload = () => {
    if (state.videoUrl) {
      const link = document.createElement('a');
      link.href = state.videoUrl;
      link.download = 'video.mp4';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const clearResults = () => {
    setState({
      url: '',
      videoUrl: null,
      loading: false,
      error: null,
      success: false
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Jut.su Video Extractor
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Extract video links from jut.su episodes
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Episode URL
          </label>
          <input
            id="url"
            type="url"
            value={state.url}
            onChange={(e) => setState(prev => ({ ...prev, url: e.target.value, error: null }))}
            placeholder="https://jut.su/..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={state.loading}
          />
        </div>

        <button
          onClick={handleExtract}
          disabled={state.loading || !state.url.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {state.loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Extract Video
            </>
          )}
        </button>

        {state.error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{state.error}</span>
          </div>
        )}

        {state.success && state.videoUrl && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700 dark:text-green-300">Video extracted successfully!</span>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={state.videoUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(state.videoUrl || '')}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Video
              </button>
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
        <p>⚠️ This tool is for personal use only. Respect copyright and terms of service.</p>
      </div>
    </div>
  );
};

export default VideoExtractor;