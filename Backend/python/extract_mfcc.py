import librosa
import numpy as np
import sys
import json

# Load audio file (path passed from Node.js)
audio_path = sys.argv[1]
y, sr = librosa.load(audio_path, duration=3)  # Analyze first 3 seconds

# Extract MFCC features (13 coefficients)
mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
mfcc_mean = np.mean(mfcc, axis=1)  # Average across frames

# Output as JSON for Node.js
print(json.dumps(mfcc_mean.tolist()))