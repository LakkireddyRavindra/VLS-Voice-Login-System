from flask import Flask, request, jsonify
from flask_cors import CORS
from resemblyzer import VoiceEncoder, preprocess_wav
import numpy as np
import io
import soundfile as sf

app = Flask(__name__)
CORS(app)

encoder = VoiceEncoder()

@app.route('/voiceprint', methods=['POST'])
def voiceprint():
    if 'voice' not in request.files:
        return jsonify({"error": "No voice file uploaded"}), 400

    voice_file = request.files['voice']
    wav_bytes = voice_file.read()
    wav_stream = io.BytesIO(wav_bytes)

    try:
        wav_np, sr = sf.read(wav_stream)
        if wav_np.ndim > 1:
            wav_np = np.mean(wav_np, axis=1)  # convert to mono if stereo
        wav_np = wav_np.astype(np.float32)
        embedding = encoder.embed_utterance(wav_np)
        return jsonify({"embedding": embedding.tolist()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002)
