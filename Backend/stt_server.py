from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os

app = Flask(__name__)
CORS(app)

# Load Whisper model
model = whisper.load_model("tiny")  # Options: tiny, base, small, medium, large

@app.route('/stt', methods=['POST'])
def transcribe():
    if 'voice' not in request.files:
        return jsonify({"error": "No voice file uploaded"}), 400

    file = request.files['voice']

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        file.save(temp_file.name)
        temp_path = temp_file.name

    try:
        print(f"🔊 Transcribing: {temp_path}")
        result = model.transcribe(temp_path)
        return jsonify({"text": result["text"].strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
