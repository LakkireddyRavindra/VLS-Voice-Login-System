from flask import Flask, request, jsonify
from flask_cors import CORS
from resemblyzer import VoiceEncoder, preprocess_wav
import numpy as np
import io
import soundfile as sf
from pydub import AudioSegment
import tempfile
import os

app = Flask(__name__)
CORS(app)

encoder = VoiceEncoder()

@app.route('/voiceprint', methods=['POST'])
def voiceprint():
    if 'voice' not in request.files:
        return jsonify({"error": "No voice file uploaded"}), 400

    voice_file = request.files['voice']

    # Convert to WAV format using pydub
    try:
        original = AudioSegment.from_file(voice_file)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
            original.export(temp_wav.name, format="wav")
            temp_path = temp_wav.name

        # Read converted .wav file
        wav_np, sr = sf.read(temp_path)
        if wav_np.ndim > 1:
            wav_np = np.mean(wav_np, axis=1)  # Convert to mono
        wav_np = wav_np.astype(np.float32)

        # Generate embedding
        embedding = encoder.embed_utterance(wav_np)
        return jsonify({"embedding": embedding.tolist()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002)
