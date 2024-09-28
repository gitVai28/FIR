import React, { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

const FIRAssistant = () => {
  const [incidentDetails, setIncidentDetails] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Call Gemini API
      const model = genAI.getGenerativeModel({ model: "gemini-pro"});
      const prompt = `Based on the following incident description, provide recommendations for appropriate sections and acts for a First Information Report (FIR) in India:

      Incident: ${incidentDetails}

      Please provide:
      1. Recommended sections of the Indian Penal Code (IPC) or other relevant laws
      2. Brief explanations for why each section is applicable
      3. Any additional acts or legal provisions that may be relevant

      Format the response in a clear, structured manner.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setRecommendations(text);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIncidentDetails(transcript);
      };
      recognition.onerror = () => {
        setError('Speech recognition failed. Please try again or use text input.');
      };
      recognition.start();
    } else {
      setError('Speech recognition is not supported in your browser. Please use text input.');
    }
  };

  const formatRecommendations = (text) => {
    const sections = text.split('\n\n');
    return sections.map((section, index) => {
      if (section.startsWith('1. Recommended Sections')) {
        return <h3 key={index} className="font-bold text-lg mt-4 mb-2">{section}</h3>;
      }
      const lines = section.split('\n');
      return (
        <div key={index} className="mb-4">
          {lines.map((line, lineIndex) => {
            if (line.startsWith('*')) {
              return <p key={lineIndex} className="font-semibold mt-2">{line.replace('*', '').trim()}</p>;
            }
            return <p key={lineIndex} className="ml-4">{line.trim()}</p>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-6 text-center">FIR Assistant.</h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="incidentDetails" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the incident:
                </label>
                <textarea
                  id="incidentDetails"
                  rows="4"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    'Get Recommendations'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Voice Input
                </button>
              </div>
            </form>
            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
            {recommendations && (
              <div className="mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">AI Recommendations:</h2>
                <div className="bg-gray-50 p-6 rounded-md shadow-sm">
                  {formatRecommendations(recommendations)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FIRAssistant;