from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os

app = Flask(__name__)
CORS(app)

model = whisper.load_model("tiny")  # Options: tiny, base, small, medium, large

@app.route('/stt', methods=['POST'])
def transcribe():
    if 'voice' not in request.files:
        return jsonify({"error": "No voice file uploaded"}), 400

    file = request.files['voice']
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp:
        file.save(temp.name)
        temp_path = temp.name  # Save the path before closing the file

    try:
        result = model.transcribe(temp_path)
        return jsonify({"text": result["text"].strip()})
    finally:
        os.unlink(temp_path)  # Delete only after Whisper is done

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
