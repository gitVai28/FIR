import React, { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, StopCircle, ArrowUp } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

const FIRAssistant = () => {
  const [incidentDetails, setIncidentDetails] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Update the transcript reference
        transcriptRef.current = transcriptRef.current + finalTranscript;

        // Update the incident details state
        setIncidentDetails(transcriptRef.current + interimTranscript);
      };

      recognitionRef.current.onend = () => {
        // Ensure the final transcript is set when recognition ends
        setIncidentDetails(transcriptRef.current);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError('Speech recognition error. Please try again.');
      };
    } else {
      console.log('Speech recognition not supported');
      setError('Speech recognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro"});
      const prompt = `
        Based on the following incident description, provide recommendations for appropriate sections and acts for a First Information Report (FIR) in India:

        Incident: ${incidentDetails}

        Please:
        1. Detect the user's language based on the incident description. If it is not in English, translate the recommendations into that language. 
        2. Provide recommendations in the following format:
          - Section No: The relevant section number
          - Title: A short title or description of the section
          - Description: A brief explanation of why this section applies to the incident
        3. Any additional acts or legal provisions that may be relevant should also be included in the user's language.
        4. Make the response concise and structured, ensuring translation if necessary.
        `;



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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        saveRecording(blob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      recognitionRef.current.start();
      setIsRecording(true);
      // Reset the transcript reference when starting a new recording
      transcriptRef.current = '';
    } catch (err) {
      setError('Failed to start recording. Please check your microphone permissions.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async (blob) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Use the incident details as the filename, or a default if empty
      const filename = incidentDetails.trim() ? 
        `${incidentDetails.replace(/[^a-z0-9]/gi, '_')}.webm` : 
        'recorded_incident.webm';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to save recording. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full px-4 sm:px-0">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-6 text-center">FIR Assistant</h1>
            {recommendations && (
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">AI Recommendations:</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap">{recommendations}</pre>
                </div>
              </div>
            )}
            <div className="mb-4 relative">
              <input
                type="text"
                id="incidentDetails"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-20 sm:text-sm border-gray-300 rounded-full py-2 px-4"
                value={incidentDetails}
                onChange={(e) => setIncidentDetails(e.target.value)}
                placeholder="Message"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <StopCircle className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FIRAssistant;