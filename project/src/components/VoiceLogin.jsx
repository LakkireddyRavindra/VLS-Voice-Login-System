import React, { useState, useRef } from 'react';
import { Mic, MicOff, Play, Square, ArrowLeft, Loader, Check } from 'lucide-react';

export default function VoiceLogin({ onBack, onVoiceLogin, type }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [email, setEmail] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [multipleMatchDetected, setMultipleMatchDetected] = useState(false);


  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // 🔗 DATABASE CONNECTION POINT #5: Audio Processing
        // This is where the audio blob is created and would be sent to backend
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());

        console.log('🔗 AUDIO READY FOR BACKEND:', {
          size: blob.size,
          type: blob.type,
          duration: recordingTime
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('voice', audioBlob, 'voice.wav');

      // Include email for enroll or when resolving multiple match
      if (type === 'enroll' || multipleMatchDetected || email) {
        formData.append('userId', email.trim());
      }

      const endpoint = type === 'enroll'
        ? 'http://localhost:3000/api/voice-enroll'
        : 'http://localhost:3000/api/voice-login';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setIsProcessing(false);
        throw new Error(data.message || 'Voice authentication failed');
      }

      if (data.status === 'multiple_matches') {
        setMultipleMatchDetected(true);
        alert('Multiple voice matches found. Please enter your email to confirm.');
        setIsProcessing(false);
        return;
      }

      // ✅ SUCCESS: login
      onVoiceLogin(audioBlob, data.email || email);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', data.email);
      setIsProcessing(false);

    } catch (err) {
      console.error('❌ Voice Auth Error:', err);
      alert(err.message);
      setIsProcessing(false);
    }
  };


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={onBack}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {type === 'login' ? 'Voice Login' : 'Voice Enrollment'}
            </h1>
            <p className="text-gray-600 mt-2">
              {type === 'login'
                ? 'Speak to authenticate'
                : 'Record your voice for future logins'
              }
            </p>
          </div>

          {/* Email field for enrollment */}
          {(type === 'enroll' || multipleMatchDetected) && (
            <div className="mb-6">
              <label htmlFor="voice-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="voice-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>
          )}


          {/* Recording Interface */}
          <div className="space-y-6">
            {/* Recording Button */}
            <div className="text-center">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all flex items-center justify-center group disabled:opacity-50"
                >
                  <Mic className="h-8 w-8 group-hover:scale-110 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-24 h-24 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all flex items-center justify-center animate-pulse"
                >
                  <Square className="h-8 w-8" />
                </button>
              )}

              <p className="mt-3 text-sm text-gray-600">
                {isRecording
                  ? `Recording... ${formatTime(recordingTime)}`
                  : audioBlob
                    ? 'Recording complete'
                    : 'Tap to start recording'
                }
              </p>
            </div>

            {/* Audio Controls */}
            {audioBlob && !isRecording && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={playRecording}
                    disabled={isPlaying}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    <span>{isPlaying ? 'Playing...' : 'Play Recording'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setAudioBlob(null);
                      setRecordingTime(0);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <MicOff className="h-4 w-4" />
                    <span>Re-record</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      {type === 'login' ? 'Authenticate' : 'Complete Enrollment'}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Speak clearly in a quiet environment</li>
                <li>• Record for at least 3-5 seconds</li>
                <li>• Say a phrase like "Hello, this is my voice"</li>
                {type === 'enroll' && <li>• Your voice will be saved for future logins</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}