import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS
from routes.schools import schools_bp
from routes.metrics import metrics_bp
from routes.chat    import chat_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(schools_bp)
app.register_blueprint(metrics_bp)
app.register_blueprint(chat_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5000)